import type { ForemanOption } from "@/features/daily-schedule/foreman-selector";

export type ForemanResourceInput = {
  employeeId: string;
  employeeName: string;
  designation: string;
  assignments: Array<{
    role: "FOREMAN" | "LABOUR" | "DRIVER";
    projectJobNo: string;
    projectName: string;
  }>;
};

export type DraftForemanAssignment = {
  rowKey: string;
  projectJobNo: string | null;
  foremanEmployeeId: string | null;
};

export type ProjectReference = {
  jobNo: string;
};

function roleLabel(role: "FOREMAN" | "LABOUR" | "DRIVER") {
  if (role === "FOREMAN") {
    return "Foreman";
  }

  if (role === "DRIVER") {
    return "Driver";
  }

  return "Labour";
}

export function buildForemanOptions({
  resources,
  drafts,
  projects,
  currentRowKey,
  projectJobNo,
  selectedForemanId,
  savedRowKey,
}: {
  resources: ForemanResourceInput[];
  drafts: DraftForemanAssignment[];
  projects: ProjectReference[];
  currentRowKey: string;
  projectJobNo: string | null;
  selectedForemanId: string | null;
  savedRowKey: (projectJobNo: string) => string;
}): ForemanOption[] {
  const draftAssignments = drafts
    .filter(
      (row) =>
        row.rowKey !== currentRowKey &&
        row.foremanEmployeeId !== null,
    )
    .map((row) => ({
      employeeId: row.foremanEmployeeId as string,
      rowKey: row.rowKey,
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
