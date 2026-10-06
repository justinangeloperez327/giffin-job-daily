import { describe, expect, it } from "vitest";

import { projectInputSchema } from "@/lib/validation/project";

describe("project validation", () => {
  it("trims valid project values", () => {
    const project = projectInputSchema.parse({
      projectName: "  Tower Project  ",
      jobNo: " JOB-001 ",
      soNo: " SO-1001 ",
    });

    expect(project).toEqual({
      projectName: "Tower Project",
      jobNo: "JOB-001",
      soNo: "SO-1001",
    });
  });

  it("requires all project fields", () => {
    expect(
      projectInputSchema.safeParse({
        projectName: "",
        jobNo: "",
        soNo: "",
      }).success,
    ).toBe(false);
  });
});
