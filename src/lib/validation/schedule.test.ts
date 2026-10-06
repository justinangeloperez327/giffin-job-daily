import { describe, expect, it } from "vitest";

import {\n  dailyScheduleInputSchema,\n  labourReassignmentSchema,\n} from "@/lib/validation/schedule";

const validSchedule = {
  scheduleDate: "2026-10-06",
  projectJobNo: "JOB-001",
  foremanEmployeeId: "EMP-F1",
  campStartTime: "05:00",
  startTime: "07:00",
  endTime: "17:00",
  dailyTarget: "Complete planned work.",
  driverEmployeeId: "EMP-D1",
  equipmentVehicle: "Bus 01",
  labourEmployeeIds: ["EMP-L1", "EMP-L2"],
};

describe("daily schedule validation", () => {
  it("accepts a valid schedule", () => {
    expect(dailyScheduleInputSchema.safeParse(validSchedule).success).toBe(true);
  });

  it("rejects duplicate labour assignments", () => {
    const result = dailyScheduleInputSchema.safeParse({
      ...validSchedule,
      labourEmployeeIds: ["EMP-L1", "EMP-L1"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a foreman also assigned as labour", () => {
    const result = dailyScheduleInputSchema.safeParse({
      ...validSchedule,
      labourEmployeeIds: ["EMP-F1"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a driver also assigned as labour", () => {
    const result = dailyScheduleInputSchema.safeParse({
      ...validSchedule,
      labourEmployeeIds: ["EMP-D1"],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a foreman also assigned as driver", () => {
    const result = dailyScheduleInputSchema.safeParse({
      ...validSchedule,
      driverEmployeeId: "EMP-F1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects camp start after work start", () => {
    const result = dailyScheduleInputSchema.safeParse({
      ...validSchedule,
      campStartTime: "08:00",
      startTime: "07:00",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an end time that is not later than start time", () => {
    const result = dailyScheduleInputSchema.safeParse({
      ...validSchedule,
      startTime: "17:00",
      endTime: "17:00",
    });

    expect(result.success).toBe(false);
  });
});


describe("labour reassignment validation", () => {
  it("accepts moving labour between different projects", () => {
    expect(
      labourReassignmentSchema.safeParse({
        scheduleDate: "2026-10-06",
        employeeId: "EMP-L1",
        fromProjectJobNo: "JOB-001",
        toProjectJobNo: "JOB-002",
      }).success,
    ).toBe(true);
  });

  it("rejects reassignment to the same project", () => {
    expect(
      labourReassignmentSchema.safeParse({
        scheduleDate: "2026-10-06",
        employeeId: "EMP-L1",
        fromProjectJobNo: "JOB-001",
        toProjectJobNo: "JOB-001",
      }).success,
    ).toBe(false);
  });
});
