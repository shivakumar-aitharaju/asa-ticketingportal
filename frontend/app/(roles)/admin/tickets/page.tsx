import { TicketList } from "@/components/tickets/ticket-list";

export default function AdminTicketsPage() {
  return (
    <div className="space-y-4 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">All Tickets</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage and monitor all support tickets</p>
      </div>
      <TicketList rolePrefix="admin" />
    </div>
  );
}
