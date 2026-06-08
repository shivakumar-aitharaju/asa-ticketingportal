import { TicketList } from "@/components/tickets/ticket-list";

export default function ManagerTicketsPage() {
  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">All Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">Organization-wide ticket overview</p>
      </div>
      <TicketList rolePrefix="manager" />
    </div>
  );
}
