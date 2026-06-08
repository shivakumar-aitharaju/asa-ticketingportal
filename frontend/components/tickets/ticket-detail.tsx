"use client";

import { useRef, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  ArrowLeft, CheckCircle2, MessageSquare, Clock,
  Send, Loader2, Tag, Paperclip, ThumbsUp, ThumbsDown,
  Download, UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { StatusBadge, PriorityBadge, SLABadge } from "@/components/tickets/ticket-status-badge";
import {
  useTicket, useTicketMessages, useTicketSLA,
  useTicketHistory, useAddMessage, useResolveTicket, useCloseTicket,
  useAssignTicket, useClientResolveTicket, useRateTicket,
  useTicketAttachments, useUploadAttachment, useGetAttachmentUrl, useUsers,
} from "@/lib/hooks/useTickets";
import { useAuthStore } from "@/lib/store/auth-store";
import { TicketStatus, UserRole } from "@/lib/types";
import Link from "next/link";

const MessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty"),
});

interface TicketDetailProps {
  ticketId: string;
  backHref: string;
}

export function TicketDetail({ ticketId, backHref }: TicketDetailProps) {
  const user = useAuthStore((s) => s.user);
  const isStaff = user?.role && [UserRole.Admin, UserRole.Manager, UserRole.TeamLeader, UserRole.Agent].includes(user.role);
  const isClient = user?.role === UserRole.Client;
  const canAssign = user?.role && [UserRole.Admin, UserRole.Manager].includes(user.role);
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: ticket, isLoading } = useTicket(ticketId);
  const { data: messages } = useTicketMessages(ticketId);
  const { data: sla } = useTicketSLA(ticketId);
  const { data: history } = useTicketHistory(ticketId);
  const { data: attachments } = useTicketAttachments(ticketId);
  const { data: users } = useUsers(
    user?.role === UserRole.Admin ? undefined : { departmentId: user?.departmentId ?? undefined }
  );

  const addMessage = useAddMessage(ticketId);
  const resolveTicket = useResolveTicket(ticketId);
  const closeTicket = useCloseTicket(ticketId);
  const assignTicket = useAssignTicket(ticketId);
  const clientResolve = useClientResolveTicket(ticketId);
  const rateTicket = useRateTicket(ticketId);
  const uploadAttachment = useUploadAttachment(ticketId);
  const getAttachmentUrl = useGetAttachmentUrl();

  const form = useForm({ resolver: zodResolver(MessageSchema), defaultValues: { content: "" } });
  const resolutionForm = useForm({
    resolver: zodResolver(z.object({ resolutionSummary: z.string().min(10) })),
    defaultValues: { resolutionSummary: "" },
  });

  async function sendMessage(values: { content: string }) {
    try {
      await addMessage.mutateAsync({ content: values.content, isClientFacing: true });
      form.reset();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    }
  }

  async function handleResolve(values: { resolutionSummary: string }) {
    try {
      await resolveTicket.mutateAsync(values);
      toast.success("Ticket resolved");
      setShowResolutionForm(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve ticket");
    }
  }

  async function handleClose() {
    try {
      await closeTicket.mutateAsync();
      toast.success("Ticket closed");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to close ticket");
    }
  }

  async function handleAssign() {
    if (!selectedAgentId) return;
    try {
      await assignTicket.mutateAsync({ agentId: selectedAgentId });
      toast.success("Ticket assigned");
      setSelectedAgentId("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to assign ticket");
    }
  }

  async function handleClientResolve() {
    try {
      await clientResolve.mutateAsync();
      toast.success("Ticket marked as resolved");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to resolve ticket");
    }
  }

  async function handleRate(rating: "good" | "bad") {
    try {
      await rateTicket.mutateAsync(rating);
      toast.success("Thank you for your feedback!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save rating");
    }
  }

  async function handleDownload(attachmentId: string, fileName: string) {
    try {
      const url = await getAttachmentUrl.mutateAsync({ ticketId, attachmentId });
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.target = "_blank";
      a.click();
    } catch {
      toast.error("Could not get download link");
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";
    try {
      await uploadAttachment.mutateAsync(file);
      toast.success(`${file.name} uploaded`);
    } catch {
      toast.error("Upload failed");
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href={backHref}>Go back</Link>
        </Button>
      </div>
    );
  }

  const activeStatuses = [TicketStatus.Open, TicketStatus.Assigned, TicketStatus.InProgress, TicketStatus.PendingClient, TicketStatus.Escalated];
  const canResolve = isStaff && [TicketStatus.Assigned, TicketStatus.InProgress, TicketStatus.PendingClient].includes(ticket.status);
  const canClose = isStaff && ticket.status === TicketStatus.Resolved;
  const canClientResolve = isClient && activeStatuses.includes(ticket.status);
  const showRating = isClient && ticket.status === TicketStatus.Resolved && !ticket.clientRating;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href={backHref}>
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">{ticket.ticketNumber}</span>
            {ticket.isEscalated && (
              <Badge variant="destructive" className="text-xs">Escalated</Badge>
            )}
          </div>
          <h1 className="text-xl font-bold">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            {sla && <SLABadge status={sla.status} />}
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {canClientResolve && (
            <Button size="sm" variant="outline" onClick={handleClientResolve} disabled={clientResolve.isPending}>
              {clientResolve.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Mark as Resolved
            </Button>
          )}
          {canResolve && !showResolutionForm && (
            <Button size="sm" onClick={() => setShowResolutionForm(true)}>
              <CheckCircle2 className="size-4" />
              Resolve
            </Button>
          )}
          {canClose && (
            <Button size="sm" variant="outline" onClick={handleClose} disabled={closeTicket.isPending}>
              {closeTicket.isPending && <Loader2 className="size-4 animate-spin" />}
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Client rating prompt */}
      {showRating && (
        <Card className="border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium mb-3">How was the response to your ticket?</p>
            <div className="flex gap-3">
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900"
                onClick={() => handleRate("good")}
                disabled={rateTicket.isPending}
              >
                <ThumbsUp className="size-4 text-emerald-600" />
                Good
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => handleRate("bad")}
                disabled={rateTicket.isPending}
              >
                <ThumbsDown className="size-4 text-red-500" />
                Could be better
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing rating display */}
      {isClient && ticket.clientRating && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {ticket.clientRating === "good"
            ? <><ThumbsUp className="size-4 text-emerald-600" /><span>You rated this response as <strong className="text-emerald-600">Good</strong></span></>
            : <><ThumbsDown className="size-4 text-red-500" /><span>You rated this response as <strong className="text-red-500">Could be better</strong></span></>
          }
        </div>
      )}

      {/* Resolution form */}
      {showResolutionForm && (
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Resolution Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...resolutionForm}>
              <form onSubmit={resolutionForm.handleSubmit(handleResolve)} className="space-y-3">
                <FormField
                  control={resolutionForm.control}
                  name="resolutionSummary"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea {...field} placeholder="Describe how this was resolved..." rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" size="sm" disabled={resolveTicket.isPending}>
                    {resolveTicket.isPending && <Loader2 className="size-4 animate-spin" />}
                    Mark Resolved
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowResolutionForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="messages">
            <TabsList>
              <TabsTrigger value="messages">
                <MessageSquare className="size-3.5 mr-1.5" />
                Messages
              </TabsTrigger>
              <TabsTrigger value="attachments">
                <Paperclip className="size-3.5 mr-1.5" />
                Files {attachments && attachments.length > 0 && `(${attachments.length})`}
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="size-3.5 mr-1.5" />
                History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              {/* Description */}
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm font-medium mb-1">Original Request</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{ticket.description}</p>
                  {ticket.tags?.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      <Tag className="size-3.5 text-muted-foreground" />
                      {ticket.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Thread */}
              <ScrollArea className="max-h-96">
                <div className="space-y-3 pr-1">
                  {messages?.map((msg) => {
                    const isOwn = msg.authorId === user?.id;
                    return (
                      <div key={msg.id} className={`flex gap-2.5 ${isOwn ? "flex-row-reverse" : ""}`}>
                        <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-xs font-medium text-primary">
                            {(msg.author?.firstName?.[0] ?? "?").toUpperCase()}
                          </span>
                        </div>
                        <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          <div className={`rounded-lg px-3 py-2 text-sm ${
                            isOwn
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}>
                            {msg.content}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span>{msg.author?.firstName ?? "Unknown"}</span>
                            <span>·</span>
                            <span>{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}</span>
                            {!msg.isClientFacing && (
                              <Badge variant="outline" className="text-[10px] py-0">Internal</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {messages?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No messages yet
                    </p>
                  )}
                </div>
              </ScrollArea>

              {/* Reply box */}
              {ticket.status !== TicketStatus.Closed && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(sendMessage)} className="flex gap-2">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Type a message..."
                              rows={2}
                              className="resize-none"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" size="sm" className="self-end" disabled={addMessage.isPending}>
                      {addMessage.isPending ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </TabsContent>

            <TabsContent value="attachments" className="space-y-3">
              <div className="space-y-2">
                {attachments?.map((att) => (
                  <div key={att.id} className="flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
                    <Paperclip className="size-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{att.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {(att.fileSize / 1024).toFixed(0)} KB
                        {att.uploadedBy && ` · ${att.uploadedBy.firstName ?? ""} ${att.uploadedBy.lastName ?? ""}`.trim()}
                        {` · ${formatDistanceToNow(new Date(att.createdAt), { addSuffix: true })}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(att.id, att.fileName)}
                      disabled={getAttachmentUrl.isPending}
                    >
                      <Download className="size-4" />
                    </Button>
                  </div>
                ))}
                {attachments?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No attachments</p>
                )}
              </div>
              {ticket.status !== TicketStatus.Closed && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadAttachment.isPending}
                  >
                    {uploadAttachment.isPending
                      ? <Loader2 className="size-4 animate-spin" />
                      : <Paperclip className="size-4" />
                    }
                    Upload file
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <div className="space-y-2">
                {history?.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 text-sm py-2 border-b last:border-0">
                    <div className="size-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <Clock className="size-3 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">{h.changedBy?.firstName ?? "Unknown"}</span>
                      {" changed status "}
                      {h.fromStatus && <><span className="text-muted-foreground">{h.fromStatus}</span>{" → "}</>}
                      <span className="font-medium">{h.toStatus}</span>
                      {h.reason && <span className="text-muted-foreground"> · {h.reason}</span>}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDistanceToNow(new Date(h.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                ))}
                {history?.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">No history yet</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar info */}
        <div className="space-y-4">
          {/* Assignment panel */}
          {canAssign && ticket.status !== TicketStatus.Closed && ticket.status !== TicketStatus.Resolved && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  Assign Ticket
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select team member" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter((u) => u.id !== user?.id).map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {`${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.id}
                        <span className="ml-1 text-xs text-muted-foreground capitalize">({u.role.replace("_", " ")})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  className="w-full"
                  disabled={!selectedAgentId || assignTicket.isPending}
                  onClick={handleAssign}
                >
                  {assignTicket.isPending ? <Loader2 className="size-4 animate-spin" /> : <UserCheck className="size-4" />}
                  Assign
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {[
                { label: "Department", value: ticket.department?.name },
                { label: "Category", value: ticket.category?.name },
                { label: "Created by", value: ticket.createdBy ? `${ticket.createdBy.firstName ?? ""} ${ticket.createdBy.lastName ?? ""}`.trim() : "—" },
                { label: "Assigned to", value: ticket.assignedTo ? `${ticket.assignedTo.firstName ?? ""} ${ticket.assignedTo.lastName ?? ""}`.trim() : "Unassigned" },
                { label: "Created", value: format(new Date(ticket.createdAt), "MMM d, yyyy h:mm a") },
                ...(ticket.resolvedAt ? [{ label: "Resolved", value: format(new Date(ticket.resolvedAt), "MMM d, yyyy h:mm a") }] : []),
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="font-medium">{value ?? "—"}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {sla && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  SLA Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <SLABadge status={sla.status} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Response Due</p>
                  <p className="font-medium">{format(new Date(sla.firstResponseDue), "MMM d, h:mm a")}</p>
                  {sla.firstResponseMet !== null && (
                    <p className={`text-xs ${sla.firstResponseMet ? "text-emerald-600" : "text-red-500"}`}>
                      {sla.firstResponseMet ? "✓ Met" : "✗ Missed"}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Resolution Due</p>
                  <p className="font-medium">{format(new Date(sla.resolutionDue), "MMM d, h:mm a")}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
