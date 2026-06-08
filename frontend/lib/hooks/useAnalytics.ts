import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apis/axios";
import { endpoints } from "@/lib/apis/endpoints";

export interface DashboardOverview {
  totalTickets: number;
  open: number;
  inProgress: number;
  escalated: number;
  resolved: number;
  slaBreached: number;
  slaCompliance: number;
}

export interface ResolutionTime {
  avgHours: number;
  p50Hours: number;
  fastestHours: number;
  slowestHours: number;
}

export function useDashboardOverview(departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "overview", departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: DashboardOverview }>(
        endpoints.ANALYTICS_OVERVIEW,
        { params: departmentId ? { departmentId } : undefined }
      );
      return res.data.data;
    },
  });
}

export function useTicketTrend(days = 30, departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "trend", days, departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ date: string; count: number }> }>(
        endpoints.ANALYTICS_TREND,
        { params: { days, ...(departmentId && { departmentId }) } }
      );
      return res.data.data;
    },
  });
}

export function useAgentPerformance(departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "agents", departmentId],
    queryFn: async () => {
      const res = await apiClient.get(
        endpoints.ANALYTICS_AGENTS,
        { params: departmentId ? { departmentId } : undefined }
      );
      return res.data.data;
    },
  });
}

export function useStatusDistribution(departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "status", departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ status: string; count: number }> }>(
        endpoints.ANALYTICS_STATUS,
        { params: departmentId ? { departmentId } : undefined }
      );
      return res.data.data;
    },
  });
}

export function usePriorityDistribution(departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "priority", departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ priority: string; count: number }> }>(
        endpoints.ANALYTICS_PRIORITY,
        { params: departmentId ? { departmentId } : undefined }
      );
      return res.data.data;
    },
  });
}

export function useMonthlyTrend(year?: number, departmentId?: string) {
  const y = year ?? new Date().getFullYear();
  return useQuery({
    queryKey: ["analytics", "monthly", y, departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ month: number; count: number; resolved: number }> }>(
        endpoints.ANALYTICS_MONTHLY,
        { params: { year: y, ...(departmentId && { departmentId }) } }
      );
      return res.data.data;
    },
  });
}

export function useResolutionTime(departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "resolution", departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: ResolutionTime }>(
        endpoints.ANALYTICS_RESOLUTION,
        { params: departmentId ? { departmentId } : undefined }
      );
      return res.data.data;
    },
  });
}

export function useSLATrend(days = 30, departmentId?: string) {
  return useQuery({
    queryKey: ["analytics", "sla-trend", days, departmentId],
    queryFn: async () => {
      const res = await apiClient.get<{ data: Array<{ date: string; met: number; breached: number }> }>(
        endpoints.ANALYTICS_SLA_TREND,
        { params: { days, ...(departmentId && { departmentId }) } }
      );
      return res.data.data;
    },
  });
}

export function useDepartmentBreakdown() {
  return useQuery({
    queryKey: ["analytics", "departments"],
    queryFn: async () => {
      const res = await apiClient.get(endpoints.ANALYTICS_DEPARTMENTS);
      return res.data.data;
    },
  });
}
