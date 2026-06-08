import type { User, Department } from "./auth.types";

export enum TicketStatus {
  Open = "open",
  Assigned = "assigned",
  InProgress = "in_progress",
  PendingClient = "pending_client",
  Resolved = "resolved",
  Closed = "closed",
  Escalated = "escalated",
  Reopened = "reopened",
}

export enum Priority {
  Low = "low",
  Medium = "medium",
  High = "high",
  Critical = "critical",
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  [Priority.Low]: "Normal",
  [Priority.Medium]: "Normal",
  [Priority.High]: "Important!",
  [Priority.Critical]: "Time Sensitive",
}

export enum SLAStatus {
  OnTrack = "on_track",
  AtRisk = "at_risk",
  Breached = "breached",
  Met = "met",
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface SLATracking {
  id: string;
  ticketId: string;
  firstResponseDue: string;
  resolutionDue: string;
  firstResponseAt?: string | null;
  firstResponseMet?: boolean | null;
  resolvedAt?: string | null;
  resolutionMet?: boolean | null;
  status: SLAStatus;
  pausedAt?: string | null;
  totalPausedMinutes: number;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: Priority;
  isEscalated: boolean;
  tags: string[];
  categoryId: string;
  category?: Category | null;
  departmentId?: string | null;
  department?: Department | null;
  createdById: string;
  createdBy?: User | null;
  assignedToId?: string | null;
  assignedTo?: User | null;
  resolvedAt?: string | null;
  closedAt?: string | null;
  firstResponseAt?: string | null;
  clientRating?: "good" | "bad" | null;
  clientRatedAt?: string | null;
  slaTracking?: SLATracking | null;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  ticketId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  s3Key: string;
  uploadedById: string;
  uploadedBy?: { firstName?: string; lastName?: string } | null;
  createdAt: string;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  content: string;
  isClientFacing: boolean;
  authorId: string;
  author?: User | null;
  createdAt: string;
}

export interface TicketStatusHistory {
  id: string;
  ticketId: string;
  fromStatus?: TicketStatus | null;
  toStatus: TicketStatus;
  changedById: string;
  changedBy?: User | null;
  reason?: string | null;
  createdAt: string;
}

export interface CreateTicketForm {
  subject: string;
  description: string;
  categoryId?: string;
  departmentId?: string;
  priority?: Priority;
  isEscalated?: boolean;
  tags?: string[];
}

export interface TicketFilter {
  status?: TicketStatus;
  priority?: Priority;
  departmentId?: string;
  assignedToId?: string;
  isEscalated?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTickets {
  data: Ticket[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Notification {
  id: string;
  userId: string;
  ticketId?: string | null;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
}
