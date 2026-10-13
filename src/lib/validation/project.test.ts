import { describe, expect, it } from "vitest";

import { projectInputSchema } from "@/lib/validation/project";

describe("project validation", () => {
  it("trims valid project values", () => {
    const project = projectInputSchema.parse({
      projectName: "  Tower Project  ",
      customerName: "  Aldar  ",
      jobNo: " JOB-001 ",
      soNo: " SO-1001 ",
    });

    expect(project).toEqual({
      projectName: "Tower Project",
      customerName: "Aldar",
      jobNo: "JOB-001",
      soNo: "SO-1001",
    });
  });

  it("accepts and trims optional category and sub-category fields", () => {
    const parsed = projectInputSchema.parse({
      projectName: "Tower Project",
      customerName: "Aldar",
      jobNo: "JOB-001",
      soNo: "SO-1001",
      category: "  Construction  ",
      subCategory: "  Fit-out  ",
    });

    expect(parsed.category).toBe("Construction");
    expect(parsed.subCategory).toBe("Fit-out");
  });

  it("accepts legacy projects without classification", () => {
    const parsed = projectInputSchema.parse({
      projectName: "Tower Project",
      customerName: "Aldar",
      jobNo: "JOB-001",
      soNo: "SO-1001",
    });

    expect(parsed.category).toBeUndefined();
    expect(parsed.subCategory).toBeUndefined();
  });

  it("converts blank classification fields to missing values", () => {
    const parsed = projectInputSchema.parse({
      projectName: "Tower Project",
      customerName: "Aldar",
      jobNo: "JOB-001",
      soNo: "SO-1001",
      category: "   ",
      subCategory: "",
    });

    expect(parsed.category).toBeUndefined();
    expect(parsed.subCategory).toBeUndefined();
  });

  it("rejects overlong category and sub-category values", () => {
    const parsed = projectInputSchema.safeParse({
      projectName: "Tower Project",
      customerName: "Aldar",
      jobNo: "JOB-001",
      soNo: "SO-1001",
      category: "a".repeat(101),
      subCategory: "b".repeat(101),
    });
    expect(parsed.success).toBe(false);
  });

  it("requires all project fields", () => {
    expect(
      projectInputSchema.safeParse({
        projectName: "",
        customerName: "",
        jobNo: "",
        soNo: "",
      }).success,
    ).toBe(false);
  });
});
