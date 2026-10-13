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
  labourEmployeeIds: string[];
  driverEmployeeId?: string | null;
};

export type ProjectReference = {
  jobNo: string;
};

function roleLabel(role: "FOREMAN" | "LABOUR" | "DRIVER") {
  return role === "FOREMAN"
    ? "Foreman"
    : role === "DRIVER"
      ? "Driver"
      : "Labour";
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
  return resources
    .filter(
      (resource) =>
        resource.designation.toLowerCase().includes("foreman") ||
        resource.employeeId === selectedForemanId,
    )
    .map((resource) => {
      const selected = resource.employeeId === selectedForemanId;
      const currentDraft = drafts.find(
        (row) => row.rowKey === currentRowKey,
      );
      const currentLabourBlock = currentDraft?.labourEmployeeIds.includes(
        resource.employeeId,
      );
      const currentDriverBlock =
        currentDraft?.driverEmployeeId === resource.employeeId;

      const databaseBlocker = resource.assignments.find(
        (assignment) =>
          assignment.projectJobNo !== projectJobNo ||
          assignment.role !== "FOREMAN",
      );

      const draftBlocker = drafts
        .filter((row) => row.rowKey !== currentRowKey)
        .map((row) => {
          if (row.foremanEmployeeId === resource.employeeId) {
            return {
              role: "FOREMAN" as const,
              rowKey: row.rowKey,
              projectJobNo: row.projectJobNo,
            };
          }

          if (row.labourEmployeeIds.includes(resource.employeeId)) {
            return {
              role: "LABOUR" as const,
              rowKey: row.rowKey,
              projectJobNo: row.projectJobNo,
            };
          }

          if (row.driverEmployeeId === resource.employeeId) {
            return {
              role: "DRIVER" as const,
              rowKey: row.rowKey,
              projectJobNo: row.projectJobNo,
            };
          }

          return null;
        })
        .find((assignment) => assignment !== null);

      const available =
        selected ||
        (!currentLabourBlock &&
          !currentDriverBlock &&
          !databaseBlocker &&
          !draftBlocker &&
          Boolean(projectJobNo));

      let statusLabel: string | undefined;
      let assignmentRowKey: string | undefined;

      if (selected) {
        statusLabel = "Selected";
      } else if (currentLabourBlock) {
        statusLabel = "Labour on this project";
      } else if (currentDriverBlock) {
        statusLabel = "Driver on this project";
      } else if (draftBlocker) {
        const project = projects.find(
          (item) => item.jobNo === draftBlocker.projectJobNo,
        );
        statusLabel = `${roleLabel(draftBlocker.role)} → ${project?.jobNo ?? "Draft"}`;
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
