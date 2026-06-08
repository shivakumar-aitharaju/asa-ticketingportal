"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Paperclip, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import { useCreateTicket } from "@/lib/hooks/useTickets";
import { Priority } from "@/lib/types";
import type { Department } from "@/lib/types";

const Schema = z.object({
  subject: z.string().min(5, "Subject must be at least 5 characters").max(500),
  description: z.string().min(20, "Body must be at least 20 characters"),
  departmentId: z.string().uuid("Please select a category"),
  priority: z.nativeEnum(Priority),
  isEscalated: z.boolean(),
});
type TicketFormValues = z.infer<typeof Schema>;

const PRIORITY_OPTIONS = [
  { value: Priority.Low, label: "Normal", desc: "Non-urgent, can wait", color: "text-emerald-600" },
  { value: Priority.High, label: "Important!", desc: "Needs prompt attention", color: "text-orange-600" },
  { value: Priority.Critical, label: "Time Sensitive", desc: "Blocking / urgent", color: "text-red-600" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const createTicket = useCreateTicket();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Department[] }>(endpoints.DEPARTMENTS);
      return res.data.data;
    },
  });

  const form = useForm<TicketFormValues>({
    resolver: zodResolver(Schema),
    defaultValues: {
      subject: "",
      description: "",
      departmentId: "",
      priority: Priority.Low,
      isEscalated: false,
    },
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    setAttachedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      return [...prev, ...picked.filter((f) => !names.has(f.name))];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(name: string) {
    setAttachedFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function onSubmit(values: TicketFormValues) {
    try {
      const ticket = await createTicket.mutateAsync(values);

      if (attachedFiles.length > 0) {
        setUploading(true);
        await Promise.allSettled(
          attachedFiles.map((file) => {
            const form = new FormData();
            form.append("file", file);
            return apiClient.post(endpoints.TICKETS_ATTACHMENTS(ticket.id), form, {
              headers: { "Content-Type": "multipart/form-data" },
            });
          })
        );
        setUploading(false);
      }

      toast.success("Ticket submitted successfully", {
        description: `Ticket ${ticket.ticketNumber} has been raised.`,
      });
      router.push(`/client/tickets/${ticket.id}`);
    } catch (err: unknown) {
      setUploading(false);
      toast.error("Failed to submit ticket", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/client/tickets"><ArrowLeft className="size-4" />Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Raise a Ticket</h1>
          <p className="text-muted-foreground text-sm">Submit a support request to our team</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ticket Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

              <FormField control={form.control} name="subject" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Brief title describing the issue" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="departmentId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select the relevant category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>e.g. Agency, Technical, Billing, Accounting</FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="priority" render={({ field }) => (
                <FormItem>
                  <FormLabel>Importance *</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-2 pt-1"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <label
                          key={opt.value}
                          htmlFor={`priority-${opt.value}`}
                          className={`flex items-start gap-2 rounded-lg border p-3 cursor-pointer transition-colors hover:bg-muted/40 ${
                            field.value === opt.value ? "border-primary bg-primary/5" : ""
                          }`}
                        >
                          <RadioGroupItem id={`priority-${opt.value}`} value={opt.value} className="mt-0.5" />
                          <div>
                            <p className={`text-sm font-medium ${opt.color}`}>{opt.label}</p>
                            <p className="text-xs text-muted-foreground">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="isEscalated" render={({ field }) => (
                <FormItem>
                  <FormLabel>Escalation</FormLabel>
                  <div className="flex items-center gap-3 rounded-lg border p-3 mt-1">
                    <FormControl>
                      <Switch id="escalation" checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <Label htmlFor="escalation" className="text-sm font-medium cursor-pointer">
                        {field.value ? "Escalated" : "Standard"}
                      </Label>
                      {field.value ? (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                          This ticket will also be sent to your Super Manager — who has full visibility across all centers and teams
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Turn on to escalate to Super Manager
                        </p>
                      )}
                    </div>
                  </div>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Body — In-depth Details *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder={`Describe the issue in detail.\n@ — child name  /  / — report name  /  # — family name\n\nExample: "@John / Reading Report #Smith — The report shows incorrect scores from last week."`}
                      rows={6}
                    />
                  </FormControl>
                  <FormDescription>
                    Use <strong>@</strong> for child names, <strong>/</strong> for report names, <strong>#</strong> for family names. Minimum 20 characters.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Attachments */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attachments</Label>
                <div className="rounded-lg border border-dashed p-3 space-y-2">
                  {attachedFiles.length > 0 && (
                    <ul className="space-y-1">
                      {attachedFiles.map((f) => (
                        <li key={f.name} className="flex items-center gap-2 text-sm">
                          <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="flex-1 truncate">{f.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {(f.size / 1024).toFixed(0)} KB
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(f.name)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <X className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-3.5" />
                    Add files
                  </Button>
                  <p className="text-xs text-muted-foreground">Images, PDF, Word, Excel — max 20 MB each</p>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button type="submit" disabled={createTicket.isPending || uploading}>
                  {(createTicket.isPending || uploading) && <Loader2 className="size-4 animate-spin" />}
                  {uploading ? "Uploading…" : "Submit Ticket"}
                </Button>
                <Button type="button" variant="outline" asChild>
                  <Link href="/client/tickets">Cancel</Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
