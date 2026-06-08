"use client";

import Link from "next/link";
import { Clock, Ticket, Users, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardOverview } from "@/lib/hooks/useAnalytics";
import { useTickets } from "@/lib/hooks/useTickets";
import { StatusBadge, PriorityBadge } from "@/components/tickets/ticket-status-badge";
import { useAuthStore } from "@/lib/store/auth-store";

export default function TeamLeaderDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: overview, isLoading } = useDashboardOverview(user?.departmentId ?? undefined);
  const { data: tickets } = useTickets({ limit: 8, page: 1 });

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Team Leader Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {user?.department?.name ? `${user.department.name} — ` : ""}Department overview
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total", value: overview?.totalTickets, icon: Ticket, color: "bg-primary" },
          { title: "Open", value: overview?.open, icon: Clock, color: "bg-blue-500" },
          { title: "In Progress", value: overview?.inProgress, icon: Users, color: "bg-amber-500" },
          { title: "Escalated", value: overview?.escalated, icon: AlertTriangle, color: "bg-red-500" },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`size-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="size-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.title}</p>
                {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{s.value ?? 0}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Department Tickets</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/team-leader/tickets">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {tickets?.data.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/team-leader/tickets/${ticket.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">
                    {ticket.ticketNumber} · {ticket.assignedTo
                      ? `${ticket.assignedTo.firstName ?? ""} ${ticket.assignedTo.lastName ?? ""}`.trim()
                      : "Unassigned"}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
            {tickets?.data.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No tickets yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
