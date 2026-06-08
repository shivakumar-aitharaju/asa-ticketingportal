"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, CheckCircle2, Clock, Ticket,
  TrendingUp, Timer, ShieldX, Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useDashboardOverview, useMonthlyTrend, useStatusDistribution,
  useResolutionTime, useAgentPerformance, useTicketTrend,
} from "@/lib/hooks/useAnalytics";
import {
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
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

function KPICard({ title, value, icon: Icon, color, loading, sub }: {
  title: string; value?: string | number; icon: React.ElementType;
  color: string; loading?: boolean; sub?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="size-5 text-white" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium">{title}</p>
          {loading ? <Skeleton className="h-7 w-12 mt-0.5" /> : (
            <p className="text-2xl font-bold">{value ?? 0}</p>
          )}
          {sub && <p className="text-[10px] text-muted-foreground">{sub}</p>}
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

export default function ManagerDashboard() {
  const [period, setPeriod] = useState<Period>("all");

  const { data: ov, isLoading: loadOv } = useDashboardOverview();
  const { data: monthly } = useMonthlyTrend();
  const { data: weekTrend } = useTicketTrend(7);
  const { data: monthTrend } = useTicketTrend(30);
  const { data: statusDist } = useStatusDistribution();
  const { data: resolution } = useResolutionTime();
  const { data: agents } = useAgentPerformance();

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

  const agentData = (agents ?? []).slice(0, 8).map((a: any) => ({
    name: (a.name as string).split(" ")[0],
    resolved: parseInt(a.resolved_tickets ?? 0),
    open: parseInt(a.open_tickets ?? 0),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manager Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Category-wide ticket performance — ASA Tickets</p>
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
        <KPICard title="SLA Compliance" value={ov ? `${ov.slaCompliance}%` : undefined} icon={ShieldX} color="bg-primary" loading={loadOv} />
        <KPICard title="SLA Breached" value={ov?.slaBreached} icon={AlertTriangle} color="bg-primary" loading={loadOv} />
        <KPICard title="Escalated" value={ov?.escalated} icon={TrendingUp} color="bg-primary" loading={loadOv} />
        <KPICard title="Avg Resolution" value={resolution ? `${resolution.avgHours}h` : undefined} icon={Timer} color="bg-primary" loading={!resolution} sub={resolution ? `Median: ${resolution.p50Hours}h` : undefined} />
      </div>

      {/* Trend chart + Status donut */}
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
                  <linearGradient id="mgCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="mgResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                {showResolved && <Legend />}
                <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" fill="url(#mgCreated)" strokeWidth={2} />
                {showResolved && (
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#mgResolved)" strokeWidth={2} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Agent performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={agentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              <Legend />
              <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="open" name="Open" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
