import { describe, expect, it } from "vitest";

import { buildDriverOptions } from "@/features/daily-schedule/driver-options";

const resources = [
  {
    employeeId: "D-1",
    employeeName: "Available Driver",
    designation: "Driver",
    mobileNumber: "0500000001",
    assignments: [],
  },
  {
    employeeId: "D-2",
    employeeName: "Current Driver",
    designation: "Driver",
    mobileNumber: "0500000002",
    assignments: [
      {
        role: "DRIVER" as const,
        projectJobNo: "JOB-1",
        projectName: "Project One",
      },
    ],
  },
  {
    employeeId: "D-3",
    employeeName: "Other Driver",
    designation: "Driver",
    mobileNumber: null,
    assignments: [
      {
        role: "DRIVER" as const,
        projectJobNo: "JOB-2",
        projectName: "Project Two",
      },
    ],
  },
  {
    employeeId: "F-1",
    employeeName: "Foreman Driver",
    designation: "Driver",
    mobileNumber: null,
    assignments: [
      {
        role: "FOREMAN" as const,
        projectJobNo: "JOB-1",
        projectName: "Project One",
      },
    ],
  },
];

describe("driver availability", () => {
  it("allows an unassigned driver", () => {
    const options = buildDriverOptions({
      resources,
      localRows: [],
      currentRowKey: "saved:JOB-1",
      projectJobNo: "JOB-1",
      selectedDriverId: "D-2",
      currentForemanId: "F-1",
      currentLabourIds: [],
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    expect(options.find((item) => item.employeeId === "D-1")?.available).toBe(true);
  });

  it("keeps the current driver selected", () => {
    const options = buildDriverOptions({
      resources,
      localRows: [],
      currentRowKey: "saved:JOB-1",
      projectJobNo: "JOB-1",
      selectedDriverId: "D-2",
      currentForemanId: "F-1",
      currentLabourIds: [],
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    const current = options.find((item) => item.employeeId === "D-2");
    expect(current?.selected).toBe(true);
    expect(current?.available).toBe(true);
  });

  it("blocks a driver assigned to another project", () => {
    const options = buildDriverOptions({
      resources,
      localRows: [],
      currentRowKey: "saved:JOB-1",
      projectJobNo: "JOB-1",
      selectedDriverId: null,
      currentForemanId: null,
      currentLabourIds: [],
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    const blocked = options.find((item) => item.employeeId === "D-3");
    expect(blocked?.available).toBe(false);
    expect(blocked?.assignmentRowKey).toBe("saved:JOB-2");
  });

  it("blocks the current project's foreman from being driver", () => {
    const options = buildDriverOptions({
      resources,
      localRows: [],
      currentRowKey: "saved:JOB-1",
      projectJobNo: "JOB-1",
      selectedDriverId: null,
      currentForemanId: "F-1",
      currentLabourIds: [],
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    expect(options.find((item) => item.employeeId === "F-1")?.available).toBe(false);
  });

  it("blocks a driver chosen by another local row", () => {
    const options = buildDriverOptions({
      resources,
      localRows: [
        {
          rowKey: "draft-2",
          projectJobNo: "JOB-2",
          foremanEmployeeId: null,
          labourEmployeeIds: [],
          driverEmployeeId: "D-1",
        },
      ],
      currentRowKey: "draft-1",
      projectJobNo: "JOB-1",
      selectedDriverId: null,
      currentForemanId: null,
      currentLabourIds: [],
      savedRowKey: (jobNo) => `saved:${jobNo}`,
    });

    const blocked = options.find((item) => item.employeeId === "D-1");
    expect(blocked?.available).toBe(false);
    expect(blocked?.assignmentRowKey).toBe("draft-2");
  });
});
