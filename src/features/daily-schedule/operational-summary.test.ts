import { describe, expect, it } from "vitest";
import { shiftFromTime, summarizeOperations } from "./operational-summary";

const row = (projectJobNo: string, start: string | null, employeeId = "F1") => ({
  projectJobNo,
  foremanEmployeeId: employeeId,
  driverEmployeeId: null,
  startTime: start ? new Date(`1970-01-01T${start}:00Z`) : null,
  campStartTime: null,
  endTime: new Date("1970-01-01T17:00:00Z"),
  labours: [{ employeeId: "L1" }],
});

describe("operational summary", () => {
  it("uses the exact day/night boundaries without treating missing timing as night", () => {
    expect([null, "05:59", "06:00", "17:59", "18:00", "00:00"].map(shiftFromTime))
      .toEqual([null, "Night", "Day", "Day", "Night", "Night"]);
  });
  it("counts unique people and identifies duplicate assignments", () => {
    const summary = summarizeOperations([row("J1", "07:00"), row("J2", "19:00")], 10);
    expect(summary).toMatchObject({ foremanCount: 1, labourCount: 1, unassignedCount: 8, dayCount: 1, nightCount: 1 });
    expect(summary.issues).toHaveLength(2);
    expect(summary.issues.every((issue) => issue.message.includes("multiple project assignments"))).toBe(true);
  });
  it("does not flag a dual-role foreman as a duplicate and counts the person once", () => {
    const summary = summarizeOperations(
      [{ ...row("J1", "07:00"), labours: [{ employeeId: "F1" }, { employeeId: "L1" }] }],
      3,
    );
    expect(summary.foremanCount).toBe(1);
    expect(summary.labourCount).toBe(2);
    expect(summary.unassignedCount).toBe(1);
    expect(summary.issues).toEqual([]);
  });

  it("reports incomplete timing and missing labour without negative availability", () => {
    const summary = summarizeOperations([{ ...row("J1", null), labours: [] }], 0);
    expect(summary.unassignedCount).toBe(0);
    expect(summary.issues.map((issue) => issue.message)).toEqual(["Work timing incomplete", "No labours assigned"]);
  });
});
