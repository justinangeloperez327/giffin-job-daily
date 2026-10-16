"use client";

import {
  CalendarDays,
  HardHat,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  UserRoundCog,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { logoutAction } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { UserRoleValue } from "@/lib/auth/constants";
import { cn } from "@/lib/utils";

type ShellUser = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
};

const baseNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Schedules", href: "/schedules", icon: CalendarDays },
  { name: "Projects", href: "/projects", icon: HardHat },
  { name: "Labours", href: "/labours", icon: UsersRound },
];

function Navigation({
  pathname,
  role,
  mobile = false,
  collapsed = false,
}: {
  pathname: string;
  role: UserRoleValue;
  mobile?: boolean;
  collapsed?: boolean;
}) {
  const navigation =
    role === "ADMIN"
      ? [
          ...baseNavigation,
          { name: "Users", href: "/users", icon: UserRoundCog },
        ]
      : baseNavigation;

  return (
    <nav className="space-y-1" aria-label="Primary navigation">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`) ||
              (item.href === "/schedules" && pathname === "/daily-schedule");

        const link = (
          <Link
            href={item.href}
            className={cn(
              "flex min-h-11 items-center rounded-none border-l-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
              collapsed && !mobile
                ? "justify-center px-0"
                : "gap-2.5 px-3",
              active
                ? "border-foreground bg-accent font-semibold text-accent-foreground"
                : "border-transparent text-muted-foreground hover:bg-accent/70 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
            title={collapsed && !mobile ? item.name : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {collapsed && !mobile ? (
              <span className="sr-only">{item.name}</span>
            ) : (
              <span>{item.name}</span>
            )}
          </Link>
        );

        return mobile ? (
          <SheetClose asChild key={item.href}>
            {link}
          </SheetClose>
        ) : (
          <div key={item.href}>{link}</div>
        );
      })}
    </nav>
  );
}

function roleLabel(role: UserRoleValue) {
  return role === "ADMIN"
    ? "Administrator"
    : role === "PLANNER"
      ? "Planner"
      : "Viewer";
}

export function AppShell({
  children,
  currentUser,
}: {
  children: React.ReactNode;
  currentUser: ShellUser;
}) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pageContext = pathname === "/daily-schedule"
    ? "Daily Schedule"
    : [...baseNavigation, { name: "Users", href: "/users" }].find((item) =>
        item.href === "/" ? pathname === "/" : pathname.startsWith(item.href),
      )?.name ?? "Workspace";

  return (
    <div className="min-h-screen">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden shrink-0 border-r bg-muted/30 transition-[width] duration-200 md:flex md:flex-col",
          sidebarCollapsed ? "w-16" : "w-60",
        )}
      >
        <div
          className={cn(
            "flex h-14 items-center border-b",
            sidebarCollapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          {!sidebarCollapsed && (
            <Link href="/" className="min-w-0">
              <span className="block truncate text-sm font-bold tracking-[0.16em]">
                GIFFIN
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                Workforce Scheduling
              </span>
            </Link>
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!sidebarCollapsed}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>
        </div>

        <div className={cn("flex-1 overflow-y-auto", sidebarCollapsed ? "p-2" : "p-3")}>
          <p className={cn("mb-3 px-3 text-[11px] font-medium text-muted-foreground", sidebarCollapsed && "sr-only")}>WORKFORCE PLANNING</p>
          <Navigation
            pathname={pathname}
            role={currentUser.role}
            collapsed={sidebarCollapsed}
          />
        </div>

        <div className={cn("border-t", sidebarCollapsed ? "p-2" : "p-3")}>
          {sidebarCollapsed ? (
            <div
              className="flex h-9 items-center justify-center text-xs font-medium"
              title={currentUser.name}
              aria-label={currentUser.name}
            >
              {currentUser.name.trim().charAt(0).toUpperCase()}
            </div>
          ) : (
            <>
              <p className="truncate px-3 text-xs font-medium">{currentUser.name}</p>
              <p className="truncate px-3 text-xs text-muted-foreground">
                {roleLabel(currentUser.role)}
              </p>
            </>
          )}
        </div>
      </aside>

      <div
        className={cn(
          "transition-[padding] duration-200",
          sidebarCollapsed ? "md:pl-16" : "md:pl-60",
        )}
      >
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-card px-3 sm:px-5">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b px-3 py-3 text-left">
                  <SheetTitle>Giffin Job Daily</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    Workforce Scheduling
                  </p>
                </SheetHeader>
                <div className="p-3">
                  <Navigation
                    pathname={pathname}
                    role={currentUser.role}
                    mobile
                  />
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="text-sm font-semibold">
              Giffin Job Daily
            </Link>
          </div>

          <div className="hidden items-center gap-3 text-xs md:flex">
            <span className="text-muted-foreground">Workspace</span>
            <span aria-hidden="true" className="text-muted-foreground">/</span>
            <span className="font-medium">{pageContext}</span>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-9 max-w-24 px-2 sm:max-w-52">
                  <span className="truncate">{currentUser.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-2 py-1.5">
                  <p className="truncate text-sm font-medium">
                    {currentUser.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {currentUser.email}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {roleLabel(currentUser.role)}
                  </p>
                </div>
                <DropdownMenuSeparator />
                <form action={logoutAction}>
                  <DropdownMenuItem asChild>
                    <button type="submit" className="w-full">
                      <LogOut className="size-4" />
                      Sign out
                    </button>
                  </DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1920px] px-3 py-4 sm:px-5 sm:py-5">
          {children}
        </main>
      </div>
    </div>
  );
}
