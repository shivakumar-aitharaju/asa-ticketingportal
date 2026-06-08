"use client";

import { useQuery } from "@tanstack/react-query";
import { Shield, TicketIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import { useAuthStore } from "@/lib/store/auth-store";

interface AgentWorkload {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  role: string;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_tickets: number;
  total_assigned: number;
}

export default function TeamLeaderTeamPage() {
  const user = useAuthStore((s) => s.user);

  const { data: workload, isLoading } = useQuery({
    queryKey: ["team-workload", user?.departmentId],
    enabled: !!user?.departmentId,
    queryFn: async () => {
      const res = await apiClient.get<{ data: AgentWorkload[] }>(
        endpoints.USERS_WORKLOAD(user!.departmentId!)
      );
      return res.data.data;
    },
  });

  const maxLoad = Math.max(...(workload?.map((a) => a.total_assigned) ?? [1]), 1);

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-muted-foreground text-sm mt-1">Workload overview for your department&apos;s agents</p>
      </div>

      {!user?.departmentId && (
        <p className="text-sm text-muted-foreground">No department assigned to your account.</p>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {workload?.map((agent) => {
            const name = agent.firstName
              ? `${agent.firstName} ${agent.lastName ?? ""}`.trim()
              : agent.email;
            const loadPct = maxLoad > 0 ? Math.round((agent.total_assigned / maxLoad) * 100) : 0;

            return (
              <Card key={agent.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground">{agent.email}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 shrink-0">
                      <Shield className="size-3" />
                      {agent.role.replace("_", " ")}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TicketIcon className="size-3" />
                        {agent.total_assigned} assigned
                      </span>
                      <span>{loadPct}% load</span>
                    </div>
                    <Progress value={loadPct} className="h-1.5" />
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">{agent.open_tickets} open</Badge>
                    <Badge variant="info" className="text-xs">{agent.in_progress_tickets} in progress</Badge>
                    <Badge variant="success" className="text-xs">{agent.resolved_tickets} resolved</Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {workload?.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
              No agents in your department yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
