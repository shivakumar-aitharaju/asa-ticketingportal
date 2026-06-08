"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";
import type { Department } from "@/lib/types";

export default function AdminDepartmentsPage() {
  const { data: departments, isLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Department[] }>(endpoints.DEPARTMENTS);
      return res.data.data;
    },
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Departments</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage departments and their category mappings</p>
        </div>
        <Button size="sm">
          <Plus className="size-4" />
          Add Department
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
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
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{dept.description ?? "No description"}</p>
              </CardContent>
            </Card>
          ))}
          {departments?.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2 text-center py-8">
              No departments yet
            </p>
          )}
        </div>
      )}
    </div>
  );
}
