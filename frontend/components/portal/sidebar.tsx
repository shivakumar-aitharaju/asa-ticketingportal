"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { getNavByRole, isNavItemActive } from "@/lib/navigation/role-nav";
import { useAuthStore } from "@/lib/store/auth-store";
import { useSidebarStore } from "@/lib/store/sidebar-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isOpen = useSidebarStore((s) => s.isOpen);
  const navItems = getNavByRole(user?.role ?? "client");

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r bg-card overflow-hidden transition-all duration-200 ease-in-out",
        isOpen ? "w-56" : "w-14"
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex shrink-0 items-center border-b",
          isOpen ? "h-14 px-4" : "h-14 justify-center"
        )}
      >
        {isOpen ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/logo.png" alt="ASA" height={34} className="object-contain max-h-[34px] w-auto" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/favicon.svg" alt="ASA" width={28} height={28} className="rounded-md" />
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-0.5">
          <TooltipProvider delayDuration={100}>
            {navItems.map((item) => {
              const active = isNavItemActive(pathname, item);
              return isOpen ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="size-4 shrink-0" />
                  <span className="truncate">{item.title}</span>
                </Link>
              ) : (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center justify-center rounded-md p-2.5 transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                    >
                      <item.icon className="size-4 shrink-0" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{item.title}</TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </nav>
      </ScrollArea>
    </aside>
  );
}
