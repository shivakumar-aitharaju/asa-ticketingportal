import {
  LayoutDashboardIcon,
  TicketIcon,
  UsersIcon,
  FolderIcon,
  BarChart3Icon,
  ShieldCheckIcon,
  Settings2Icon,
  PlusCircleIcon,
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@/lib/types/auth.types";

export interface RoleNavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

const roleNavigation: Record<UserRole, RoleNavItem[]> = {
  [UserRole.Admin]: [
    { title: "Dashboard", href: "/admin", icon: LayoutDashboardIcon, exact: true },
    { title: "All Tickets", href: "/admin/tickets", icon: TicketIcon },
    { title: "Users", href: "/admin/users", icon: UsersIcon },
    { title: "Categories", href: "/admin/categories", icon: FolderIcon },
    { title: "SLA Config", href: "/admin/sla", icon: Settings2Icon },
    { title: "Analytics", href: "/admin/analytics", icon: BarChart3Icon },
    { title: "Audit Log", href: "/admin/audit", icon: ShieldCheckIcon },
  ],
  [UserRole.Manager]: [
    { title: "Dashboard", href: "/manager", icon: LayoutDashboardIcon, exact: true },
    { title: "All Tickets", href: "/manager/tickets", icon: TicketIcon },
    { title: "Categories", href: "/manager/departments", icon: FolderIcon },
    { title: "Users", href: "/manager/users", icon: UsersIcon },
  ],
  [UserRole.TeamLeader]: [
    { title: "Dashboard", href: "/team-leader", icon: LayoutDashboardIcon, exact: true },
    { title: "Tickets", href: "/team-leader/tickets", icon: TicketIcon },
    { title: "Team", href: "/team-leader/team", icon: UsersIcon },
  ],
  [UserRole.Agent]: [
    { title: "Dashboard", href: "/agent", icon: LayoutDashboardIcon, exact: true },
    { title: "My Tickets", href: "/agent/tickets", icon: TicketIcon },
  ],
  [UserRole.Client]: [
    { title: "Dashboard", href: "/client", icon: LayoutDashboardIcon, exact: true },
    { title: "My Tickets", href: "/client/tickets", icon: TicketIcon },
    { title: "New Ticket", href: "/client/tickets/new", icon: PlusCircleIcon },
  ],
};

export function getNavByRole(role: UserRole | string): RoleNavItem[] {
  return roleNavigation[role as UserRole] ?? [];
}

export function isNavItemActive(
  pathname: string,
  item: Pick<RoleNavItem, "href" | "exact">
): boolean {
  if (item.exact) return pathname === item.href;
  return pathname.startsWith(item.href);
}

export function getRoleHome(role: UserRole | string): string {
  const roleHomes: Record<UserRole, string> = {
    [UserRole.Admin]: "/admin",
    [UserRole.Manager]: "/manager",
    [UserRole.TeamLeader]: "/team-leader",
    [UserRole.Agent]: "/agent",
    [UserRole.Client]: "/client",
  };
  return roleHomes[role as UserRole] ?? "/client";
}
