import { TicketList } from "@/components/tickets/ticket-list";

export default function AgentTicketsPage() {
  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">Tickets assigned to you</p>
      </div>
      <TicketList rolePrefix="agent" />
    </div>
  );
}
