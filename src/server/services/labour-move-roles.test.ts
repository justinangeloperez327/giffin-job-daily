import { describe, expect, it } from "vitest";

import { getLabourMoveRoleConflict } from "@/server/services/labour-move-roles";

const roles = {
  employeeId: "EMP-F1",
  sourceForemanEmployeeId: "EMP-F2",
  sourceDriverEmployeeId: null,
  targetDriverEmployeeId: null,
};

describe("dual-role labour moves", () => {
  it("allows an ordinary labour transfer", () => {
    expect(getLabourMoveRoleConflict(roles)).toBeNull();
  });

  it("prevents moving the labour role while the employee leads the source project", () => {
    expect(
      getLabourMoveRoleConflict({
        ...roles,
        sourceForemanEmployeeId: "EMP-F1",
      }),
    ).toContain("foreman or driver on the source project");
  });

  it("blocks separating a source driver from their project", () => {
    expect(
      getLabourMoveRoleConflict({
        ...roles,
        sourceDriverEmployeeId: "EMP-F1",
      }),
    ).not.toBeNull();
  });

  it("blocks labour role if the employee drives the destination project", () => {
    expect(
      getLabourMoveRoleConflict({
        ...roles,
        targetDriverEmployeeId: "EMP-F1",
      }),
    ).toContain("driver on the target project");
  });
});
