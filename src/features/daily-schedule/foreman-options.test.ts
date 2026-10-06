import { describe, expect, it } from "vitest";

import { buildForemanOptions } from "@/features/daily-schedule/foreman-options";

const resources = [
  { employeeId: "F-1", employeeName: "Current Foreman", designation: "Foreman", assignments: [{ role: "FOREMAN" as const, projectJobNo: "JOB-1", projectName: "Project One" }] },
  { employeeId: "F-2", employeeName: "Available Foreman", designation: "General Foreman", assignments: [] },
  { employeeId: "F-3", employeeName: "Other Project Foreman", designation: "Foreman", assignments: [{ role: "FOREMAN" as const, projectJobNo: "JOB-2", projectName: "Project Two" }] },
  { employeeId: "F-4", employeeName: "Same Project Labour", designation: "Foreman", assignments: [{ role: "LABOUR" as const, projectJobNo: "JOB-1", projectName: "Project One" }] },
  { employeeId: "X-1", employeeName: "Legacy Supervisor", designation: "Supervisor", assignments: [] },
];

function options(selectedForemanId: string | null = "F-1") {
  return buildForemanOptions({
    resources,
    drafts: [],
    projects: [{ jobNo: "JOB-1" }, { jobNo: "JOB-2" }],
    currentRowKey: "saved:JOB-1",
    projectJobNo: "JOB-1",
    selectedForemanId,
    savedRowKey: (jobNo) => `saved:${jobNo}`,
  });
}

describe("foreman availability", () => {
  it("keeps the current foreman selectable", () => {
    const current = options().find((item) => item.employeeId === "F-1");
    expect(current?.available).toBe(true);
    expect(current?.selected).toBe(true);
  });

  it("allows an unassigned foreman", () => {
    expect(options().find((item) => item.employeeId === "F-2")?.available).toBe(true);
  });

  it("blocks another-project foreman", () => {
    const blocked = options().find((item) => item.employeeId === "F-3");
    expect(blocked?.available).toBe(false);
    expect(blocked?.assignmentRowKey).toBe("saved:JOB-2");
  });

  it("blocks same-project labour", () => {
    expect(options().find((item) => item.employeeId === "F-4")?.available).toBe(false);
  });

  it("keeps a selected legacy designation visible", () => {
    expect(options("X-1").find((item) => item.employeeId === "X-1")?.selected).toBe(true);
  });

  it("blocks labour on the current draft", () => {
    const result = buildForemanOptions({
      resources,
      drafts: [{ rowKey: "draft-1", projectJobNo: "JOB-1", foremanEmployeeId: null, labourEmployeeIds: ["F-2"] }],
      projects: [{ jobNo: "JOB-1" }],
      currentRowKey: "draft-1",
      projectJobNo: "JOB-1",
      selectedForemanId: null,
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    const blocked = result.find((item) => item.employeeId === "F-2");
    expect(blocked?.available).toBe(false);
    expect(blocked?.statusLabel).toBe("Labour on this project");
  });
});
