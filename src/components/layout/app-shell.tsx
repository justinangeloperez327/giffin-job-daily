"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  HardHat,
  LayoutDashboard,
  Menu,
  UsersRound,
} from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Daily Schedule", href: "/daily-schedule", icon: CalendarDays },
  { name: "Projects", href: "/projects", icon: HardHat },
  { name: "Labours", href: "/labours", icon: UsersRound },
];

function Navigation({
  pathname,
  mobile = false,
}: {
  pathname: string;
  mobile?: boolean;
}) {
  return (
    <nav className="space-y-1" aria-label="Primary navigation">
      {navigation.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

        const link = (
          <Link
            href={item.href}
            className={cn(
              "flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/70 hover:text-foreground",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span>{item.name}</span>
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/" className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              Giffin Job Daily
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Workforce Scheduling
            </span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          <Navigation pathname={pathname} />
        </div>

        <div className="border-t p-3">
          <p className="px-3 text-xs text-muted-foreground">
            Daily operations workspace
          </p>
        </div>
      </aside>

      <div className="md:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open navigation">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SheetHeader className="border-b px-4 py-4 text-left">
                  <SheetTitle>Giffin Job Daily</SheetTitle>
                  <p className="text-xs text-muted-foreground">
                    Workforce Scheduling
                  </p>
                </SheetHeader>
                <div className="p-3">
                  <Navigation pathname={pathname} mobile />
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="text-sm font-semibold">
              Giffin Job Daily
            </Link>
          </div>

          <div className="hidden text-sm text-muted-foreground md:block">
            Daily operations workspace
          </div>

          <ThemeToggle />
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-5 md:px-6 md:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
