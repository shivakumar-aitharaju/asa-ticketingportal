"use client";

import Link from "next/link";
import { Clock, CheckCircle2, PlusCircle, Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTickets } from "@/lib/hooks/useTickets";
import { StatusBadge, PriorityBadge } from "@/components/tickets/ticket-status-badge";
import { TicketStatus } from "@/lib/types";

export default function ClientDashboard() {
  const { data: allTickets, isLoading } = useTickets({ limit: 50 });

  const tickets = allTickets?.data ?? [];
  const open = tickets.filter((t) => [TicketStatus.Open, TicketStatus.Assigned, TicketStatus.InProgress].includes(t.status)).length;
  const pending = tickets.filter((t) => t.status === TicketStatus.PendingClient).length;
  const resolved = tickets.filter((t) => [TicketStatus.Resolved, TicketStatus.Closed].includes(t.status)).length;

  const recentTickets = tickets.slice(0, 6);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Tickets</h1>
          <p className="text-muted-foreground text-sm mt-1">Track your support requests</p>
        </div>
        <Button asChild>
          <Link href="/client/tickets/new">
            <PlusCircle className="size-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { title: "Active", value: open, icon: Clock, color: "bg-blue-500" },
          { title: "Awaiting", value: pending, icon: Ticket, color: "bg-amber-500" },
          { title: "Resolved", value: resolved, icon: CheckCircle2, color: "bg-emerald-500" },
        ].map((s) => (
          <Card key={s.title}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`size-9 rounded-lg flex items-center justify-center ${s.color}`}>
                <s.icon className="size-4 text-white" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{s.title}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Recent Tickets</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href="/client/tickets">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Loading...</p>
          ) : recentTickets.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <Ticket className="size-10 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">You haven&apos;t raised any tickets yet.</p>
              <Button asChild size="sm">
                <Link href="/client/tickets/new">
                  <PlusCircle className="size-4" />
                  Raise a ticket
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/client/tickets/${ticket.id}`}
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
