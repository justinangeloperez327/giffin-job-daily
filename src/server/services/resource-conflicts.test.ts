import { describe, expect, it } from "vitest";

import {
  buildResourceConflictMap,
  findFirstResourceConflict,
} from "@/server/services/resource-conflicts";

describe("resource conflict evaluation", () => {
  const conflicts = buildResourceConflictMap([
    {
      projectJobNo: "JOB-001",
      foremanEmployeeId: "EMP-F1",
      driverEmployeeId: "EMP-D1",
      labours: [{ employeeId: "EMP-L1" }, { employeeId: "EMP-L2" }],
    },
  ]);

  it("tracks foreman, driver, and labour conflicts", () => {
    expect(conflicts.get("EMP-F1")?.role).toBe("FOREMAN");
    expect(conflicts.get("EMP-D1")?.role).toBe("DRIVER");
    expect(conflicts.get("EMP-L1")?.role).toBe("LABOUR");
  });

  it("returns the first conflicting requested employee", () => {
    const conflict = findFirstResourceConflict(
      ["EMP-X", "EMP-L2", "EMP-F1"],
      conflicts,
    );

    expect(conflict?.employeeId).toBe("EMP-L2");
    expect(conflict?.projectJobNo).toBe("JOB-001");
  });

  it("returns null when all requested employees are free", () => {
    expect(findFirstResourceConflict(["EMP-X", "EMP-Y"], conflicts)).toBeNull();
  });
});
