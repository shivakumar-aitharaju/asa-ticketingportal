"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  useDashboardOverview, useMonthlyTrend, useStatusDistribution,
  usePriorityDistribution, useResolutionTime, useAgentPerformance,
  useSLATrend, useTicketTrend,
} from "@/lib/hooks/useAnalytics";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart, Line,
  XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";
import { format } from "date-fns";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import type { Department } from "@/lib/types";

const NOW = new Date();
const CUR_MONTH = NOW.getMonth() + 1;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6", in_progress: "#f59e0b", pending_client: "#8b5cf6",
  resolved: "#10b981", closed: "#6b7280", escalated: "#ef4444", reopened: "#f97316",
};

type TimePeriod = "30" | "60" | "90" | "year";

function PeriodTabs({ value, onChange }: { value: TimePeriod; onChange: (v: TimePeriod) => void }) {
  const opts: { label: string; value: TimePeriod }[] = [
    { label: "30 Days", value: "30" },
    { label: "60 Days", value: "60" },
    { label: "90 Days", value: "90" },
    { label: "This Year", value: "year" },
  ];
  return (
    <div className="flex gap-1 p-0.5 rounded-lg bg-muted">
      {opts.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
            value === o.value
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<TimePeriod>("30");
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const deptId = deptFilter !== "all" ? deptFilter : undefined;
  const days = period !== "year" ? parseInt(period) : 90;

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Department[] }>(endpoints.DEPARTMENTS);
      return res.data.data;
    },
  });

  const { data: overview, isLoading } = useDashboardOverview(deptId);
  const { data: monthly } = useMonthlyTrend(NOW.getFullYear(), deptId);
  const { data: trend } = useTicketTrend(days, deptId);
  const { data: statusDist } = useStatusDistribution(deptId);
  const { data: priorityDist } = usePriorityDistribution(deptId);
  const { data: resolution } = useResolutionTime(deptId);
  const { data: agents } = useAgentPerformance(deptId);
  const { data: slaTrend } = useSLATrend(days, deptId);

  // Clip monthly data to current month
  const monthlyData = (monthly ?? [])
    .filter((m) => m.month <= CUR_MONTH)
    .map((m) => ({ label: MONTHS[m.month - 1], created: m.count, resolved: m.resolved }));

  const trendData = (trend ?? []).map((d) => ({
    label: format(new Date(d.date), "MMM d"),
    created: d.count,
  }));

  const chartData = period === "year" ? monthlyData : trendData;
  const chartXKey = "label";

  const statusData = (statusDist ?? []).map((s) => ({
    name: s.status.replace(/_/g, " "),
    value: s.count,
    fill: STATUS_COLORS[s.status] ?? "#94a3b8",
  }));

  const priorityData = (priorityDist ?? []).map((p) => ({
    name: p.priority,
    value: p.count,
  }));

  const slaData = (slaTrend ?? []).map((s) => ({
    date: format(new Date(s.date), "MMM d"),
    met: s.met,
    breached: s.breached,
  }));

  const agentData = (agents ?? []).slice(0, 10).map((a: any) => ({
    name: (a.name as string).split(" ")[0],
    resolved: parseInt(a.resolved_tickets ?? 0),
    open: parseInt(a.open_tickets ?? 0),
    avgHours: parseFloat(a.avg_resolution_hours ?? 0),
  }));

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Full Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Deep-dive system performance metrics — ASA Tickets</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={deptFilter} onValueChange={setDeptFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {departments?.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <PeriodTabs value={period} onChange={setPeriod} />
        </div>
      </div>

      {/* KPI summary row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Tickets", value: overview?.totalTickets },
          { label: "SLA Compliance", value: overview?.slaCompliance !== undefined ? `${overview.slaCompliance}%` : undefined },
          { label: "SLA Breached", value: overview?.slaBreached },
          { label: "Escalated", value: overview?.escalated },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-3xl font-bold mt-1">{s.value ?? 0}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resolution time stats */}
      {resolution && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Avg Resolution Time", value: `${resolution.avgHours}h` },
            { label: "Median (P50)", value: `${resolution.p50Hours}h` },
            { label: "Fastest Resolution", value: `${resolution.fastestHours}h` },
            { label: "Slowest Resolution", value: `${resolution.slowestHours}h` },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-5">
                <p className="text-xs text-muted-foreground font-medium">{s.label}</p>
                <p className="text-3xl font-bold mt-1">{s.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Trend chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            {period === "year" ? `Ticket Volume — ${NOW.getFullYear()} (by month)` : `Ticket Volume — Last ${period} Days`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="aCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="aResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey={chartXKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip />
              {period === "year" && <Legend />}
              <Area type="monotone" dataKey="created" name="Created" stroke="#3b82f6" fill="url(#aCreated)" strokeWidth={2} />
              {period === "year" && (
                <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#10b981" fill="url(#aResolved)" strokeWidth={2} />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Status + Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Importance (Priority) Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={65} className="capitalize" />
                <Tooltip />
                <Bar dataKey="value" name="Tickets" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SLA Trend */}
      {slaData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              SLA Performance — {period === "year" ? "Last 90 Days" : `Last ${period} Days`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={slaData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="met" name="SLA Met" fill="#10b981" radius={[2, 2, 0, 0]} />
                <Bar dataKey="breached" name="SLA Breached" fill="#ef4444" radius={[2, 2, 0, 0]} />
                <Line type="monotone" dataKey="met" stroke="#10b981" dot={false} strokeWidth={1.5} />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Agent performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Agent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {!agents ? (
            <Skeleton className="h-48 w-full" />
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
