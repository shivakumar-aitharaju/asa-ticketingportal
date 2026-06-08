import { TicketDetail } from "@/components/tickets/ticket-detail";

export default async function ClientTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetail ticketId={id} backHref="/client/tickets" />;
}
