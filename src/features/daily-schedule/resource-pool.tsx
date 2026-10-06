"use client";

import { Search, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { ForemanOption } from "@/features/daily-schedule/foreman-selector";
import type { LabourOption } from "@/features/daily-schedule/labour-options";
import { cn } from "@/lib/utils";

export function ResourcePoolPanel({
  contextKey,
  totalEmployees,
  error,
  selectedLabel,
  foremen,
  labours,
  canReassignLabour,
  pending,
  onAssignForeman,
  onAssignLabours,
  onReassignLabour,
  onViewAssignment,
}: {
  contextKey?: string;
  totalEmployees: number;
  error?: string;
  selectedLabel?: string;
  foremen: ForemanOption[];
  labours: LabourOption[];
  canReassignLabour: boolean;
  pending: boolean;
  onAssignForeman: (employeeId: string) => void;
  onAssignLabours: (employeeIds: string[]) => void;
  onReassignLabour: (employeeId: string, fromRowKey: string) => void;
  onViewAssignment: (rowKey: string) => void;
}) {
  const [tab, setTab] = useState<"foremen" | "labours">("foremen");
  const [search, setSearch] = useState("");
  const [designation, setDesignation] = useState("");
  const [availability, setAvailability] = useState<
    "available" | "assigned" | "all"
  >("available");
  const [stagedLabours, setStagedLabours] = useState<Set<string>>(new Set());

  useEffect(() => {
    setStagedLabours(new Set());
  }, [contextKey]);

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

  const designations = useMemo(
    () =>
      [...new Set(labours.map((labour) => labour.designation))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [labours],
  );

  const filteredLabours = useMemo(() => {
    const query = search.trim().toLowerCase();

    return labours.filter((labour) => {
      const matchesSearch =
        !query ||
        [
          labour.employeeName,
          labour.employeeId,
          labour.designation,
          labour.statusLabel ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesDesignation =
        !designation || labour.designation === designation;

      const matchesAvailability =
        availability === "all" ||
        (availability === "available"
          ? labour.available && !labour.selected
          : labour.selected || !labour.available);

      return matchesSearch && matchesDesignation && matchesAvailability;
    });
  }, [availability, designation, labours, search]);

  const availableForemen = filteredForemen.filter(
    (foreman) => foreman.available || foreman.selected,
  );
  const assignedForemen = filteredForemen.filter(
    (foreman) => !foreman.available && !foreman.selected,
  );

  function toggleLabour(employeeId: string) {
    setStagedLabours((current) => {
      const next = new Set(current);

      if (next.has(employeeId)) {
        next.delete(employeeId);
      } else {
        next.add(employeeId);
      }

      return next;
    });
  }

  function assignStagedLabours() {
    if (stagedLabours.size === 0) {
      return;
    }

    onAssignLabours([...stagedLabours]);
    setStagedLabours(new Set());
  }

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
          onClick={() => {
            setTab("foremen");
            setSearch("");
          }}
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
          onClick={() => {
            setTab("labours");
            setSearch("");
          }}
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
                          disabled={pending}
                          onClick={() => onAssignForeman(foreman.employeeId)}
                          className={cn(
                            "flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-50",
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
        <>
          <div className="space-y-2 border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search labour..."
                className="pl-8"
                disabled={!selectedLabel}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <NativeSelect
                value={designation}
                onChange={(event) => setDesignation(event.target.value)}
                disabled={!selectedLabel}
                aria-label="Filter labour by designation"
              >
                <option value="">All designations</option>
                {designations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                value={availability}
                onChange={(event) =>
                  setAvailability(
                    event.target.value as "available" | "assigned" | "all",
                  )
                }
                disabled={!selectedLabel}
                aria-label="Filter labour by availability"
              >
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="all">All</option>
              </NativeSelect>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {!selectedLabel ? (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                Select a project row before assigning labour.
              </div>
            ) : filteredLabours.length > 0 ? (
              <div className="space-y-1">
                {filteredLabours.map((labour) => {
                  const staged = stagedLabours.has(labour.employeeId);
                  const selectable = labour.available && !labour.selected;

                  return (
                    <div
                      key={labour.employeeId}
                      className={cn(
                        "rounded-md border px-2.5 py-2",
                        (labour.selected || staged) && "bg-accent/35",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={labour.selected || staged}
                          disabled={!selectable || pending}
                          onChange={() => toggleLabour(labour.employeeId)}
                          className="mt-0.5 size-4 shrink-0 accent-current"
                          aria-label={`Select ${labour.employeeName}`}
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {labour.employeeName}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {labour.employeeId} · {labour.designation}
                          </p>
                          <div className="mt-1.5 flex items-center justify-between gap-2">
                            <span className="truncate text-xs text-muted-foreground">
                              {labour.statusLabel ?? "Available"}
                            </span>

                            {!labour.selected && !labour.available ? (
                              <div className="flex shrink-0 items-center gap-1">
                                {labour.assignmentRowKey ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2"
                                    onClick={() =>
                                      onViewAssignment(labour.assignmentRowKey!)
                                    }
                                  >
                                    View
                                  </Button>
                                ) : null}

                                {labour.canReassign &&
                                labour.assignmentRowKey &&
                                canReassignLabour ? (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 px-2"
                                    disabled={pending}
                                    onClick={() =>
                                      onReassignLabour(
                                        labour.employeeId,
                                        labour.assignmentRowKey!,
                                      )
                                    }
                                  >
                                    Move here
                                  </Button>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                No labour resources match the current filters.
              </p>
            )}
          </div>

          <div className="border-t p-3">
            <Button
              type="button"
              className="w-full"
              disabled={stagedLabours.size === 0 || pending || !selectedLabel}
              onClick={assignStagedLabours}
            >
              Assign{" "}
              {stagedLabours.size > 0 ? stagedLabours.size : ""} Labour
            </Button>
          </div>
        </>
      )}

      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        {totalEmployees} total employees
      </div>
    </div>
  );
}
