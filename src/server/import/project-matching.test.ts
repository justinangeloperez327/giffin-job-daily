import { describe, expect, it } from "vitest";

import { matchImportedProjects } from "@/server/import/project-matching";

describe("project import matching", () => {
  const existing = [
    { jobNo: "JOB-001", soNo: "SO-100" },
    { jobNo: "JOB-002", soNo: "SO-200" },
  ];

  it("updates an existing project only when Job No and SO No both match", () => {
    const result = matchImportedProjects(
      [{ rowNumber: 4, data: { jobNo: "JOB-001", soNo: "SO-100" } }],
      existing,
    );
    expect(result.issues).toEqual([]);
    expect([...result.matchedJobNos]).toEqual(["JOB-001"]);
  });

  it("creates new projects even when they share an existing SO No", () => {
    const result = matchImportedProjects(
      [{ rowNumber: 5, data: { jobNo: "JOB-NEW", soNo: "SO-100" } }],
      existing,
    );
    expect(result.issues).toEqual([]);
    expect(result.matchedJobNos.size).toBe(0);
  });

  it("does not overwrite a project with the same Job No but a different SO No", () => {
    const result = matchImportedProjects(
      [{ rowNumber: 8, data: { jobNo: "JOB-001", soNo: "SO-WRONG" } }],
      existing,
    );
    expect(result.matchedJobNos.size).toBe(0);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].rowNumber).toBe(8);
    expect(result.issues[0].message).toContain('SO No "SO-100"');
    expect(result.issues[0].message).toContain('SO No "SO-WRONG"');
  });

  it("identifies each conflicting workbook row before applying changes", () => {
    const result = matchImportedProjects(
      [
        { rowNumber: 3, data: { jobNo: "JOB-001", soNo: "SO-X" } },
        { rowNumber: 6, data: { jobNo: "JOB-002", soNo: "SO-Y" } },
      ],
      existing,
    );
    expect(result.issues.map((issue) => issue.rowNumber)).toEqual([3, 6]);
    expect(result.matchedJobNos.size).toBe(0);
  });
});
