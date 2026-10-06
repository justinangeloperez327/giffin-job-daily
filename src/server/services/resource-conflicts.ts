export type ScheduleConflictSource = {
  projectJobNo: string;
  foremanEmployeeId: string;
  driverEmployeeId: string | null;
  labours: Array<{
    employeeId: string;
  }>;
};

export type ResourceConflict = {
  employeeId: string;
  role: "FOREMAN" | "DRIVER" | "LABOUR";
  projectJobNo: string;
  message: string;
};

export function buildResourceConflictMap(
  schedules: ScheduleConflictSource[],
): Map<string, ResourceConflict> {
  const conflicts = new Map<string, ResourceConflict>();

  for (const schedule of schedules) {
    conflicts.set(schedule.foremanEmployeeId, {
      employeeId: schedule.foremanEmployeeId,
      role: "FOREMAN",
      projectJobNo: schedule.projectJobNo,
      message: `already assigned as foreman to ${schedule.projectJobNo}`,
    });

    if (schedule.driverEmployeeId) {
      conflicts.set(schedule.driverEmployeeId, {
        employeeId: schedule.driverEmployeeId,
        role: "DRIVER",
        projectJobNo: schedule.projectJobNo,
        message: `already assigned as driver to ${schedule.projectJobNo}`,
      });
    }

    for (const assignment of schedule.labours) {
      conflicts.set(assignment.employeeId, {
        employeeId: assignment.employeeId,
        role: "LABOUR",
        projectJobNo: schedule.projectJobNo,
        message: `already assigned as labour to ${schedule.projectJobNo}`,
      });
    }
  }

  return conflicts;
}

export function findFirstResourceConflict(
  employeeIds: string[],
  conflicts: Map<string, ResourceConflict>,
): ResourceConflict | null {
  for (const employeeId of employeeIds) {
    const conflict = conflicts.get(employeeId);

    if (conflict) {
      return conflict;
    }
  }

  return null;
}
