import { TicketList } from "@/components/tickets/ticket-list";

export default function TeamLeaderTicketsPage() {
  return (
    <div className="space-y-4 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Department Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">All tickets in your department</p>
      </div>
      <TicketList rolePrefix="team-leader" />
    </div>
  );
}
