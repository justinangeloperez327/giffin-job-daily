export type DriverRole = "FOREMAN" | "LABOUR" | "DRIVER";

export type DriverOption = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
  available: boolean;
  selected: boolean;
  statusLabel?: string;
  assignmentRowKey?: string;
};

export type DriverResourceInput = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
  assignments: Array<{
    role: DriverRole;
    projectJobNo: string;
    projectName: string;
  }>;
};

export type LocalDriverAssignment = {
  rowKey: string;
  projectJobNo: string | null;
  foremanEmployeeId: string | null;
  labourEmployeeIds: string[];
  driverEmployeeId: string | null;
};

function roleLabel(role: DriverRole) {
  return role === "FOREMAN" ? "Foreman" : role === "LABOUR" ? "Labour" : "Driver";
}

export function buildDriverOptions({
  resources,
  localRows,
  currentRowKey,
  projectJobNo,
  selectedDriverId,
  currentForemanId,
  currentLabourIds,
  savedRowKey,
}: {
  resources: DriverResourceInput[];
  localRows: LocalDriverAssignment[];
  currentRowKey: string;
  projectJobNo: string | null;
  selectedDriverId: string | null;
  currentForemanId: string | null;
  currentLabourIds: string[];
  savedRowKey: (projectJobNo: string) => string;
}): DriverOption[] {
  const currentLabourSet = new Set(currentLabourIds);

  return resources
    .filter(
      (resource) =>
        resource.designation.toLowerCase().includes("driver") ||
        resource.employeeId === selectedDriverId,
    )
    .map((resource) => {
      const selected = resource.employeeId === selectedDriverId;
      const currentRole =
        resource.employeeId === currentForemanId
          ? ("FOREMAN" as const)
          : currentLabourSet.has(resource.employeeId)
            ? ("LABOUR" as const)
            : null;

      const databaseBlocker = resource.assignments.find((assignment) => {
        if (
          selected &&
          assignment.projectJobNo === projectJobNo &&
          assignment.role === "DRIVER"
        ) {
          return false;
        }

        return true;
      });

      const localBlocker = localRows
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
        (Boolean(projectJobNo) &&
          !currentRole &&
          !databaseBlocker &&
          !localBlocker);

      let statusLabel: string | undefined;
      let assignmentRowKey: string | undefined;

      if (selected) {
        statusLabel = "Selected";
      } else if (currentRole) {
        statusLabel = `${roleLabel(currentRole)} on this project`;
      } else if (localBlocker) {
        statusLabel = `${roleLabel(localBlocker.role)} → ${localBlocker.projectJobNo ?? "Draft"}`;
        assignmentRowKey = localBlocker.rowKey;
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
        mobileNumber: resource.mobileNumber,
        available,
        selected,
        statusLabel,
        assignmentRowKey,
      };
    });
}
