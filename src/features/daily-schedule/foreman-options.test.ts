import { describe, expect, it } from "vitest";

import { buildForemanOptions } from "@/features/daily-schedule/foreman-options";

const resources = [
  {
    employeeId: "F-1",
    employeeName: "Current Foreman",
    designation: "Foreman",
    assignments: [
      {
        role: "FOREMAN" as const,
        projectJobNo: "JOB-1",
        projectName: "Project One",
      },
    ],
  },
  {
    employeeId: "F-2",
    employeeName: "Available Foreman",
    designation: "General Foreman",
    assignments: [],
  },
  {
    employeeId: "F-3",
    employeeName: "Other Project Foreman",
    designation: "Foreman",
    assignments: [
      {
        role: "FOREMAN" as const,
        projectJobNo: "JOB-2",
        projectName: "Project Two",
      },
    ],
  },
  {
    employeeId: "F-4",
    employeeName: "Same Project Labour",
    designation: "Foreman",
    assignments: [
      {
        role: "LABOUR" as const,
        projectJobNo: "JOB-1",
        projectName: "Project One",
      },
    ],
  },
  {
    employeeId: "X-1",
    employeeName: "Legacy Supervisor",
    designation: "Supervisor",
    assignments: [],
  },
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
    const current = options().find((option) => option.employeeId === "F-1");

    expect(current?.available).toBe(true);
    expect(current?.selected).toBe(true);
  });

  it("allows an unassigned foreman", () => {
    expect(
      options().find((option) => option.employeeId === "F-2")?.available,
    ).toBe(true);
  });

  it("blocks a foreman assigned to another project", () => {
    const blocked = options().find((option) => option.employeeId === "F-3");

    expect(blocked?.available).toBe(false);
    expect(blocked?.statusLabel).toBe("Foreman → JOB-2");
    expect(blocked?.assignmentRowKey).toBe("saved:JOB-2");
  });

  it("blocks an employee already used as labour on the same project", () => {
    const blocked = options().find((option) => option.employeeId === "F-4");

    expect(blocked?.available).toBe(false);
    expect(blocked?.statusLabel).toBe("Labour → JOB-1");
  });

  it("keeps a selected legacy designation visible", () => {
    const legacy = options("X-1").find(
      (option) => option.employeeId === "X-1",
    );

    expect(legacy?.selected).toBe(true);
    expect(legacy?.available).toBe(true);
  });

  it("blocks a foreman already chosen by another draft", () => {
    const result = buildForemanOptions({
      resources,
      drafts: [
        {
          rowKey: "draft-2",
          projectJobNo: "JOB-2",
          foremanEmployeeId: "F-2",
        },
      ],
      projects: [{ jobNo: "JOB-1" }, { jobNo: "JOB-2" }],
      currentRowKey: "draft-1",
      projectJobNo: "JOB-1",
      selectedForemanId: null,
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    const blocked = result.find((option) => option.employeeId === "F-2");

    expect(blocked?.available).toBe(false);
    expect(blocked?.statusLabel).toBe("Assigned → JOB-2");
    expect(blocked?.assignmentRowKey).toBe("draft-2");
  });
});
