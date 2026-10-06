import { describe, expect, it } from "vitest";

import { labourInputSchema } from "@/lib/validation/labour";

describe("labour validation", () => {
  it("trims valid employee values and normalizes blank mobile", () => {
    const labour = labourInputSchema.parse({
      employeeId: " EMP-001 ",
      employeeName: " Ahmed Ali ",
      designation: " Foreman ",
      mobileNumber: "   ",
    });

    expect(labour).toEqual({
      employeeId: "EMP-001",
      employeeName: "Ahmed Ali",
      designation: "Foreman",
      mobileNumber: undefined,
    });
  });

  it("requires employee ID, name, and designation", () => {
    expect(
      labourInputSchema.safeParse({
        employeeId: "",
        employeeName: "",
        designation: "",
      }).success,
    ).toBe(false);
  });
});
