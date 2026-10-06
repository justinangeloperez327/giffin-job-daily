"use client";

import { Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ForemanOption } from "@/features/daily-schedule/foreman-selector";
import { cn } from "@/lib/utils";

export function ResourcePoolPanel({
  totalEmployees,
  error,
  selectedLabel,
  foremen,
  onAssignForeman,
  onViewAssignment,
}: {
  totalEmployees: number;
  error?: string;
  selectedLabel?: string;
  foremen: ForemanOption[];
  onAssignForeman: (employeeId: string) => void;
  onViewAssignment: (rowKey: string) => void;
}) {
  const [tab, setTab] = useState<"foremen" | "labours">("foremen");
  const [search, setSearch] = useState("");

  const filteredForemen = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return foremen;
    }

    return foremen.filter((foreman) =>
      [
        foreman.employeeName,
        foreman.employeeId,
        foreman.designation,
        foreman.statusLabel ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [foremen, search]);

  const availableForemen = filteredForemen.filter(
    (foreman) => foreman.available || foreman.selected,
  );
  const assignedForemen = filteredForemen.filter(
    (foreman) => !foreman.available && !foreman.selected,
  );

  return (
    <div className="flex h-full min-h-80 flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <UsersRound className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Resource Pool</h2>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {selectedLabel
            ? `Assigning resources to ${selectedLabel}`
            : "Select a schedule row"}
        </p>
      </div>

      <div className="grid grid-cols-2 border-b p-1">
        <button
          type="button"
          onClick={() => setTab("foremen")}
          className={cn(
            "h-8 rounded-md text-xs font-medium transition-colors",
            tab === "foremen"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Foremen
        </button>
        <button
          type="button"
          onClick={() => setTab("labours")}
          className={cn(
            "h-8 rounded-md text-xs font-medium transition-colors",
            tab === "labours"
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Labours
        </button>
      </div>

      {error ? (
        <div className="px-4 py-5 text-sm text-destructive">{error}</div>
      ) : tab === "foremen" ? (
        <>
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search foremen..."
                className="pl-8"
                disabled={!selectedLabel}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {!selectedLabel ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Select a project row before assigning a foreman.
              </div>
            ) : (
              <div className="space-y-4">
                <section>
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Available
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {availableForemen.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {availableForemen.length > 0 ? (
                      availableForemen.map((foreman) => (
                        <button
                          key={foreman.employeeId}
                          type="button"
                          onClick={() => onAssignForeman(foreman.employeeId)}
                          className={cn(
                            "flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent",
                            foreman.selected && "bg-accent/60",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">
                              {foreman.employeeName}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {foreman.employeeId} · {foreman.designation}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-muted-foreground">
                            {foreman.selected ? "Selected" : "Available"}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="px-2 py-3 text-xs text-muted-foreground">
                        No available foremen match this search.
                      </p>
                    )}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between px-2 py-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Assigned
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {assignedForemen.length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {assignedForemen.length > 0 ? (
                      assignedForemen.map((foreman) => (
                        <div
                          key={foreman.employeeId}
                          className="rounded-md border px-2 py-2"
                        >
                          <p className="truncate text-sm font-medium">
                            {foreman.employeeName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {foreman.employeeId} · {foreman.designation}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-muted-foreground">
                              {foreman.statusLabel ?? "Assigned"}
                            </span>
                            {foreman.assignmentRowKey ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-7 shrink-0 px-2"
                                onClick={() =>
                                  onViewAssignment(foreman.assignmentRowKey!)
                                }
                              >
                                View
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="px-2 py-3 text-xs text-muted-foreground">
                        No assigned foremen match this search.
                      </p>
                    )}
                  </div>
                </section>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center px-5 text-center">
          <div>
            <p className="text-sm font-medium">Labour pool</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Labour search and bulk assignment are implemented in Group 9.
            </p>
          </div>
        </div>
      )}

      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        {totalEmployees} total employees
      </div>
    </div>
  );
}
