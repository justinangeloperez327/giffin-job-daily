/**
 * Project Job No is the database primary key, but SO No is also required
 * to identify an existing project during an Excel import. Never silently
 * change the sales order of a project with a matching job number.
 */
export type ImportedProjectIdentity = {
  rowNumber: number;
  data: {
    jobNo: string;
    soNo: string;
  };
};

export type ExistingProjectIdentity = {
  jobNo: string;
  soNo: string;
};

export type ProjectMatchIssue = {
  rowNumber: number;
  message: string;
};

export function matchImportedProjects(
  rows: readonly ImportedProjectIdentity[],
  existing: readonly ExistingProjectIdentity[],
): {
  matchedJobNos: Set<string>;
  issues: ProjectMatchIssue[];
} {
  const existingByJobNo = new Map(existing.map((project) => [
    project.jobNo,
    project.soNo,
  ]));
  const matchedJobNos = new Set<string>();
  const issues: ProjectMatchIssue[] = [];

  for (const row of rows) {
    const existingSoNo = existingByJobNo.get(row.data.jobNo);

    if (existingSoNo === undefined) {
      // A different project can legitimately share the same SO No.
      continue;
    }

    if (existingSoNo !== row.data.soNo) {
      issues.push({
        rowNumber: row.rowNumber,
        message: `Job No "${row.data.jobNo}" already belongs to SO No "${existingSoNo}", but the workbook contains SO No "${row.data.soNo}". Correct the row or edit the project separately.`,
      });
      continue;
    }

    matchedJobNos.add(row.data.jobNo);
  }

  return { matchedJobNos, issues };
}
