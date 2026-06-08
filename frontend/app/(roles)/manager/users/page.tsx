"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { format } from "date-fns";
import { UserPlus, Shield, Search, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import type { User, Department } from "@/lib/types";
import { UserRole } from "@/lib/types";

interface PaginatedUsers {
  data: User[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  manager: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  team_leader: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400",
  agent: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  client: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

const ALL_ROLES = [
  { value: "all", label: "All Roles" },
  { value: UserRole.Admin, label: "Admin" },
  { value: UserRole.Manager, label: "Manager" },
  { value: UserRole.TeamLeader, label: "Team Leader" },
  { value: UserRole.Agent, label: "Agent" },
  { value: UserRole.Client, label: "Client" },
];

const RequestSchema = z.object({
  firstName: z.string().min(1, "First name required"),
  lastName: z.string().min(1, "Last name required"),
  email: z.string().email("Valid email required"),
  role: z.nativeEnum(UserRole),
  departmentId: z.string().uuid("Select a department"),
  notes: z.string().optional(),
});
type RequestForm = z.infer<typeof RequestSchema>;

export default function ManagerUsersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [requestOpen, setRequestOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["users", page, search, roleFilter],
    queryFn: async () => {
      const params: Record<string, any> = { page, limit: 25 };
      if (search) params.search = search;
      if (roleFilter && roleFilter !== "all") params.role = roleFilter;
      const res = await apiClient.get<PaginatedUsers>(endpoints.USERS, { params });
      return res.data;
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Department[] }>(endpoints.DEPARTMENTS);
      return res.data.data;
    },
  });

  const form = useForm<RequestForm>({
    resolver: zodResolver(RequestSchema),
    defaultValues: { firstName: "", lastName: "", email: "", role: UserRole.Client, departmentId: "", notes: "" },
  });

  const submitRequest = useMutation({
    mutationFn: async (values: RequestForm) => {
      const dept = departments?.find(d => d.id === values.departmentId);
      const subject = `User Creation Request: ${values.firstName} ${values.lastName}`;
      const description = [
        `Name: ${values.firstName} ${values.lastName}`,
        `Email: ${values.email}`,
        `Role: ${values.role.replace("_", " ")}`,
        `Department: ${dept?.name ?? values.departmentId}`,
        values.notes ? `Notes: ${values.notes}` : "",
      ].filter(Boolean).join("\n");

      const res = await apiClient.post(endpoints.TICKETS, {
        subject,
        description,
        departmentId: values.departmentId,
        priority: "high",
      });
      return res.data;
    },
    onSuccess: () => {
      setRequestOpen(false);
      form.reset();
      toast.success("User request submitted", {
        description: "Admin will review and create the user account.",
      });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? "Failed to submit request"),
  });

  function handleSearch() {
    setSearch(searchInput);
    setPage(1);
  }

  const pagination = data?.pagination;
  const users = data?.data ?? [];

  return (
    <div className="space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View portal users
            {pagination && <span className="ml-2">— {pagination.total} total</span>}
          </p>
        </div>
        <Button onClick={() => setRequestOpen(true)}>
          <UserPlus className="size-4" />
          Request New User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            className="pl-8"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button variant="outline" onClick={handleSearch}>Search</Button>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            {ALL_ROLES.map(r => (
              <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found
                    </TableCell>
                  </TableRow>
                )
              : users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[user.role] ?? ""}`}>
                        <Shield className="size-3" />
                        {user.role.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{user.department?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={user.isActive ? "success" : "secondary"}>
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(user.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="size-4" />Previous
            </Button>
            <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
              Next<ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Request New User Dialog */}
      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Request New User</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              Fill in the details below. Admin will receive a ticket and create the account upon approval.
            </p>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => submitRequest.mutate(d))} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="John" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl><Input {...field} placeholder="Smith" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl><Input {...field} type="email" placeholder="john@example.com" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ALL_ROLES.filter(r => r.value !== "all").map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="departmentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {departments?.map(d => (
                          <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="notes" render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any additional context for the admin..." rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setRequestOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={submitRequest.isPending}>
                  {submitRequest.isPending && <Loader2 className="size-4 animate-spin" />}
                  Submit Request
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
