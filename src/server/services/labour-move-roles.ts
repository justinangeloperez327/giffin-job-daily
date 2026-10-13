/**
 * Designation is not an assignment: an unassigned foreman may work as labour.
 * Each employee may hold only one role on a given schedule date.
 */
export function getLabourMoveRoleConflict({
  employeeId,
  sourceForemanEmployeeId,
  sourceDriverEmployeeId,
  targetDriverEmployeeId,
  targetForemanEmployeeId,
}: {
  employeeId: string;
  sourceForemanEmployeeId: string;
  sourceDriverEmployeeId: string | null;
  targetDriverEmployeeId: string | null;
  targetForemanEmployeeId: string;
}): string | null {
  if (
    sourceForemanEmployeeId === employeeId ||
    sourceDriverEmployeeId === employeeId
  ) {
    return "The employee is also the foreman or driver on the source project. Change that role before moving their labour assignment.";
  }

  if (
    targetForemanEmployeeId === employeeId ||
    targetDriverEmployeeId === employeeId
  ) {
    return "The employee already has a foreman or driver assignment on the target project.";
  }

  return null;
}
