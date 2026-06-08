"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Plus, Pencil, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import type { Department } from "@/lib/types";

interface SLAConfig {
  id: string;
  name: string;
  priority: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  businessHoursOnly: boolean;
  isActive: boolean;
  departmentId?: string | null;
  categoryId?: string | null;
  department?: { name: string } | null;
  category?: { name: string } | null;
}

const PRIORITIES = ["critical", "high", "medium", "low"] as const;

const SLAFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  priority: z.enum(["critical", "high", "medium", "low"]),
  firstResponseMinutes: z.number().int().min(1, "Min 1 minute"),
  resolutionMinutes: z.number().int().min(1, "Min 1 minute"),
  departmentId: z.string().optional().or(z.literal("")),
  businessHoursOnly: z.boolean(),
  isActive: z.boolean(),
});
type SLAFormValues = z.infer<typeof SLAFormSchema>;

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.round(mins / 60)}h`;
  return `${Math.round(mins / 1440)}d`;
}

const priorityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  low: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const defaultValues: SLAFormValues = {
  name: "",
  priority: "medium",
  firstResponseMinutes: 60,
  resolutionMinutes: 480,
  departmentId: "",
  businessHoursOnly: true,
  isActive: true,
};

export default function AdminSLAPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editConfig, setEditConfig] = useState<SLAConfig | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["sla-configs"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: SLAConfig[] }>(endpoints.SLA_CONFIGS);
      return res.data.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Department[] }>(endpoints.DEPARTMENTS);
      return res.data.data;
    },
  });

  const form = useForm<SLAFormValues>({
    resolver: zodResolver(SLAFormSchema),
    defaultValues,
  });

  const createConfig = useMutation({
    mutationFn: (data: SLAFormValues) => {
      const payload = { ...data, departmentId: data.departmentId || null };
      return apiClient.post(endpoints.SLA_CONFIGS, payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sla-configs"] });
      setCreateOpen(false);
      form.reset(defaultValues);
      toast.success("SLA configuration created");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to create configuration"),
  });

  const updateConfig = useMutation({
    mutationFn: ({ id, data }: { id: string; data: SLAFormValues }) => {
      const payload = { ...data, departmentId: data.departmentId || null };
      return apiClient.patch(endpoints.SLA_CONFIGS_BY_ID(id), payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sla-configs"] });
      setEditConfig(null);
      toast.success("SLA configuration updated");
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to update configuration"),
  });

  function openCreate() {
    form.reset(defaultValues);
    setCreateOpen(true);
  }

  function openEdit(config: SLAConfig) {
    setEditConfig(config);
    form.reset({
      name: config.name,
      priority: config.priority as SLAFormValues["priority"],
      firstResponseMinutes: config.firstResponseMinutes,
      resolutionMinutes: config.resolutionMinutes,
      departmentId: config.departmentId ?? "",
      businessHoursOnly: config.businessHoursOnly,
      isActive: config.isActive,
    });
  }

  const isDialogOpen = createOpen || !!editConfig;
  const isPending = createConfig.isPending || updateConfig.isPending;

  function handleSubmit(values: SLAFormValues) {
    if (editConfig) {
      updateConfig.mutate({ id: editConfig.id, data: values });
    } else {
      createConfig.mutate(values);
    }
  }

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SLA Configurations</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage service level agreement rules for ticket resolution
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add Configuration
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>First Response</TableHead>
              <TableHead>Resolution</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Business Hours</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : data?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No SLA configurations yet. Click "Add Configuration" to create one.
                    </TableCell>
                  </TableRow>
                )
              : data?.map((config) => (
                  <TableRow key={config.id}>
                    <TableCell className="font-medium">{config.name}</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[config.priority] ?? ""}`}>
                        {config.priority}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatMinutes(config.firstResponseMinutes)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatMinutes(config.resolutionMinutes)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {config.department?.name
                        ? config.category?.name
                          ? `${config.department.name} / ${config.category.name}`
                          : config.department.name
                        : "Global"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.businessHoursOnly ? "info" : "secondary"}>
                        {config.businessHoursOnly ? "Yes" : "24/7"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={config.isActive ? "success" : "secondary"}>
                        {config.isActive ? "Active" : "Disabled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon" variant="ghost" className="size-7"
                        onClick={() => openEdit(config)}
                        title="Edit configuration"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) { setCreateOpen(false); setEditConfig(null); }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editConfig ? "Edit SLA Configuration" : "Add SLA Configuration"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Critical - Agency" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="priority" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {PRIORITIES.map(p => (
                          <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="departmentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Global" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="">Global (all)</SelectItem>
                        {departments?.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="firstResponseMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Response (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number" min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="resolutionMinutes" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resolution (min) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number" min={1}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="flex gap-6">
                <FormField control={form.control} name="businessHoursOnly" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Business hours only</FormLabel>
                  </FormItem>
                )} />
                <FormField control={form.control} name="isActive" render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Active</FormLabel>
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); setEditConfig(null); }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="size-4 animate-spin" />}
                  {editConfig ? "Save Changes" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
