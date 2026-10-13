/**
 * Employees can hold foreman and labour roles on the same project.
 * Moving a labour assignment must never split those roles across projects.
 */
export function getLabourMoveRoleConflict({
  employeeId,
  sourceForemanEmployeeId,
  sourceDriverEmployeeId,
  targetDriverEmployeeId,
}: {
  employeeId: string;
  sourceForemanEmployeeId: string;
  sourceDriverEmployeeId: string | null;
  targetDriverEmployeeId: string | null;
}): string | null {
  if (
    sourceForemanEmployeeId === employeeId ||
    sourceDriverEmployeeId === employeeId
  ) {
    return "The employee is also the foreman or driver on the source project. Change that role before moving their labour assignment.";
  }

  if (targetDriverEmployeeId === employeeId) {
    return "The employee is the driver on the target project.";
  }

  return null;
}
