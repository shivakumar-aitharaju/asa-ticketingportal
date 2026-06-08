import { TicketList } from "@/components/tickets/ticket-list";

export default function ClientTicketsPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">My Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">All your support requests</p>
      </div>
      <TicketList rolePrefix="client" />
    </div>
  );
}
