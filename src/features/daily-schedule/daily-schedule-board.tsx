"use client";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { deleteDailyScheduleAction } from "@/app/daily-schedule/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { shiftScheduleDate } from "@/lib/date-time";
import { cn } from "@/lib/utils";

export type ScheduleBoardRow = {
  projectJobNo: string;
  projectName: string;
  soNo: string;
  foremanEmployeeId: string;
  foremanName: string;
  labourCount: number;
  labourNames: string[];
  campStartTime: string | null;
  startTime: string | null;
  endTime: string | null;
  dailyTarget: string | null;
};

export type ResourcePoolSummary = {
  total: number;
  available: number;
  assigned: number;
};

type DraftRow = {
  id: string;
};

const SAVED_ROW_PREFIX = "saved:";

function savedRowKey(projectJobNo: string) {
  return `${SAVED_ROW_PREFIX}${projectJobNo}`;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function ResourcePoolPanel({
  summary,
  error,
  selectedLabel,
}: {
  summary: ResourcePoolSummary;
  error?: string;
  selectedLabel?: string;
}) {
  const [tab, setTab] = useState<"foremen" | "labours">("foremen");

  return (
    <div className="flex h-full min-h-80 flex-col">
      <div className="border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <UsersRound className="size-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Resource Pool</h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {summary.available} available · {summary.assigned} assigned
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

      <div className="flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
        {error ? (
          <>
            <p className="text-sm font-medium">Resource pool unavailable</p>
            <p className="mt-1 text-xs text-muted-foreground">{error}</p>
          </>
        ) : selectedLabel ? (
          <>
            <p className="text-sm font-medium">{selectedLabel}</p>
            <p className="mt-1 max-w-56 text-xs text-muted-foreground">
              {tab === "foremen"
                ? "Foreman resources for this schedule row will appear here."
                : "Labour search, filtering, and bulk assignment for this schedule row will appear here."}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium">Select a schedule row</p>
            <p className="mt-1 max-w-56 text-xs text-muted-foreground">
              Choose a project row before assigning resources.
            </p>
          </>
        )}
      </div>

      <div className="border-t px-4 py-2 text-xs text-muted-foreground">
        {summary.total} total employees
      </div>
    </div>
  );
}

function TimingCell({ row }: { row: ScheduleBoardRow }) {
  if (!row.campStartTime && !row.startTime && !row.endTime) {
    return <span className="text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-0.5 text-xs">
      <div>
        <span className="text-muted-foreground">Camp</span>{" "}
        {row.campStartTime ?? "—"}
      </div>
      <div>
        <span className="text-muted-foreground">Start</span>{" "}
        {row.startTime ?? "—"}
      </div>
      <div>
        <span className="text-muted-foreground">End</span>{" "}
        {row.endTime ?? "—"}
      </div>
    </div>
  );
}

export function DailyScheduleBoard({
  selectedDate,
  today,
  initialSchedules,
  resourceSummary,
  resourceError,
}: {
  selectedDate: string;
  today: string;
  initialSchedules: ScheduleBoardRow[];
  resourceSummary: ResourcePoolSummary;
  resourceError?: string;
}) {
  const router = useRouter();
  const nextDraftId = useRef(1);
  const firstSavedKey = initialSchedules[0]
    ? savedRowKey(initialSchedules[0].projectJobNo)
    : null;
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(
    firstSavedKey,
  );
  const [deletingJobNo, setDeletingJobNo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const hasUnsavedChanges = draftRows.length > 0;

  useEffect(() => {
    setSelectedRowKey(firstSavedKey);
  }, [selectedDate, firstSavedKey]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const prompt = "Discard the unsaved schedule row(s) and continue?";

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const handleInternalNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.target && anchor.target !== "_self") {
        return;
      }

      const destination = new URL(anchor.href, window.location.href);

      if (
        destination.origin !== window.location.origin ||
        (destination.pathname === window.location.pathname &&
          destination.search === window.location.search)
      ) {
        return;
      }

      if (!window.confirm(prompt)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleInternalNavigation, true);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleInternalNavigation, true);
    };
  }, [hasUnsavedChanges]);

  function confirmDiscardChanges() {
    return (
      !hasUnsavedChanges ||
      window.confirm("Discard the unsaved schedule row(s) and change date?")
    );
  }

  function navigateToDate(date: string) {
    if (!confirmDiscardChanges()) {
      return;
    }

    setDraftRows([]);
    router.push(`/daily-schedule?date=${encodeURIComponent(date)}`);
  }

  function handleDateChange(event: ChangeEvent<HTMLInputElement>) {
    if (!event.target.value) {
      return;
    }

    navigateToDate(event.target.value);
  }

  function addDraftRow() {
    const id = `draft-${nextDraftId.current}`;
    nextDraftId.current += 1;
    setDraftRows((rows) => [...rows, { id }]);
    setSelectedRowKey(id);
  }

  function removeDraftRow(id: string) {
    setDraftRows((rows) => rows.filter((row) => row.id !== id));

    if (selectedRowKey === id) {
      setSelectedRowKey(firstSavedKey);
    }
  }

  function selectRowFromKeyboard(
    event: KeyboardEvent<HTMLDivElement>,
    rowKey: string,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setSelectedRowKey(rowKey);
    }
  }

  function removeSavedSchedule(projectJobNo: string, projectName: string) {
    if (
      !window.confirm(
        `Remove ${projectName} from the schedule for ${displayDate(selectedDate)}?`,
      )
    ) {
      return;
    }

    setDeletingJobNo(projectJobNo);
    startTransition(async () => {
      const result = await deleteDailyScheduleAction(
        selectedDate,
        projectJobNo,
      );

      setDeletingJobNo(null);

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      if (selectedRowKey === savedRowKey(projectJobNo)) {
        setSelectedRowKey(null);
      }

      toast.success("Schedule row removed.");
      router.refresh();
    });
  }

  const selectedLabel = selectedRowKey
    ? selectedRowKey.startsWith(SAVED_ROW_PREFIX)
      ? initialSchedules.find(
          (schedule) =>
            schedule.projectJobNo ===
            selectedRowKey.slice(SAVED_ROW_PREFIX.length),
        )?.projectName
      : "New project row"
    : undefined;

  const totalLabours = initialSchedules.reduce(
    (sum, schedule) => sum + schedule.labourCount,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateToDate(shiftScheduleDate(selectedDate, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <Input
            type="date"
            value={selectedDate}
            onChange={handleDateChange}
            className="w-40"
            aria-label="Schedule date"
          />

          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateToDate(shiftScheduleDate(selectedDate, 1))}
            aria-label="Next day"
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigateToDate(today)}
            disabled={selectedDate === today}
          >
            Today
          </Button>

          <span className="hidden text-sm text-muted-foreground sm:inline">
            {displayDate(selectedDate)}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="xl:hidden">
                <UsersRound className="size-4" />
                Resource Pool
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full p-0 sm:max-w-sm">
              <SheetHeader className="sr-only">
                <SheetTitle>Resource Pool</SheetTitle>
              </SheetHeader>
              <ResourcePoolPanel
                summary={resourceSummary}
                error={resourceError}
                selectedLabel={selectedLabel}
              />
            </SheetContent>
          </Sheet>

          <Button variant="outline" onClick={addDraftRow}>
            <Plus className="size-4" />
            Add Project
          </Button>

          <Button
            disabled
            title={
              hasUnsavedChanges
                ? "Complete the required project and resource fields before saving."
                : "No unsaved schedule changes."
            }
          >
            <Save className="size-4" />
            Save Schedule
          </Button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 overflow-hidden rounded-lg border bg-card">
          <div className="overflow-x-auto">
            <div className="min-w-[980px]">
              <div className="grid grid-cols-[1.25fr_1fr_1.2fr_0.85fr_1.5fr] border-b bg-muted/30">
                {["Project", "Foreman", "Labours", "Timing", "Daily Target"].map(
                  (heading) => (
                    <div
                      key={heading}
                      className="px-3 py-2.5 text-xs font-medium text-muted-foreground"
                    >
                      {heading}
                    </div>
                  ),
                )}
              </div>

              {initialSchedules.length === 0 && draftRows.length === 0 ? (
                <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center">
                  <div className="mb-3 rounded-md border bg-muted/40 p-2.5">
                    <CalendarDays className="size-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">
                    No projects scheduled for this day
                  </p>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">
                    Add a project row to begin planning resources for{" "}
                    {displayDate(selectedDate)}.
                  </p>
                  <Button className="mt-4" variant="outline" onClick={addDraftRow}>
                    <Plus className="size-4" />
                    Add Project
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {initialSchedules.map((row) => {
                    const rowKey = savedRowKey(row.projectJobNo);
                    const selected = selectedRowKey === rowKey;

                    return (
                      <div
                        key={row.projectJobNo}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected}
                        onClick={() => setSelectedRowKey(rowKey)}
                        onKeyDown={(event) =>
                          selectRowFromKeyboard(event, rowKey)
                        }
                        className={cn(
                          "grid min-h-28 cursor-pointer grid-cols-[1.25fr_1fr_1.2fr_0.85fr_1.5fr] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                          selected && "bg-accent/35",
                        )}
                      >
                        <div className="relative px-3 py-3 pr-10">
                          <p className="text-sm font-medium">{row.projectName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Job {row.projectJobNo} · SO {row.soNo}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 size-8 text-muted-foreground hover:text-destructive"
                            disabled={pending}
                            onClick={() =>
                              removeSavedSchedule(
                                row.projectJobNo,
                                row.projectName,
                              )
                            }
                            aria-label={`Remove ${row.projectName} from schedule`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div className="px-3 py-3">
                          <p className="text-sm">{row.foremanName}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {row.foremanEmployeeId}
                          </p>
                        </div>

                        <div className="px-3 py-3">
                          <p className="text-sm font-medium">
                            {row.labourCount} assigned
                          </p>
                          {row.labourNames.length > 0 ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {row.labourNames.join(", ")}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-muted-foreground">
                              No labour assigned
                            </p>
                          )}
                        </div>

                        <div className="px-3 py-3">
                          <TimingCell row={row} />
                        </div>

                        <div className="px-3 py-3">
                          <p className="whitespace-pre-wrap text-sm">
                            {row.dailyTarget ?? (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {draftRows.map((row) => {
                    const selected = selectedRowKey === row.id;

                    return (
                      <div
                        key={row.id}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selected}
                        onClick={() => setSelectedRowKey(row.id)}
                        onKeyDown={(event) =>
                          selectRowFromKeyboard(event, row.id)
                        }
                        className={cn(
                          "grid min-h-28 cursor-pointer grid-cols-[1.25fr_1fr_1.2fr_0.85fr_1.5fr] bg-muted/10 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                          selected && "bg-accent/35",
                        )}
                      >
                        <div className="relative px-3 py-3 pr-10">
                          <div className="rounded-md border border-dashed px-3 py-2">
                            <p className="text-sm font-medium">Select project</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Project selection is required before saving.
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeDraftRow(row.id)}
                            aria-label="Remove draft schedule row"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          Not selected
                        </div>
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          0 assigned
                        </div>
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          —
                        </div>
                        <div className="px-3 py-3 text-sm text-muted-foreground">
                          —
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              {initialSchedules.length}{" "}
              {initialSchedules.length === 1 ? "project" : "projects"} ·{" "}
              {totalLabours} labour · {initialSchedules.length} foremen
            </span>
            {hasUnsavedChanges ? (
              <span className="font-medium text-foreground">
                {draftRows.length} unsaved{" "}
                {draftRows.length === 1 ? "row" : "rows"}
              </span>
            ) : (
              <span>All loaded rows are saved</span>
            )}
          </div>
        </div>

        <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-6.5rem)] overflow-hidden rounded-lg border bg-card xl:block">
          <ResourcePoolPanel
            summary={resourceSummary}
            error={resourceError}
            selectedLabel={selectedLabel}
          />
        </aside>
      </div>
    </div>
  );
}
