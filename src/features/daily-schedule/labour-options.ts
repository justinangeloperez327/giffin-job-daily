export type LabourRole = "FOREMAN" | "LABOUR" | "DRIVER";

export type LabourOption = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
  available: boolean;
  selected: boolean;
  statusLabel?: string;
  assignmentRowKey?: string;
  assignmentRole?: LabourRole;
  canReassign: boolean;
};

export type LabourResourceInput = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
  assignments: Array<{
    role: LabourRole;
    projectJobNo: string;
    projectName: string;
  }>;
};

export type DraftLabourAssignment = {
  rowKey: string;
  projectJobNo: string | null;
  foremanEmployeeId: string | null;
  labourEmployeeIds: string[];
  driverEmployeeId?: string | null;
};

function roleLabel(role: LabourRole) {
  return role === "FOREMAN" ? "Foreman" : role === "DRIVER" ? "Driver" : "Labour";
}

export function buildLabourOptions({
  resources,
  drafts,
  currentRowKey,
  projectJobNo,
  selectedLabourIds,
  currentForemanId,
  currentDriverId,
  savedRowKey,
}: {
  resources: LabourResourceInput[];
  drafts: DraftLabourAssignment[];
  currentRowKey: string;
  projectJobNo: string | null;
  selectedLabourIds: string[];
  currentForemanId: string | null;
  currentDriverId: string | null;
  savedRowKey: (projectJobNo: string) => string;
}): LabourOption[] {
  const selectedSet = new Set(selectedLabourIds);

  return resources.map((resource) => {
    const selected = selectedSet.has(resource.employeeId);
    const currentRole =
      resource.employeeId === currentForemanId
        ? ("FOREMAN" as const)
        : resource.employeeId === currentDriverId
          ? ("DRIVER" as const)
          : null;

    const databaseBlocker = resource.assignments.find((assignment) => {
      if (
        selected &&
        assignment.projectJobNo === projectJobNo &&
        assignment.role === "LABOUR"
      ) {
        return false;
      }

      return true;
    });

    const draftBlocker = drafts
      .filter((draft) => draft.rowKey !== currentRowKey)
      .map((draft) => {
        if (draft.foremanEmployeeId === resource.employeeId) {
          return {
            role: "FOREMAN" as const,
            rowKey: draft.rowKey,
            projectJobNo: draft.projectJobNo,
          };
        }

        if (draft.labourEmployeeIds.includes(resource.employeeId)) {
          return {
            role: "LABOUR" as const,
            rowKey: draft.rowKey,
            projectJobNo: draft.projectJobNo,
          };
        }

        if (draft.driverEmployeeId === resource.employeeId) {
          return {
            role: "DRIVER" as const,
            rowKey: draft.rowKey,
            projectJobNo: draft.projectJobNo,
          };
        }

        return null;
      })
      .find((assignment) => assignment !== null);

    const available =
      selected ||
      (Boolean(projectJobNo) &&
        !currentRole &&
        !databaseBlocker &&
        !draftBlocker);

    let statusLabel: string | undefined;
    let assignmentRowKey: string | undefined;
    let assignmentRole: LabourRole | undefined;
    let canReassign = false;

    if (selected) {
      statusLabel = "Assigned here";
      assignmentRole = "LABOUR";
    } else if (currentRole) {
      statusLabel = `${roleLabel(currentRole)} on this project`;
      assignmentRole = currentRole;
    } else if (draftBlocker) {
      statusLabel = `${roleLabel(draftBlocker.role)} → ${draftBlocker.projectJobNo ?? "Draft"}`;
      assignmentRowKey = draftBlocker.rowKey;
      assignmentRole = draftBlocker.role;
    } else if (databaseBlocker) {
      statusLabel = `${roleLabel(databaseBlocker.role)} → ${databaseBlocker.projectJobNo}`;
      assignmentRowKey = savedRowKey(databaseBlocker.projectJobNo);
      assignmentRole = databaseBlocker.role;
      canReassign =
        databaseBlocker.role === "LABOUR" &&
        databaseBlocker.projectJobNo !== projectJobNo;
    } else if (projectJobNo) {
      statusLabel = "Available";
    }

    return {
      employeeId: resource.employeeId,
      employeeName: resource.employeeName,
      designation: resource.designation,
      mobileNumber: resource.mobileNumber,
      available,
      selected,
      statusLabel,
      assignmentRowKey,
      assignmentRole,
      canReassign,
    };
  });
}
