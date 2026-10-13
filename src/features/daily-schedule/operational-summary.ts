import { formatTimeValue, timeValueToMinutes } from "@/lib/date-time";

type SummaryRow = {
  projectJobNo: string;
  foremanEmployeeId: string;
  driverEmployeeId: string | null;
  startTime: Date | null;
  campStartTime: Date | null;
  endTime: Date | null;
  labours: Array<{ employeeId: string }>;
};

export function shiftFromTime(value: string | null): "Day" | "Night" | null {
  if (!value) return null;
  const minutes = timeValueToMinutes(value);
  return minutes >= 360 && minutes < 1080 ? "Day" : "Night";
}

export function summarizeOperations(schedules: SummaryRow[], totalEmployees: number) {
  // Keep every role assignment to detect an employee working twice,
  // even when the duplicate roles belong to the same project.
  const assignments = new Map<string, string[]>();
  const foremen = new Set<string>();
  const labours = new Set<string>();
  let dayCount = 0;
  let nightCount = 0;
  const issues: Array<{ projectJobNo: string; message: string }> = [];

  function record(employeeId: string, projectJobNo: string) {
    const projects = assignments.get(employeeId) ?? [];
    projects.push(projectJobNo);
    assignments.set(employeeId, projects);
  }

  for (const row of schedules) {
    foremen.add(row.foremanEmployeeId);
    record(row.foremanEmployeeId, row.projectJobNo);
    if (row.driverEmployeeId) record(row.driverEmployeeId, row.projectJobNo);
    for (const labour of row.labours) {
      labours.add(labour.employeeId);
      record(labour.employeeId, row.projectJobNo);
    }
    const shift = shiftFromTime(formatTimeValue(row.startTime));
    if (shift === "Day") dayCount++;
    if (shift === "Night") nightCount++;
    if (!row.startTime || !row.endTime) {
      issues.push({ projectJobNo: row.projectJobNo, message: "Work timing incomplete" });
    }
    if (row.labours.length === 0) {
      issues.push({ projectJobNo: row.projectJobNo, message: "No labours assigned" });
    }
  }

  for (const [employeeId, projects] of assignments) {
    if (projects.length > 1) {
      issues.push({
        projectJobNo: projects[0],
        message: `${employeeId} has multiple assignments: ${projects.join(", ")}`,
      });
    }
  }

  return {
    foremanCount: foremen.size,
    labourCount: labours.size,
    unassignedCount: Math.max(0, totalEmployees - assignments.size),
    dayCount,
    nightCount,
    issues,
  };
}
