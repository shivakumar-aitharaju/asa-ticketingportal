"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import type { Department } from "@/lib/types";

interface DepartmentWithStats extends Department {
  _count?: { tickets?: number; users?: number };
}

export default function ManagerDepartmentsPage() {
  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DepartmentWithStats[] }>(endpoints.DEPARTMENTS);
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold">Departments</h1>
        <p className="text-muted-foreground text-sm mt-1">Overview of all departments and their categories</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {departments?.map((dept) => (
            <Card key={dept.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="size-4 text-primary" />
                  {dept.name}
                  <ChevronRight className="size-4 ml-auto text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">{dept.description ?? "No description"}</p>
                {dept._count && (
                  <div className="flex gap-2 pt-1">
                    {dept._count.tickets !== undefined && (
                      <Badge variant="secondary" className="text-xs">{dept._count.tickets} tickets</Badge>
                    )}
                    {dept._count.users !== undefined && (
                      <Badge variant="outline" className="text-xs">{dept._count.users} members</Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {departments?.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
              No departments configured
            </p>
          )}
        </div>
      )}
    </div>
  );
}
