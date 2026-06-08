"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Clock, Ticket, Users,
  TrendingUp, Timer, ShieldX, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  useDashboardOverview, useMonthlyTrend, useStatusDistribution,
  usePriorityDistribution, useResolutionTime, useDepartmentBreakdown,
  useTicketTrend,
} from "@/lib/hooks/useAnalytics";
import { useTickets } from "@/lib/hooks/useTickets";
import { StatusBadge, PriorityBadge } from "@/components/tickets/ticket-status-badge";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";

const NOW = new Date();
const CUR_MONTH = NOW.getMonth() + 1;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6", in_progress: "#f59e0b", pending_client: "#8b5cf6",
  resolved: "#10b981", closed: "#6b7280", escalated: "#ef4444", reopened: "#f97316",
};

type Period = "all" | "month" | "week";

function KPICard({ title, value, sub, icon: Icon, color, loading }: {
  title: string; value?: string | number; sub?: string;
  icon: React.ElementType; color: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="size-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          {loading ? <Skeleton className="h-7 w-14 mt-0.5" /> : (
            <p className="text-2xl font-bold leading-tight">{value ?? 0}</p>
          )}
          {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function PeriodButtons({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
      {(["all", "month", "week"] as Period[]).map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === p
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {p === "all" ? "All" : p === "month" ? "This Month" : "This Week"}
        </button>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [period, setPeriod] = useState<Period>("all");

  const { data: ov, isLoading: loadOv } = useDashboardOverview();
  const { data: monthly } = useMonthlyTrend();
  const { data: weekTrend } = useTicketTrend(7);
  const { data: monthTrend } = useTicketTrend(30);
  const { data: statusDist } = useStatusDistribution();
  const { data: priorityDist } = usePriorityDistribution();
  const { data: resolution } = useResolutionTime();
  const { data: deptBreakdown } = useDepartmentBreakdown();
  const { data: recent, isLoading: loadTickets } = useTickets({ limit: 6, page: 1 });

  // Monthly data clipped to current month only
  const allMonthlyData = (monthly ?? [])
    .filter((m) => m.month <= CUR_MONTH)
    .map((m) => ({ label: MONTHS[m.month - 1], created: m.count, resolved: m.resolved }));

  const dailyData30 = (monthTrend ?? []).map((d) => ({
    label: format(new Date(d.date), "MMM d"),
    created: d.count,
  }));

  const dailyData7 = (weekTrend ?? []).map((d) => ({
    label: format(new Date(d.date), "EEE"),
    created: d.count,
  }));

  const trendData = period === "week" ? dailyData7 : period === "month" ? dailyData30 : allMonthlyData;
  const showResolved = period === "all";

  const statusData = (statusDist ?? []).map((s) => ({
    name: s.status.replace(/_/g, " "),
    value: s.count,
    fill: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));

  const priorityData = (priorityDist ?? []).map((p) => ({
    name: p.priority,
    value: p.count,
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Full system overview — ASA Tickets</p>
        </div>
        <PeriodButtons value={period} onChange={setPeriod} />
      </div>

      {/* Primary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Tickets" value={ov?.totalTickets} icon={Ticket} color="bg-primary" loading={loadOv} />
        <KPICard title="Open" value={ov?.open} icon={Clock} color="bg-primary" loading={loadOv} />
        <KPICard title="In Progress" value={ov?.inProgress} icon={Activity} color="bg-primary" loading={loadOv} />
        <KPICard title="Resolved" value={ov?.resolved} icon={CheckCircle2} color="bg-primary" loading={loadOv} />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="SLA Compliance" value={ov ? `${ov.slaCompliance}%` : undefined} icon={ShieldX} color="bg-primary" loading={loadOv} sub="percentage on-time" />
        <KPICard title="SLA Breached" value={ov?.slaBreached} icon={AlertTriangle} color="bg-primary" loading={loadOv} />
        <KPICard title="Escalated" value={ov?.escalated} icon={TrendingUp} color="bg-primary" loading={loadOv} />
        <KPICard title="Avg Resolution" value={resolution ? `${resolution.avgHours}h` : undefined} icon={Timer} color="bg-primary" loading={!resolution} sub={resolution ? `Median: ${resolution.p50Hours}h` : undefined} />
      </div>

      {/* Trend chart + Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {period === "all"
                ? `Ticket Volume — ${NOW.getFullYear()}`
                : period === "month" ? "Ticket Volume — Last 30 Days"
                : "Ticket Volume — This Week"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                {showResolved && <Legend />}
                <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" fill="url(#gCreated)" strokeWidth={2} />
                {showResolved && (
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#gResolved)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Priority distribution + Category breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={60} className="capitalize" />
                <Tooltip />
                <Bar dataKey="value" name="Tickets" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left font-medium text-muted-foreground px-4 py-2 text-xs">Category</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-2 text-xs">Total</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-2 text-xs">Open</th>
                  <th className="text-right font-medium text-muted-foreground px-4 py-2 text-xs">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {(deptBreakdown ?? []).slice(0, 8).map((dept: any, i: number) => (
                  <tr key={dept.id ?? i} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2 font-medium truncate max-w-[140px]">{dept.name}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{dept.total_tickets}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-blue-600">{dept.open_tickets}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-600">{dept.resolved_tickets ?? "—"}</td>
                  </tr>
                ))}
                {!deptBreakdown && (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 4 }).map((_, j) => (
                        <td key={j} className="px-4 py-2"><Skeleton className="h-4 w-full" /></td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Tickets</CardTitle>
          <Button asChild variant="outline" size="sm"><Link href="/admin/tickets">View all</Link></Button>
        </CardHeader>
        <CardContent>
          {loadTickets ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="space-y-1">
              {recent?.data.map((ticket) => (
                <Link key={ticket.id} href={`/admin/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" size="sm"><Link href="/admin/users"><Users className="size-4" />Manage Users</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href="/admin/categories"><Activity className="size-4" />Manage Categories</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href="/admin/sla"><Clock className="size-4" />SLA Configurations</Link></Button>
        <Button asChild variant="outline" size="sm"><Link href="/admin/analytics"><TrendingUp className="size-4" />Full Analytics</Link></Button>
      </div>
    </div>
  );
}
