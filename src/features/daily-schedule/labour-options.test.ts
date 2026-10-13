import { describe, expect, it } from "vitest";

import { buildLabourOptions } from "@/features/daily-schedule/labour-options";

const resources = [
  { employeeId: "L-1", employeeName: "Available Labour", designation: "Electrician", mobileNumber: null, assignments: [] },
  { employeeId: "L-2", employeeName: "Current Labour", designation: "Helper", mobileNumber: null, assignments: [{ role: "LABOUR" as const, projectJobNo: "JOB-1", projectName: "Project One" }] },
  { employeeId: "L-3", employeeName: "Other Labour", designation: "Helper", mobileNumber: null, assignments: [{ role: "LABOUR" as const, projectJobNo: "JOB-2", projectName: "Project Two" }] },
  { employeeId: "F-1", employeeName: "Foreman", designation: "Foreman", mobileNumber: null, assignments: [{ role: "FOREMAN" as const, projectJobNo: "JOB-1", projectName: "Project One" }] },
  { employeeId: "F-2", employeeName: "Other Foreman", designation: "Foreman", mobileNumber: null, assignments: [{ role: "FOREMAN" as const, projectJobNo: "JOB-2", projectName: "Project Two" }] },
];

function options() {
  return buildLabourOptions({
    resources,
    drafts: [],
    currentRowKey: "saved:JOB-1",
    projectJobNo: "JOB-1",
    selectedLabourIds: ["L-2"],
    currentForemanId: "F-1",
    currentDriverId: null,
    savedRowKey: (jobNo) => `saved:${jobNo}`,
  });
}

describe("labour availability", () => {
  it("allows an unassigned employee", () => {
    expect(options().find((item) => item.employeeId === "L-1")?.available).toBe(true);
  });

  it("keeps current-project labour selected", () => {
    const current = options().find((item) => item.employeeId === "L-2");
    expect(current?.selected).toBe(true);
    expect(current?.available).toBe(true);
  });

  it("marks labour from another project as reassignable", () => {
    const assigned = options().find((item) => item.employeeId === "L-3");
    expect(assigned?.available).toBe(false);
    expect(assigned?.canReassign).toBe(true);
    expect(assigned?.assignmentRowKey).toBe("saved:JOB-2");
  });

  it("allows the current foreman to also work as labour", () => {
    const foreman = options().find((item) => item.employeeId === "F-1");
    expect(foreman?.available).toBe(true);
    expect(foreman?.statusLabel).toBe("Foreman here · can also work as labour");
  });

  it("keeps a dual-role foreman selected as labour", () => {
    const dualRole = buildLabourOptions({
      resources,
      drafts: [],
      currentRowKey: "saved:JOB-1",
      projectJobNo: "JOB-1",
      selectedLabourIds: ["F-1"],
      currentForemanId: "F-1",
      currentDriverId: null,
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    }).find((item) => item.employeeId === "F-1");

    expect(dualRole?.selected).toBe(true);
    expect(dualRole?.statusLabel).toBe("Foreman + labour here");
  });

  it("blocks a foreman already assigned on another project", () => {
    const foreman = options().find((item) => item.employeeId === "F-2");
    expect(foreman?.available).toBe(false);
    expect(foreman?.statusLabel).toBe("Foreman → JOB-2");
  });

  it("allows same-project dual-role assignment for draft schedules", () => {
    const draft = buildLabourOptions({
      resources: [{ ...resources[3], assignments: [] }],
      drafts: [{
        rowKey: "draft-1", projectJobNo: "JOB-1",
        foremanEmployeeId: "F-1", labourEmployeeIds: [],
      }],
      currentRowKey: "draft-1",
      projectJobNo: "JOB-1",
      selectedLabourIds: [],
      currentForemanId: "F-1",
      currentDriverId: null,
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });
    expect(draft[0].available).toBe(true);
  });

  it("blocks a driver selected by another draft row", () => {
    const result = buildLabourOptions({
      resources,
      drafts: [{
        rowKey: "draft-2",
        projectJobNo: "JOB-2",
        foremanEmployeeId: null,
        labourEmployeeIds: [],
        driverEmployeeId: "L-1",
      }],
      currentRowKey: "draft-1",
      projectJobNo: "JOB-1",
      selectedLabourIds: [],
      currentForemanId: null,
      currentDriverId: null,
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    const blocked = result.find((item) => item.employeeId === "L-1");
    expect(blocked?.available).toBe(false);
    expect(blocked?.statusLabel).toBe("Driver → JOB-2");
  });

  it("blocks employees selected by another draft row", () => {
    const result = buildLabourOptions({
      resources,
      drafts: [{ rowKey: "draft-2", projectJobNo: "JOB-2", foremanEmployeeId: null, labourEmployeeIds: ["L-1"] }],
      currentRowKey: "draft-1",
      projectJobNo: "JOB-1",
      selectedLabourIds: [],
      currentForemanId: null,
      currentDriverId: null,
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    const blocked = result.find((item) => item.employeeId === "L-1");
    expect(blocked?.available).toBe(false);
    expect(blocked?.statusLabel).toBe("Labour → JOB-2");
    expect(blocked?.assignmentRowKey).toBe("draft-2");
  });
});
