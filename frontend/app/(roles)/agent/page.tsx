"use client";

import Link from "next/link";
import { Clock, CheckCircle2, AlertTriangle, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTickets } from "@/lib/hooks/useTickets";
import { StatusBadge, PriorityBadge } from "@/components/tickets/ticket-status-badge";
import { useAuthStore } from "@/lib/store/auth-store";
import { TicketStatus } from "@/lib/types";

export default function AgentDashboard() {
  const user = useAuthStore((s) => s.user);
  const { data: allTickets } = useTickets({ assignedToId: user?.id, limit: 50 });

  const tickets = allTickets?.data ?? [];
  const open = tickets.filter((t) => t.status === TicketStatus.Open || t.status === TicketStatus.Assigned).length;
  const inProgress = tickets.filter((t) => t.status === TicketStatus.InProgress).length;
  const resolved = tickets.filter((t) => t.status === TicketStatus.Resolved || t.status === TicketStatus.Closed).length;
  const escalated = tickets.filter((t) => t.isEscalated).length;

  const activeTickets = tickets
    .filter((t) => ![TicketStatus.Resolved, TicketStatus.Closed].includes(t.status))
    .slice(0, 8);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Your assigned tickets and tasks</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Open", value: open, icon: Clock, color: "bg-blue-500" },
          { title: "In Progress", value: inProgress, icon: Ticket, color: "bg-amber-500" },
          { title: "Resolved", value: resolved, icon: CheckCircle2, color: "bg-emerald-500" },
          { title: "Escalated", value: escalated, icon: AlertTriangle, color: "bg-red-500" },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`size-10 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="size-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.title}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/agent/tickets">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {activeTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/agent/tickets/${ticket.id}`}
                className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground">{ticket.ticketNumber}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </Link>
            ))}
            {activeTickets.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No active tickets — great job!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
