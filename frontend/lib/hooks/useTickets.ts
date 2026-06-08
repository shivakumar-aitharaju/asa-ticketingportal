import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import type {
  Ticket,
  PaginatedTickets,
  TicketMessage,
  SLATracking,
  TicketFilter,
  CreateTicketForm,
  TicketStatusHistory,
  Attachment,
} from "@/lib/types";

export function useTickets(filter?: TicketFilter) {
  return useQuery({
    queryKey: ["tickets", filter],
    queryFn: async () => {
      const res = await apiClient.get<PaginatedTickets>(endpoints.TICKETS, { params: filter });
      return res.data;
    },
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ["tickets", id],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Ticket }>(endpoints.TICKETS_BY_ID(id));
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ["tickets", ticketId, "messages"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: TicketMessage[] }>(endpoints.TICKETS_MESSAGES(ticketId));
      return res.data.data;
    },
    enabled: !!ticketId,
  });
}

export function useTicketSLA(ticketId: string) {
  return useQuery({
    queryKey: ["tickets", ticketId, "sla"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SLATracking }>(endpoints.TICKETS_SLA(ticketId));
      return res.data.data;
    },
    enabled: !!ticketId,
  });
}

export function useTicketHistory(ticketId: string) {
  return useQuery({
    queryKey: ["tickets", ticketId, "history"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: TicketStatusHistory[] }>(endpoints.TICKETS_HISTORY(ticketId));
      return res.data.data;
    },
    enabled: !!ticketId,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTicketForm) => {
      const res = await apiClient.post<{ data: Ticket }>(endpoints.TICKETS, data);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useAddMessage(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { content: string; isClientFacing?: boolean }) => {
      const res = await apiClient.post<{ data: TicketMessage }>(
        endpoints.TICKETS_MESSAGES(ticketId),
        data
      );
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets", ticketId] }),
  });
}

export function useAssignTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { agentId: string; reason?: string }) => {
      const res = await apiClient.post(endpoints.TICKETS_ASSIGN(ticketId), data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useResolveTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { resolutionSummary: string }) => {
      const res = await apiClient.post(endpoints.TICKETS_RESOLVE(ticketId), data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useCloseTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post(endpoints.TICKETS_CLOSE(ticketId));
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useEscalateTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reason: string }) => {
      const res = await apiClient.post(endpoints.TICKETS_ESCALATE(ticketId), data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useReopenTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { reason: string }) => {
      const res = await apiClient.post(endpoints.TICKETS_REOPEN(ticketId), data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useClientResolveTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<{ data: Ticket }>(endpoints.TICKETS_CLIENT_RESOLVE(ticketId));
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets"] }),
  });
}

export function useRateTicket(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (rating: "good" | "bad") => {
      await apiClient.post(endpoints.TICKETS_RATE(ticketId), { rating });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets", ticketId] }),
  });
}

export function useTicketAttachments(ticketId: string) {
  return useQuery({
    queryKey: ["tickets", ticketId, "attachments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Attachment[] }>(endpoints.TICKETS_ATTACHMENTS(ticketId));
      return res.data.data;
    },
    enabled: !!ticketId,
  });
}

export function useUploadAttachment(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await apiClient.post<{ data: Attachment }>(
        endpoints.TICKETS_ATTACHMENTS(ticketId),
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets", ticketId, "attachments"] }),
  });
}

export function useDeleteAttachment(ticketId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: string) => {
      await apiClient.delete(endpoints.TICKETS_ATTACHMENT_DELETE(ticketId, attachmentId));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tickets", ticketId, "attachments"] }),
  });
}

export function useGetAttachmentUrl() {
  return useMutation({
    mutationFn: async ({ ticketId, attachmentId }: { ticketId: string; attachmentId: string }) => {
      const res = await apiClient.get<{ data: { url: string } }>(
        endpoints.TICKETS_ATTACHMENT_URL(ticketId, attachmentId)
      );
      return res.data.data.url;
    },
  });
}

export function useUsers(params?: { role?: string; departmentId?: string }) {
  return useQuery({
    queryKey: ["users", params],
    queryFn: async () => {
      const res = await apiClient.get<{ data: { data: Array<{ id: string; firstName: string; lastName: string; role: string }> } }>(
        "/users",
        { params }
      );
      return res.data.data.data;
    },
    enabled: true,
  });
}
