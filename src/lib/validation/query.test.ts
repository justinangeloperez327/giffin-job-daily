import { describe, expect, it } from "vitest";

import {
  labourListQuerySchema,
  projectListQuerySchema,
  resourceAvailabilityQuerySchema,
} from "@/lib/validation/query";

describe("list query validation", () => {
  it("applies project list defaults", () => {
    const result = projectListQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
    expect(result.sort).toBe("projectName");
    expect(result.order).toBe("asc");
  });

  it("coerces URL-style pagination values", () => {
    const result = labourListQuerySchema.parse({
      page: "3",
      pageSize: "50",
    });

    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("rejects oversized page sizes", () => {
    expect(
      projectListQuerySchema.safeParse({ pageSize: 101 }).success,
    ).toBe(false);
  });

  it("rejects unsupported project sort fields", () => {
    expect(
      projectListQuerySchema.safeParse({ sort: "createdAt" }).success,
    ).toBe(false);
  });

  it("normalizes blank optional filters", () => {
    const result = labourListQuerySchema.parse({
      search: "   ",
      designation: "",
    });

    expect(result.search).toBeUndefined();
    expect(result.designation).toBeUndefined();
  });
});

describe("resource availability query validation", () => {
  it("defaults resource pool size and preserves edit context", () => {
    const result = resourceAvailabilityQuerySchema.parse({
      scheduleDate: "2026-10-06",
      currentProjectJobNo: "JOB-001",
    });

    expect(result.take).toBe(1000);
    expect(result.currentProjectJobNo).toBe("JOB-001");
  });
});
