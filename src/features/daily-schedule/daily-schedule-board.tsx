"use client";

import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Save,
  Trash2,
  UsersRound,
  X,
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
  moveLabourAssignmentAction,
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
import { buildDriverOptions } from "@/features/daily-schedule/driver-options";
import { ForemanSelector } from "@/features/daily-schedule/foreman-selector";
import { buildForemanOptions } from "@/features/daily-schedule/foreman-options";
import { LogisticsEditor } from "@/features/daily-schedule/logistics-editor";
import {
  logisticsEditableFieldsFrom,
  type LogisticsEditableFields,
} from "@/features/daily-schedule/logistics-fields";
import {
  DailyTargetEditor,
  TimingEditor,
} from "@/features/daily-schedule/schedule-field-editors";
import {
  hasTimingErrors,
  scheduleEditableFieldsFrom,
  type ScheduleEditableFields,
  validateTimingFields,
} from "@/features/daily-schedule/schedule-fields";
import { buildLabourOptions } from "@/features/daily-schedule/labour-options";
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

type ScheduleRowEditableFields =
  ScheduleEditableFields & LogisticsEditableFields;

type DraftRow = ScheduleRowEditableFields & {
  id: string;
  projectJobNo: string | null;
  foremanEmployeeId: string | null;
  labourEmployeeIds: string[];
};

type SavedScheduleEdits = Record<string, ScheduleRowEditableFields>;

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

function LabourCell({
  employeeIds,
  resources,
  pending,
  onRemove,
}: {
  employeeIds: string[];
  resources: ScheduleResource[];
  pending: boolean;
  onRemove: (employeeId: string) => void;
}) {
  const visible = employeeIds.slice(0, 3);

  return (
    <div>
      <p className="text-sm font-medium">
        {employeeIds.length} assigned
      </p>

      {employeeIds.length === 0 ? (
        <p className="mt-1 text-xs text-muted-foreground">
          Select this row and use the Labour pool.
        </p>
      ) : (
        <div className="mt-1.5 space-y-1">
          {visible.map((employeeId) => {
            const resource = resources.find(
              (item) => item.employeeId === employeeId,
            );

            return (
              <div
                key={employeeId}
                className="flex items-center justify-between gap-2 rounded-sm bg-muted/60 px-2 py-1"
              >
                <span className="min-w-0 truncate text-xs">
                  {resource?.employeeName ?? employeeId}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(employeeId);
                  }}
                  className="shrink-0 rounded-sm p-0.5 text-muted-foreground hover:bg-background hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
                  aria-label={`Remove ${resource?.employeeName ?? employeeId}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}

          {employeeIds.length > visible.length ? (
            <p className="px-1 text-xs text-muted-foreground">
              +{employeeIds.length - visible.length} more
            </p>
          ) : null}
        </div>
      )}
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
  const previousDateRef = useRef(selectedDate);
  const firstSavedKey = initialSchedules[0]
    ? savedRowKey(initialSchedules[0].projectJobNo)
    : null;
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [savedEdits, setSavedEdits] = useState<SavedScheduleEdits>({});
  const [expandedLogisticsRows, setExpandedLogisticsRows] = useState<Set<string>>(
    new Set(),
  );
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(
    firstSavedKey,
  );
  const [deletingJobNo, setDeletingJobNo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const dirtySavedCount = Object.keys(savedEdits).length;
  const hasUnsavedChanges = draftRows.length > 0 || dirtySavedCount > 0;

  useEffect(() => {
    if (previousDateRef.current === selectedDate) {
      return;
    }

    previousDateRef.current = selectedDate;
    setDraftRows([]);
    setSavedEdits({});
    setExpandedLogisticsRows(new Set());
    setSelectedRowKey(firstSavedKey);
  }, [selectedDate, firstSavedKey]);

  useEffect(() => {
    if (!hasUnsavedChanges) {
      return;
    }

    const prompt = "Discard the unsaved schedule changes and continue?";

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
      window.confirm("Discard the unsaved schedule changes and change date?")
    );
  }

  function navigateToDate(date: string) {
    if (!confirmDiscardChanges()) {
      return;
    }

    setDraftRows([]);
    setSavedEdits({});
    setExpandedLogisticsRows(new Set());
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
      {
        id,
        projectJobNo: null,
        foremanEmployeeId: null,
        labourEmployeeIds: [],
        campStartTime: "",
        startTime: "",
        endTime: "",
        dailyTarget: "",
        driverEmployeeId: null,
        equipmentVehicle: "",
      },
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
              labourEmployeeIds:
                row.projectJobNo === projectJobNo
                  ? row.labourEmployeeIds
                  : [],
              driverEmployeeId:
                row.projectJobNo === projectJobNo
                  ? row.driverEmployeeId
                  : null,
              equipmentVehicle:
                row.projectJobNo === projectJobNo
                  ? row.equipmentVehicle
                  : "",
            }
          : row,
      ),
    );
    setSelectedRowKey(id);
  }

  function updateDraftField<K extends keyof ScheduleRowEditableFields>(
    id: string,
    field: K,
    value: ScheduleRowEditableFields[K],
  ) {
    setDraftRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    );
  }

  function editableFieldsForSaved(
    schedule: ScheduleBoardRow,
  ): ScheduleRowEditableFields {
    return (
      savedEdits[schedule.projectJobNo] ?? {
        ...scheduleEditableFieldsFrom(schedule),
        ...logisticsEditableFieldsFrom(schedule),
      }
    );
  }

  function updateSavedField<K extends keyof ScheduleRowEditableFields>(
    schedule: ScheduleBoardRow,
    field: K,
    value: ScheduleRowEditableFields[K],
  ) {
    setSavedEdits((current) => ({
      ...current,
      [schedule.projectJobNo]: {
        ...(current[schedule.projectJobNo] ?? {
          ...scheduleEditableFieldsFrom(schedule),
          ...logisticsEditableFieldsFrom(schedule),
        }),
        [field]: value,
      },
    }));
  }

  function toggleLogistics(rowKey: string) {
    setExpandedLogisticsRows((current) => {
      const next = new Set(current);

      if (next.has(rowKey)) {
        next.delete(rowKey);
      } else {
        next.add(rowKey);
      }

      return next;
    });
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

  function selectedLaboursForRow(rowKey: string | null) {
    if (!rowKey) {
      return [];
    }

    if (rowKey.startsWith(SAVED_ROW_PREFIX)) {
      const projectJobNo = rowKey.slice(SAVED_ROW_PREFIX.length);
      return (
        initialSchedules.find(
          (schedule) => schedule.projectJobNo === projectJobNo,
        )?.labourEmployeeIds ?? []
      );
    }

    return (
      draftRows.find((row) => row.id === rowKey)?.labourEmployeeIds ?? []
    );
  }

  function selectedDriverForRow(rowKey: string | null) {
    if (!rowKey) {
      return null;
    }

    if (rowKey.startsWith(SAVED_ROW_PREFIX)) {
      const projectJobNo = rowKey.slice(SAVED_ROW_PREFIX.length);
      const schedule = initialSchedules.find(
        (item) => item.projectJobNo === projectJobNo,
      );

      if (!schedule) {
        return null;
      }

      return editableFieldsForSaved(schedule).driverEmployeeId;
    }

    return draftRows.find((row) => row.id === rowKey)?.driverEmployeeId ?? null;
  }

  function localResourceRows() {
    const drafts = draftRows.map((row) => ({
      rowKey: row.id,
      projectJobNo: row.projectJobNo,
      foremanEmployeeId: row.foremanEmployeeId,
      labourEmployeeIds: row.labourEmployeeIds,
      driverEmployeeId: row.driverEmployeeId,
    }));

    const editedSavedRows = initialSchedules
      .filter((schedule) => savedEdits[schedule.projectJobNo])
      .map((schedule) => ({
        rowKey: savedRowKey(schedule.projectJobNo),
        projectJobNo: schedule.projectJobNo,
        foremanEmployeeId: schedule.foremanEmployeeId,
        labourEmployeeIds: schedule.labourEmployeeIds,
        driverEmployeeId:
          savedEdits[schedule.projectJobNo].driverEmployeeId,
      }));

    return [...drafts, ...editedSavedRows];
  }

  function foremanOptionsFor(
    rowKey: string,
    projectJobNo: string | null,
    selectedForemanId: string | null,
  ) {
    return buildForemanOptions({
      resources,
      drafts: localResourceRows(),
      projects,
      currentRowKey: rowKey,
      projectJobNo,
      selectedForemanId,
      savedRowKey,
    });
  }

  function labourOptionsFor(
    rowKey: string,
    projectJobNo: string | null,
    selectedLabourIds: string[],
    currentForemanId: string | null,
    currentDriverId: string | null,
  ) {
    return buildLabourOptions({
      resources,
      drafts: localResourceRows(),
      currentRowKey: rowKey,
      projectJobNo,
      selectedLabourIds,
      currentForemanId,
      currentDriverId,
      savedRowKey,
    });
  }

  function driverOptionsFor(
    rowKey: string,
    projectJobNo: string | null,
    selectedDriverId: string | null,
    currentForemanId: string | null,
    currentLabourIds: string[],
  ) {
    return buildDriverOptions({
      resources,
      localRows: localResourceRows(),
      currentRowKey: rowKey,
      projectJobNo,
      selectedDriverId,
      currentForemanId,
      currentLabourIds,
      savedRowKey,
    });
  }

  function schedulePayload(
    schedule: ScheduleBoardRow,
    changes: {
      foremanEmployeeId?: string;
      labourEmployeeIds?: string[];
      editableFields?: ScheduleRowEditableFields;
    } = {},
  ) {
    const editable =
      changes.editableFields ?? {
        ...scheduleEditableFieldsFrom(schedule),
        ...logisticsEditableFieldsFrom(schedule),
      };

    return {
      scheduleDate: selectedDate,
      projectJobNo: schedule.projectJobNo,
      foremanEmployeeId:
        changes.foremanEmployeeId ?? schedule.foremanEmployeeId,
      campStartTime: editable.campStartTime,
      startTime: editable.startTime,
      endTime: editable.endTime,
      dailyTarget: editable.dailyTarget,
      driverEmployeeId: editable.driverEmployeeId ?? undefined,
      equipmentVehicle: editable.equipmentVehicle,
      labourEmployeeIds:
        changes.labourEmployeeIds ?? schedule.labourEmployeeIds,
    };
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
        const result = await saveDailyScheduleAction(
          schedulePayload(schedule, { foremanEmployeeId: employeeId }),
        );

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

  function assignLabours(rowKey: string, employeeIds: string[]) {
    if (employeeIds.length === 0) {
      return;
    }

    if (rowKey.startsWith(SAVED_ROW_PREFIX)) {
      const projectJobNo = rowKey.slice(SAVED_ROW_PREFIX.length);
      const schedule = initialSchedules.find(
        (item) => item.projectJobNo === projectJobNo,
      );

      if (!schedule) {
        return;
      }

      const labourEmployeeIds = [
        ...new Set([...schedule.labourEmployeeIds, ...employeeIds]),
      ];

      startTransition(async () => {
        const result = await saveDailyScheduleAction(
          schedulePayload(schedule, { labourEmployeeIds }),
        );

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }

        toast.success(
          employeeIds.length === 1
            ? "Labour assigned."
            : `${employeeIds.length} labour assigned.`,
        );
        router.refresh();
      });

      return;
    }

    setDraftRows((rows) =>
      rows.map((row) =>
        row.id === rowKey
          ? {
              ...row,
              labourEmployeeIds: [
                ...new Set([...row.labourEmployeeIds, ...employeeIds]),
              ],
            }
          : row,
      ),
    );
    setSelectedRowKey(rowKey);
  }

  function removeLabour(rowKey: string, employeeId: string) {
    const resource = resources.find((item) => item.employeeId === employeeId);

    if (
      !window.confirm(
        `Remove ${resource?.employeeName ?? employeeId} from this project?`,
      )
    ) {
      return;
    }

    if (rowKey.startsWith(SAVED_ROW_PREFIX)) {
      const projectJobNo = rowKey.slice(SAVED_ROW_PREFIX.length);
      const schedule = initialSchedules.find(
        (item) => item.projectJobNo === projectJobNo,
      );

      if (!schedule) {
        return;
      }

      startTransition(async () => {
        const result = await saveDailyScheduleAction(
          schedulePayload(schedule, {
            labourEmployeeIds: schedule.labourEmployeeIds.filter(
              (id) => id !== employeeId,
            ),
          }),
        );

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }

        toast.success("Labour removed.");
        router.refresh();
      });

      return;
    }

    setDraftRows((rows) =>
      rows.map((row) =>
        row.id === rowKey
          ? {
              ...row,
              labourEmployeeIds: row.labourEmployeeIds.filter(
                (id) => id !== employeeId,
              ),
            }
          : row,
      ),
    );
  }

  function reassignLabour(employeeId: string, fromRowKey: string) {
    if (
      !selectedRowKey?.startsWith(SAVED_ROW_PREFIX) ||
      !fromRowKey.startsWith(SAVED_ROW_PREFIX)
    ) {
      return;
    }

    const fromProjectJobNo = fromRowKey.slice(SAVED_ROW_PREFIX.length);
    const toProjectJobNo = selectedRowKey.slice(SAVED_ROW_PREFIX.length);
    const resource = resources.find((item) => item.employeeId === employeeId);

    if (
      !window.confirm(
        `Move ${resource?.employeeName ?? employeeId} from ${fromProjectJobNo} to ${toProjectJobNo}?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await moveLabourAssignmentAction({
        scheduleDate: selectedDate,
        employeeId,
        fromProjectJobNo,
        toProjectJobNo,
      });

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Labour reassigned.");
      router.refresh();
    });
  }

  function saveScheduleChanges() {
    const incompleteDraft = draftRows.some(
      (row) => !row.projectJobNo || !row.foremanEmployeeId,
    );
    const invalidDraftTiming = draftRows.some((row) =>
      hasTimingErrors(validateTimingFields(row)),
    );
    const invalidSavedTiming = initialSchedules.some((schedule) => {
      const edits = savedEdits[schedule.projectJobNo];
      return edits
        ? hasTimingErrors(validateTimingFields(edits))
        : false;
    });

    if (
      !hasUnsavedChanges ||
      incompleteDraft ||
      invalidDraftTiming ||
      invalidSavedTiming
    ) {
      return;
    }

    startTransition(async () => {
      for (const schedule of initialSchedules) {
        const editableFields = savedEdits[schedule.projectJobNo];

        if (!editableFields) {
          continue;
        }

        const result = await saveDailyScheduleAction(
          schedulePayload(schedule, { editableFields }),
        );

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
      }

      for (const row of draftRows) {
        const result = await saveDailyScheduleAction({
          scheduleDate: selectedDate,
          projectJobNo: row.projectJobNo,
          foremanEmployeeId: row.foremanEmployeeId,
          campStartTime: row.campStartTime,
          startTime: row.startTime,
          endTime: row.endTime,
          dailyTarget: row.dailyTarget,
          driverEmployeeId: row.driverEmployeeId ?? undefined,
          equipmentVehicle: row.equipmentVehicle,
          labourEmployeeIds: row.labourEmployeeIds,
        });

        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
      }

      const changeCount = dirtySavedCount + draftRows.length;
      setSavedEdits({});
      setDraftRows([]);
      setSelectedRowKey(null);
      toast.success(
        changeCount === 1
          ? "Schedule changes saved."
          : `${changeCount} schedule rows saved.`,
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
  const selectedLabourIds = selectedLaboursForRow(selectedRowKey);
  const selectedDriverId = selectedDriverForRow(selectedRowKey);
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

  const selectedLabourOptions = selectedRowKey
    ? labourOptionsFor(
        selectedRowKey,
        selectedProjectJobNo,
        selectedLabourIds,
        selectedForemanId,
        selectedDriverId,
      )
    : [];

  const totalLabours =
    initialSchedules.reduce(
      (sum, schedule) => sum + schedule.labourEmployeeIds.length,
      0,
    ) +
    draftRows.reduce(
      (sum, row) => sum + row.labourEmployeeIds.length,
      0,
    );
  const selectedProjectCount = draftRows.filter(
    (row) => row.projectJobNo !== null,
  ).length;
  const draftForemanCount = draftRows.filter(
    (row) => row.foremanEmployeeId !== null,
  ).length;
  const hasIncompleteDrafts = draftRows.some(
    (row) => row.projectJobNo === null || row.foremanEmployeeId === null,
  );
  const hasInvalidTiming =
    draftRows.some((row) =>
      hasTimingErrors(validateTimingFields(row)),
    ) ||
    initialSchedules.some((schedule) => {
      const edits = savedEdits[schedule.projectJobNo];
      return edits
        ? hasTimingErrors(validateTimingFields(edits))
        : false;
    });
  const canSaveChanges =
    hasUnsavedChanges && !hasIncompleteDrafts && !hasInvalidTiming;
  const unsavedRowCount = draftRows.length + dirtySavedCount;

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
                contextKey={selectedRowKey ?? undefined}
                totalEmployees={resources.length}
                error={resourceError}
                selectedLabel={selectedLabel}
                foremen={selectedForemanOptions}
                labours={selectedLabourOptions}
                canReassignLabour={Boolean(
                  selectedRowKey?.startsWith(SAVED_ROW_PREFIX),
                )}
                pending={pending}
                onAssignForeman={(employeeId) => {
                  if (selectedRowKey) {
                    assignForeman(selectedRowKey, employeeId);
                  }
                }}
                onAssignLabours={(employeeIds) => {
                  if (selectedRowKey) {
                    assignLabours(selectedRowKey, employeeIds);
                  }
                }}
                onReassignLabour={reassignLabour}
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
            onClick={saveScheduleChanges}
            disabled={!canSaveChanges || pending}
            title={
              !hasUnsavedChanges
                ? "No unsaved schedule changes."
                : hasIncompleteDrafts
                  ? "Select a project and foreman for every draft row."
                  : hasInvalidTiming
                    ? "Correct the highlighted timing values before saving."
                    : "Save schedule changes."
            }
          >
            <Save className="size-4" />
            {pending && canSaveChanges ? "Saving..." : "Save Schedule"}
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
                    const foremanOptions = foremanOptionsFor(
                      rowKey,
                      row.projectJobNo,
                      row.foremanEmployeeId,
                    );
                    const editableFields = editableFieldsForSaved(row);
                    const timingErrors =
                      validateTimingFields(editableFields);
                    const driverOptions = driverOptionsFor(
                      rowKey,
                      row.projectJobNo,
                      editableFields.driverEmployeeId,
                      row.foremanEmployeeId,
                      row.labourEmployeeIds,
                    );
                    const logisticsExpanded =
                      expandedLogisticsRows.has(rowKey);
                    const selectedDriver = resources.find(
                      (resource) =>
                        resource.employeeId ===
                        editableFields.driverEmployeeId,
                    );

                    return (
                      <div
                        key={row.projectJobNo}
                        className={cn(
                          "transition-colors",
                          selected && "bg-accent/35",
                        )}
                      >
                        <div
                          onClick={() => setSelectedRowKey(rowKey)}
                          className="grid min-h-28 cursor-pointer grid-cols-[1.25fr_1fr_1.2fr_0.85fr_1.5fr]"
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
                            options={foremanOptions}
                            value={row.foremanEmployeeId}
                            disabled={pending}
                            onValueChange={(employeeId) =>
                              assignForeman(rowKey, employeeId)
                            }
                          />
                        </div>

                        <div className="px-3 py-3">
                          <LabourCell
                            employeeIds={row.labourEmployeeIds}
                            resources={resources}
                            pending={pending}
                            onRemove={(employeeId) =>
                              removeLabour(rowKey, employeeId)
                            }
                          />
                        </div>

                        <div
                          className="px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <TimingEditor
                            value={editableFields}
                            errors={timingErrors}
                            disabled={pending}
                            onChange={(field, value) =>
                              updateSavedField(row, field, value)
                            }
                          />
                        </div>

                        <div
                          className="px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DailyTargetEditor
                            value={editableFields.dailyTarget}
                            disabled={pending}
                            onChange={(value) =>
                              updateSavedField(row, "dailyTarget", value)
                            }
                          />
                        </div>
                        </div>

                        <div className="border-t border-dashed">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRowKey(rowKey);
                              toggleLogistics(rowKey);
                            }}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              Logistics
                              {selectedDriver || editableFields.equipmentVehicle ? (
                                <span className="font-normal text-muted-foreground">
                                  {selectedDriver?.employeeName ?? "No driver"}
                                  {editableFields.equipmentVehicle
                                    ? ` · ${editableFields.equipmentVehicle}`
                                    : ""}
                                </span>
                              ) : (
                                <span className="font-normal text-muted-foreground">
                                  Optional
                                </span>
                              )}
                            </span>
                            <ChevronDown
                              className={cn(
                                "size-4 text-muted-foreground transition-transform",
                                logisticsExpanded && "rotate-180",
                              )}
                            />
                          </button>

                          {logisticsExpanded ? (
                            <div
                              className="border-t bg-muted/10 px-3 py-3"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <LogisticsEditor
                                driverOptions={driverOptions}
                                driverEmployeeId={editableFields.driverEmployeeId}
                                equipmentVehicle={editableFields.equipmentVehicle}
                                disabled={pending}
                                onDriverChange={(employeeId) =>
                                  updateSavedField(
                                    row,
                                    "driverEmployeeId",
                                    employeeId,
                                  )
                                }
                                onEquipmentVehicleChange={(value) =>
                                  updateSavedField(
                                    row,
                                    "equipmentVehicle",
                                    value,
                                  )
                                }
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}

                  {draftRows.map((row) => {
                    const selected = selectedRowKey === row.id;
                    const foremanOptions = foremanOptionsFor(
                      row.id,
                      row.projectJobNo,
                      row.foremanEmployeeId,
                    );
                    const timingErrors = validateTimingFields(row);
                    const driverOptions = driverOptionsFor(
                      row.id,
                      row.projectJobNo,
                      row.driverEmployeeId,
                      row.foremanEmployeeId,
                      row.labourEmployeeIds,
                    );
                    const logisticsExpanded =
                      expandedLogisticsRows.has(row.id);
                    const selectedDriver = resources.find(
                      (resource) =>
                        resource.employeeId === row.driverEmployeeId,
                    );

                    return (
                      <div
                        key={row.id}
                        className={cn(
                          "bg-muted/10 transition-colors",
                          selected && "bg-accent/35",
                        )}
                      >
                        <div
                          onClick={() => setSelectedRowKey(row.id)}
                          className="grid min-h-28 cursor-pointer grid-cols-[1.25fr_1fr_1.2fr_0.85fr_1.5fr]"
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
                            options={foremanOptions}
                            value={row.foremanEmployeeId}
                            disabled={!row.projectJobNo || pending}
                            onValueChange={(employeeId) =>
                              assignForeman(row.id, employeeId)
                            }
                          />
                        </div>

                        <div className="px-3 py-3">
                          <LabourCell
                            employeeIds={row.labourEmployeeIds}
                            resources={resources}
                            pending={pending}
                            onRemove={(employeeId) =>
                              removeLabour(row.id, employeeId)
                            }
                          />
                        </div>

                        <div
                          className="px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <TimingEditor
                            value={row}
                            errors={timingErrors}
                            disabled={pending}
                            onChange={(field, value) =>
                              updateDraftField(row.id, field, value)
                            }
                          />
                        </div>
                        <div
                          className="px-3 py-3"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <DailyTargetEditor
                            value={row.dailyTarget}
                            disabled={pending}
                            onChange={(value) =>
                              updateDraftField(row.id, "dailyTarget", value)
                            }
                          />
                        </div>
                        </div>

                        <div className="border-t border-dashed">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedRowKey(row.id);
                              toggleLogistics(row.id);
                            }}
                            className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs hover:bg-muted/40"
                          >
                            <span className="flex items-center gap-2 font-medium">
                              Logistics
                              {selectedDriver || row.equipmentVehicle ? (
                                <span className="font-normal text-muted-foreground">
                                  {selectedDriver?.employeeName ?? "No driver"}
                                  {row.equipmentVehicle
                                    ? ` · ${row.equipmentVehicle}`
                                    : ""}
                                </span>
                              ) : (
                                <span className="font-normal text-muted-foreground">
                                  Optional
                                </span>
                              )}
                            </span>
                            <ChevronDown
                              className={cn(
                                "size-4 text-muted-foreground transition-transform",
                                logisticsExpanded && "rotate-180",
                              )}
                            />
                          </button>

                          {logisticsExpanded ? (
                            <div
                              className="border-t bg-background/40 px-3 py-3"
                              onClick={(event) => event.stopPropagation()}
                            >
                              <LogisticsEditor
                                driverOptions={driverOptions}
                                driverEmployeeId={row.driverEmployeeId}
                                equipmentVehicle={row.equipmentVehicle}
                                disabled={!row.projectJobNo || pending}
                                onDriverChange={(employeeId) =>
                                  updateDraftField(
                                    row.id,
                                    "driverEmployeeId",
                                    employeeId,
                                  )
                                }
                                onEquipmentVehicleChange={(value) =>
                                  updateDraftField(
                                    row.id,
                                    "equipmentVehicle",
                                    value,
                                  )
                                }
                              />
                            </div>
                          ) : null}
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
                {unsavedRowCount} unsaved{" "}
                {unsavedRowCount === 1 ? "row" : "rows"}
              </span>
            ) : (
              <span>All loaded rows are saved</span>
            )}
          </div>
        </div>

        <aside className="sticky top-[4.5rem] hidden h-[calc(100vh-6.5rem)] overflow-hidden rounded-lg border bg-card xl:block">
          <ResourcePoolPanel
            contextKey={selectedRowKey ?? undefined}
            totalEmployees={resources.length}
            error={resourceError}
            selectedLabel={selectedLabel}
            foremen={selectedForemanOptions}
            labours={selectedLabourOptions}
            canReassignLabour={Boolean(
              selectedRowKey?.startsWith(SAVED_ROW_PREFIX),
            )}
            pending={pending}
            onAssignForeman={(employeeId) => {
              if (selectedRowKey) {
                assignForeman(selectedRowKey, employeeId);
              }
            }}
            onAssignLabours={(employeeIds) => {
              if (selectedRowKey) {
                assignLabours(selectedRowKey, employeeIds);
              }
            }}
            onReassignLabour={reassignLabour}
            onViewAssignment={setSelectedRowKey}
          />
        </aside>
      </div>
    </div>
  );
}
