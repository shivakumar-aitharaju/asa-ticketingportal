import { Badge } from "@/components/ui/badge";
import { TicketStatus, Priority, SLAStatus, PRIORITY_LABEL } from "@/lib/types";

const statusConfig: Record<TicketStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  [TicketStatus.Open]: { label: "Open", variant: "info" },
  [TicketStatus.Assigned]: { label: "Assigned", variant: "default" },
  [TicketStatus.InProgress]: { label: "In Progress", variant: "warning" },
  [TicketStatus.PendingClient]: { label: "Pending Client", variant: "secondary" },
  [TicketStatus.Resolved]: { label: "Resolved", variant: "success" },
  [TicketStatus.Closed]: { label: "Closed", variant: "outline" },
  [TicketStatus.Escalated]: { label: "Escalated", variant: "destructive" },
  [TicketStatus.Reopened]: { label: "Reopened", variant: "warning" },
};

const priorityConfig: Record<Priority, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  [Priority.Low]: { label: PRIORITY_LABEL[Priority.Low], variant: "outline" },
  [Priority.Medium]: { label: PRIORITY_LABEL[Priority.Medium], variant: "outline" },
  [Priority.High]: { label: PRIORITY_LABEL[Priority.High], variant: "warning" },
  [Priority.Critical]: { label: PRIORITY_LABEL[Priority.Critical], variant: "destructive" },
};

const slaConfig: Record<SLAStatus, { label: string; variant: "default" | "secondary" | "outline" | "destructive" | "success" | "warning" | "info" }> = {
  [SLAStatus.OnTrack]: { label: "On Track", variant: "success" },
  [SLAStatus.AtRisk]: { label: "At Risk", variant: "warning" },
  [SLAStatus.Breached]: { label: "Breached", variant: "destructive" },
  [SLAStatus.Met]: { label: "Met", variant: "success" },
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  const cfg = statusConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = priorityConfig[priority] ?? { label: priority, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export function SLABadge({ status }: { status: SLAStatus }) {
  const cfg = slaConfig[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}
