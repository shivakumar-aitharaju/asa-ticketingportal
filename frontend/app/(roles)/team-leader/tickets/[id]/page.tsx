import { TicketDetail } from "@/components/tickets/ticket-detail";

export default async function TLTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TicketDetail ticketId={id} backHref="/team-leader/tickets" />;
}
