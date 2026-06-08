"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  FolderIcon, PlusIcon, Trash2Icon, UserPlusIcon, UserMinusIcon,
  Loader2, ChevronDownIcon, UsersIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import type { Department, User } from "@/lib/types";
import { UserRole } from "@/lib/types";

const CategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});
type CategoryForm = z.infer<typeof CategorySchema>;

function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Department[] }>(endpoints.DEPARTMENTS);
      return res.data.data;
    },
  });
}

function useCategoryMembers(categoryId: string) {
  return useQuery({
    queryKey: ["dept-members", categoryId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: User[] }>(endpoints.DEPARTMENTS_MEMBERS(categoryId));
      return res.data.data;
    },
    enabled: !!categoryId,
  });
}

function useStaff() {
  return useQuery({
    queryKey: ["staff-users"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: User[] }>(endpoints.USERS, {
        params: { roles: [UserRole.Manager, UserRole.Agent, UserRole.TeamLeader].join(","), limit: 200 },
      });
      return res.data.data ?? [];
    },
  });
}

function CategoryMembersPanel({ category }: { category: Department }) {
  const qc = useQueryClient();
  const { data: members, isLoading } = useCategoryMembers(category.id);
  const { data: staff } = useStaff();
  const [addUserId, setAddUserId] = useState("");

  const addMember = useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(endpoints.DEPARTMENTS_MEMBERS(category.id), { userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dept-members", category.id] });
      setAddUserId("");
      toast.success("Member added");
    },
    onError: () => toast.error("Failed to add member"),
  });

  const removeMember = useMutation({
    mutationFn: (userId: string) =>
      apiClient.delete(endpoints.DEPARTMENTS_MEMBERS_BY_USER(category.id, userId)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dept-members", category.id] });
      toast.success("Member removed");
    },
    onError: () => toast.error("Failed to remove member"),
  });

  const memberIds = new Set(members?.map((m) => m.id) ?? []);
  const available = staff?.filter((u) => !memberIds.has(u.id)) ?? [];

  return (
    <div className="pt-2 space-y-3">
      {/* Add member */}
      <div className="flex gap-2">
        <Select value={addUserId} onValueChange={setAddUserId}>
          <SelectTrigger className="flex-1 h-8 text-xs">
            <SelectValue placeholder="Select manager or agent to add..." />
          </SelectTrigger>
          <SelectContent>
            {available.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                <span className="flex items-center gap-2">
                  <span>{u.firstName} {u.lastName}</span>
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">{u.role.replace("_", " ")}</Badge>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          size="sm" className="h-8 px-2"
          disabled={!addUserId || addMember.isPending}
          onClick={() => addMember.mutate(addUserId)}
        >
          {addMember.isPending ? <Loader2 className="size-3 animate-spin" /> : <UserPlusIcon className="size-3" />}
        </Button>
      </div>

      {/* Member list */}
      {isLoading ? (
        <div className="space-y-1">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}</div>
      ) : members?.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">No members assigned yet.</p>
      ) : (
        <div className="space-y-1">
          {members?.map((member) => (
            <div key={member.id} className="flex items-center justify-between rounded-md bg-muted/40 px-2 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-semibold text-primary">
                    {(member.firstName?.[0] ?? member.email?.[0] ?? "?").toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">
                    {member.firstName ? `${member.firstName} ${member.lastName ?? ""}`.trim() : member.email}
                  </p>
                  <p className="text-[10px] text-muted-foreground">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">{member.role.replace("_", " ")}</Badge>
                <Button
                  size="icon" variant="ghost" className="size-6 text-muted-foreground hover:text-destructive"
                  onClick={() => removeMember.mutate(member.id)}
                  disabled={removeMember.isPending}
                >
                  <UserMinusIcon className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { data: categories, isLoading } = useDepartments();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const form = useForm<CategoryForm>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { name: "", description: "" },
  });

  const createCategory = useMutation({
    mutationFn: (data: CategoryForm) => apiClient.post(endpoints.DEPARTMENTS, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setCreateOpen(false);
      form.reset();
      toast.success("Category created");
    },
    onError: () => toast.error("Failed to create category"),
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => apiClient.delete(endpoints.DEPARTMENTS_BY_ID(id)),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["departments"] });
      setDeleteId(null);
      toast.success("Category deleted");
    },
    onError: () => toast.error("Failed to delete category"),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Categories</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage ticket categories and assign managers & agents
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <PlusIcon className="size-4" />
          New Category
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      ) : categories?.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderIcon className="size-10 text-muted-foreground mb-3" />
            <p className="font-medium">No categories yet</p>
            <p className="text-sm text-muted-foreground">Create a category to start routing tickets</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {categories?.map((cat) => (
            <Card key={cat.id}>
              <Collapsible
                open={expandedId === cat.id}
                onOpenChange={(open) => setExpandedId(open ? cat.id : null)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <FolderIcon className="size-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base">{cat.name}</CardTitle>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{cat.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm">
                          <UsersIcon className="size-3.5" />
                          Members
                          <ChevronDownIcon className={`size-3.5 transition-transform ${expandedId === cat.id ? "rotate-180" : ""}`} />
                        </Button>
                      </CollapsibleTrigger>
                      <Button
                        variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteId(cat.id)}
                      >
                        <Trash2Icon className="size-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <Separator />
                  <CardContent className="pt-3">
                    <CategoryMembersPanel category={cat} />
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Category</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => createCategory.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl><Input {...field} placeholder="e.g. Agency, Billing, Technical" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Input {...field} placeholder="Brief description" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createCategory.isPending}>
                  {createCategory.isPending && <Loader2 className="size-4 animate-spin" />}
                  Create
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently delete the category and remove all member assignments. Existing tickets will remain but lose their category association.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button
              variant="destructive" disabled={deleteCategory.isPending}
              onClick={() => deleteId && deleteCategory.mutate(deleteId)}
            >
              {deleteCategory.isPending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
