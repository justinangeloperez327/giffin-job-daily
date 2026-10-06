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
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  deleteDailyScheduleAction,
  saveDailyScheduleAction,
} from "@/app/daily-schedule/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ForemanSelector,
  type ForemanOption,
} from "@/features/daily-schedule/foreman-selector";
import {
  ProjectSelector,
  type ScheduleProjectOption,
} from "@/features/daily-schedule/project-selector";
import { ResourcePoolPanel } from "@/features/daily-schedule/resource-pool";
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
  labourEmployeeIds: string[];
  campStartTime: string | null;
  startTime: string | null;
  endTime: string | null;
  dailyTarget: string | null;
  driverEmployeeId: string | null;
  equipmentVehicle: string | null;
};

export type ScheduleResource = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
  available: boolean;
  assignedToCurrentSchedule: boolean;
  assignments: Array<{
    role: "FOREMAN" | "LABOUR" | "DRIVER";
    projectJobNo: string;
    projectName: string;
  }>;
  blockingAssignments: Array<{
    role: "FOREMAN" | "LABOUR" | "DRIVER";
    projectJobNo: string;
    projectName: string;
  }>;
};

type DraftRow = {
  id: string;
  projectJobNo: string | null;
  foremanEmployeeId: string | null;
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

function roleLabel(role: "FOREMAN" | "LABOUR" | "DRIVER") {
  if (role === "FOREMAN") {
    return "Foreman";
  }

  if (role === "DRIVER") {
    return "Driver";
  }

  return "Labour";
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
  projects,
  projectError,
  resources,
  resourceError,
}: {
  selectedDate: string;
  today: string;
  initialSchedules: ScheduleBoardRow[];
  projects: ScheduleProjectOption[];
  projectError?: string;
  resources: ScheduleResource[];
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
    if (event.target.value) {
      navigateToDate(event.target.value);
    }
  }

  function addDraftRow() {
    const id = `draft-${nextDraftId.current}`;
    nextDraftId.current += 1;
    setDraftRows((rows) => [
      ...rows,
      { id, projectJobNo: null, foremanEmployeeId: null },
    ]);
    setSelectedRowKey(id);
  }

  function removeDraftRow(id: string) {
    setDraftRows((rows) => rows.filter((row) => row.id !== id));

    if (selectedRowKey === id) {
      setSelectedRowKey(firstSavedKey);
    }
  }

  function selectDraftProject(id: string, projectJobNo: string) {
    setDraftRows((rows) =>
      rows.map((row) =>
        row.id === id
          ? {
              ...row,
              projectJobNo,
              foremanEmployeeId:
                row.projectJobNo === projectJobNo
                  ? row.foremanEmployeeId
                  : null,
            }
          : row,
      ),
    );
    setSelectedRowKey(id);
  }

  function blockedProjectJobNos(currentDraftId: string) {
    return [
      ...initialSchedules.map((schedule) => schedule.projectJobNo),
      ...draftRows
        .filter(
          (row) =>
            row.id !== currentDraftId &&
            row.projectJobNo !== null,
        )
        .map((row) => row.projectJobNo as string),
    ];
  }

  function selectedProjectForRow(rowKey: string | null) {
    if (!rowKey) {
      return null;
    }

    if (rowKey.startsWith(SAVED_ROW_PREFIX)) {
      return rowKey.slice(SAVED_ROW_PREFIX.length);
    }

    return draftRows.find((row) => row.id === rowKey)?.projectJobNo ?? null;
  }

  function selectedForemanForRow(rowKey: string | null) {
    if (!rowKey) {
      return null;
    }

    if (rowKey.startsWith(SAVED_ROW_PREFIX)) {
      const projectJobNo = rowKey.slice(SAVED_ROW_PREFIX.length);
      return (
        initialSchedules.find(
          (schedule) => schedule.projectJobNo === projectJobNo,
        )?.foremanEmployeeId ?? null
      );
    }

    return (
      draftRows.find((row) => row.id === rowKey)?.foremanEmployeeId ?? null
    );
  }

  function foremanOptionsFor(
    rowKey: string,
    projectJobNo: string | null,
    selectedForemanId: string | null,
  ): ForemanOption[] {
    const draftAssignments = draftRows
      .filter(
        (row) =>
          row.id !== rowKey &&
          row.foremanEmployeeId !== null,
      )
      .map((row) => ({
        employeeId: row.foremanEmployeeId as string,
        rowKey: row.id,
        projectJobNo: row.projectJobNo,
      }));

    return resources
      .filter(
        (resource) =>
          resource.designation.toLowerCase().includes("foreman") ||
          resource.employeeId === selectedForemanId,
      )
      .map((resource) => {
        const selected = resource.employeeId === selectedForemanId;
        const databaseBlocker = resource.assignments.find(
          (assignment) =>
            assignment.projectJobNo !== projectJobNo ||
            assignment.role !== "FOREMAN",
        );
        const draftBlocker = draftAssignments.find(
          (assignment) => assignment.employeeId === resource.employeeId,
        );

        const available =
          selected || (!databaseBlocker && !draftBlocker && Boolean(projectJobNo));

        let statusLabel: string | undefined;
        let assignmentRowKey: string | undefined;

        if (selected) {
          statusLabel = "Selected";
        } else if (draftBlocker) {
          const project = projects.find(
            (item) => item.jobNo === draftBlocker.projectJobNo,
          );
          statusLabel = `Assigned → ${project?.jobNo ?? "Draft"}`;
          assignmentRowKey = draftBlocker.rowKey;
        } else if (databaseBlocker) {
          statusLabel = `${roleLabel(databaseBlocker.role)} → ${databaseBlocker.projectJobNo}`;
          assignmentRowKey = savedRowKey(databaseBlocker.projectJobNo);
        } else if (projectJobNo) {
          statusLabel = "Available";
        }

        return {
          employeeId: resource.employeeId,
          employeeName: resource.employeeName,
          designation: resource.designation,
          available,
          selected,
          statusLabel,
          assignmentRowKey,
        };
      });
  }

  function assignForeman(rowKey: string, employeeId: string) {
    if (rowKey.startsWith(SAVED_ROW_PREFIX)) {
      const projectJobNo = rowKey.slice(SAVED_ROW_PREFIX.length);
      const schedule = initialSchedules.find(
        (item) => item.projectJobNo === projectJobNo,
      );

      if (!schedule || schedule.foremanEmployeeId === employeeId) {
        return;
      }

      const foreman = resources.find(
        (resource) => resource.employeeId === employeeId,
      );

      if (
        !window.confirm(
          `Reassign ${schedule.projectName} from ${schedule.foremanName} to ${foreman?.employeeName ?? employeeId}?`,
        )
      ) {
        return;
      }

      startTransition(async () => {
        const result = await saveDailyScheduleAction({
          scheduleDate: selectedDate,
          projectJobNo: schedule.projectJobNo,
          foremanEmployeeId: employeeId,
          campStartTime: schedule.campStartTime ?? undefined,
          startTime: schedule.startTime ?? undefined,
          endTime: schedule.endTime ?? undefined,
          dailyTarget: schedule.dailyTarget ?? undefined,
          driverEmployeeId: schedule.driverEmployeeId ?? undefined,
          equipmentVehicle: schedule.equipmentVehicle ?? undefined,
          labourEmployeeIds: schedule.labourEmployeeIds,
        });

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }

        toast.success("Foreman reassigned.");
        router.refresh();
      });

      return;
    }

    setDraftRows((rows) =>
      rows.map((row) =>
        row.id === rowKey ? { ...row, foremanEmployeeId: employeeId } : row,
      ),
    );
    setSelectedRowKey(rowKey);
  }

  function saveDraftSchedules() {
    const incomplete = draftRows.some(
      (row) => !row.projectJobNo || !row.foremanEmployeeId,
    );

    if (draftRows.length === 0 || incomplete) {
      return;
    }

    startTransition(async () => {
      for (const row of draftRows) {
        const result = await saveDailyScheduleAction({
          scheduleDate: selectedDate,
          projectJobNo: row.projectJobNo,
          foremanEmployeeId: row.foremanEmployeeId,
          labourEmployeeIds: [],
        });

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
      }

      const count = draftRows.length;
      setDraftRows([]);
      setSelectedRowKey(null);
      toast.success(
        count === 1 ? "Schedule saved." : `${count} schedules saved.`,
      );
      router.refresh();
    });
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

  const selectedProjectJobNo = selectedProjectForRow(selectedRowKey);
  const selectedForemanId = selectedForemanForRow(selectedRowKey);
  const selectedProject = projects.find(
    (project) => project.jobNo === selectedProjectJobNo,
  );
  const selectedSavedSchedule = initialSchedules.find(
    (schedule) => schedule.projectJobNo === selectedProjectJobNo,
  );
  const selectedLabel =
    selectedProject?.projectName ?? selectedSavedSchedule?.projectName;
  const selectedForemanOptions = selectedRowKey
    ? foremanOptionsFor(
        selectedRowKey,
        selectedProjectJobNo,
        selectedForemanId,
      )
    : [];

  const totalLabours = initialSchedules.reduce(
    (sum, schedule) => sum + schedule.labourCount,
    0,
  );
  const selectedProjectCount = draftRows.filter(
    (row) => row.projectJobNo !== null,
  ).length;
  const draftForemanCount = draftRows.filter(
    (row) => row.foremanEmployeeId !== null,
  ).length;
  const canSaveDrafts =
    draftRows.length > 0 &&
    draftRows.every(
      (row) => row.projectJobNo !== null && row.foremanEmployeeId !== null,
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
                totalEmployees={resources.length}
                error={resourceError}
                selectedLabel={selectedLabel}
                foremen={selectedForemanOptions}
                onAssignForeman={(employeeId) => {
                  if (selectedRowKey) {
                    assignForeman(selectedRowKey, employeeId);
                  }
                }}
                onViewAssignment={setSelectedRowKey}
              />
            </SheetContent>
          </Sheet>

          <Button
            variant="outline"
            onClick={addDraftRow}
            disabled={projects.length === 0 || pending}
          >
            <Plus className="size-4" />
            Add Project
          </Button>

          <Button
            onClick={saveDraftSchedules}
            disabled={!canSaveDrafts || pending}
            title={
              draftRows.length === 0
                ? "No unsaved schedule rows."
                : canSaveDrafts
                  ? "Save new schedule rows."
                  : "Select a project and foreman for every draft row."
            }
          >
            <Save className="size-4" />
            {pending && canSaveDrafts ? "Saving..." : "Save Schedule"}
          </Button>
        </div>
      </div>

      {projectError ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Projects could not be loaded: {projectError}
        </div>
      ) : null}

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
                    {projects.length > 0
                      ? `Add a project row to begin planning resources for ${displayDate(selectedDate)}.`
                      : "Add projects in the Projects module before creating a daily schedule."}
                  </p>
                  <Button
                    className="mt-4"
                    variant="outline"
                    onClick={addDraftRow}
                    disabled={projects.length === 0}
                  >
                    <Plus className="size-4" />
                    Add Project
                  </Button>
                </div>
              ) : (
                <div className="divide-y">
                  {initialSchedules.map((row) => {
                    const rowKey = savedRowKey(row.projectJobNo);
                    const selected = selectedRowKey === rowKey;
                    const options = foremanOptionsFor(
                      rowKey,
                      row.projectJobNo,
                      row.foremanEmployeeId,
                    );

                    return (
                      <div
                        key={row.projectJobNo}
                        onClick={() => setSelectedRowKey(rowKey)}
                        className={cn(
                          "grid min-h-28 cursor-pointer grid-cols-[1.25fr_1fr_1.2fr_0.85fr_1.5fr] transition-colors",
                          selected && "bg-accent/35",
                        )}
                      >
                        <div className="relative px-3 py-3 pr-10">
                          <button
                            type="button"
                            className="block w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-pressed={selected}
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRowKey(rowKey);
                            }}
                          >
                            <span className="block text-sm font-medium">
                              {row.projectName}
                            </span>
                            <span className="mt-1 block text-xs text-muted-foreground">
                              Job {row.projectJobNo} · SO {row.soNo}
                            </span>
                          </button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 size-8 text-muted-foreground hover:text-destructive"
                            disabled={
                              pending && deletingJobNo === row.projectJobNo
                            }
                            onClick={(event) => {
                              event.stopPropagation();
                              removeSavedSchedule(
                                row.projectJobNo,
                                row.projectName,
                              );
                            }}
                            aria-label={`Remove ${row.projectName} from schedule`}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div
                          className="px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ForemanSelector
                            options={options}
                            value={row.foremanEmployeeId}
                            disabled={pending}
                            onValueChange={(employeeId) =>
                              assignForeman(rowKey, employeeId)
                            }
                          />
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
                    const options = foremanOptionsFor(
                      row.id,
                      row.projectJobNo,
                      row.foremanEmployeeId,
                    );

                    return (
                      <div
                        key={row.id}
                        onClick={() => setSelectedRowKey(row.id)}
                        className={cn(
                          "grid min-h-28 cursor-pointer grid-cols-[1.25fr_1fr_1.2fr_0.85fr_1.5fr] bg-muted/10 transition-colors",
                          selected && "bg-accent/35",
                        )}
                      >
                        <div
                          className="relative px-3 py-3 pr-10"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ProjectSelector
                            projects={projects}
                            value={row.projectJobNo}
                            disabledJobNos={blockedProjectJobNos(row.id)}
                            onValueChange={(jobNo) =>
                              selectDraftProject(row.id, jobNo)
                            }
                            disabled={pending}
                            error={projectError}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-1 top-1 size-8 text-muted-foreground hover:text-destructive"
                            disabled={pending}
                            onClick={(event) => {
                              event.stopPropagation();
                              removeDraftRow(row.id);
                            }}
                            aria-label="Remove draft schedule row"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>

                        <div
                          className="px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <ForemanSelector
                            options={options}
                            value={row.foremanEmployeeId}
                            disabled={!row.projectJobNo || pending}
                            onValueChange={(employeeId) =>
                              assignForeman(row.id, employeeId)
                            }
                          />
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
              {initialSchedules.length + selectedProjectCount}{" "}
              {initialSchedules.length + selectedProjectCount === 1
                ? "project"
                : "projects"}{" "}
              · {totalLabours} labour ·{" "}
              {initialSchedules.length + draftForemanCount} foremen
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
            totalEmployees={resources.length}
            error={resourceError}
            selectedLabel={selectedLabel}
            foremen={selectedForemanOptions}
            onAssignForeman={(employeeId) => {
              if (selectedRowKey) {
                assignForeman(selectedRowKey, employeeId);
              }
            }}
            onViewAssignment={setSelectedRowKey}
          />
        </aside>
      </div>
    </div>
  );
}
