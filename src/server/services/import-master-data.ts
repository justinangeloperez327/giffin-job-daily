import "server-only";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
} from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import { labourInputSchema } from "@/lib/validation/labour";
import { projectInputSchema } from "@/lib/validation/project";
import { mapDatabaseError } from "@/server/database/errors";
import { withSerializableTransaction } from "@/server/database/transaction";
import {
  parseExcelWorkbook,
  type ImportColumn,
  type ParsedExcelRow,
  WorkbookImportError,
} from "@/server/import/excel-workbook";

type ProjectColumn =
  | "projectName"
  | "jobNo"
  | "soNo";

type LabourColumn =
  | "employeeId"
  | "employeeName"
  | "designation"
  | "mobileNumber";

export type ExcelImportSummary = {
  sheetName: string;
  total: number;
  created: number;
  updated: number;
};

const projectColumns: readonly ImportColumn<ProjectColumn>[] = [
  {
    key: "projectName",
    label: "Project Name",
    required: true,
    aliases: ["project_name", "project", "projectname"],
  },
  {
    key: "jobNo",
    label: "Job No",
    required: true,
    aliases: ["job_no", "job number", "job_number", "jobno"],
  },
  {
    key: "soNo",
    label: "SO No",
    required: true,
    aliases: [
      "so_no",
      "so number",
      "so_number",
      "sono",
      "sales order",
      "sales_order",
      "sales order no",
    ],
  },
];

const labourColumns: readonly ImportColumn<LabourColumn>[] = [
  {
    key: "employeeId",
    label: "Employee ID",
    required: true,
    aliases: ["employee_id", "employee no", "employee_no", "emp id", "emp_id"],
  },
  {
    key: "employeeName",
    label: "Employee Name",
    required: true,
    aliases: ["employee_name", "name", "employee"],
  },
  {
    key: "designation",
    label: "Designation",
    required: true,
    aliases: ["job title", "job_title", "position", "trade"],
  },
  {
    key: "mobileNumber",
    label: "Mobile Number",
    required: false,
    aliases: [
      "mobile_number",
      "mobile",
      "phone",
      "phone number",
      "contact number",
      "contact_no",
    ],
  },
];

type ImportIssue = {
  rowNumber: number;
  message: string;
};

function importFailure<T = never>(
  message: string,
  issues: ImportIssue[] = [],
  fileErrors: Record<string, string[]> = {},
): ActionResult<T> {
  const fieldErrors: Record<string, string[]> = { ...fileErrors };

  for (const issue of issues.slice(0, 50)) {
    fieldErrors[`row_${issue.rowNumber}`] = [issue.message];
  }

  if (issues.length > 50) {
    fieldErrors.more = [
      `${issues.length - 50} additional row error(s) were omitted.`,
    ];
  }

  return actionFailure({
    code: "VALIDATION",
    message,
    fieldErrors,
  });
}

function validationMessages(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}) {
  return error.issues
    .map((issue) => {
      const field = issue.path[0];
      return typeof field === "string"
        ? `${field}: ${issue.message}`
        : issue.message;
    })
    .join(" ");
}

function duplicateIssues<Key extends string>(
  rows: readonly ParsedExcelRow<Key>[],
  keyFor: (row: ParsedExcelRow<Key>) => string,
  label: string,
) {
  const seen = new Map<string, number>();
  const issues: ImportIssue[] = [];

  for (const row of rows) {
    const key = keyFor(row);

    if (!key) {
      continue;
    }

    const normalized = key.trim().toLowerCase();
    const firstRow = seen.get(normalized);

    if (firstRow) {
      issues.push({
        rowNumber: row.rowNumber,
        message: `${label} "${key}" is duplicated in this workbook (first seen on row ${firstRow}).`,
      });
    } else {
      seen.set(normalized, row.rowNumber);
    }
  }

  return issues;
}

export async function importProjectsWorkbook(
  file: File,
): Promise<ActionResult<ExcelImportSummary>> {
  try {
    const workbook = await parseExcelWorkbook(file, projectColumns);
    const issues = duplicateIssues(
      workbook.rows,
      (row) => row.values.jobNo,
      "Job No",
    );
    const validRows: Array<{
      rowNumber: number;
      data: {
        projectName: string;
        jobNo: string;
        soNo: string;
      };
    }> = [];

    for (const row of workbook.rows) {
      const parsed = projectInputSchema.safeParse(row.values);

      if (!parsed.success) {
        issues.push({
          rowNumber: row.rowNumber,
          message: validationMessages(parsed.error),
        });
        continue;
      }

      validRows.push({
        rowNumber: row.rowNumber,
        data: parsed.data,
      });
    }

    if (issues.length > 0) {
      return importFailure(
        `Import stopped because ${issues.length} row error(s) were found. No projects were changed.`,
        issues,
      );
    }

    const jobNos = validRows.map((row) => row.data.jobNo);
    const existing = await prisma.project.findMany({
      where: {
        jobNo: {
          in: jobNos,
        },
      },
      select: {
        jobNo: true,
      },
    });
    const existingJobNos = new Set(existing.map((project) => project.jobNo));

    await withSerializableTransaction(
      async (transaction) => {
        for (const row of validRows) {
          await transaction.project.upsert({
            where: {
              jobNo: row.data.jobNo,
            },
            create: row.data,
            update: {
              projectName: row.data.projectName,
              soNo: row.data.soNo,
            },
          });
        }
      },
      {
        maxWait: 5000,
        timeout: 60000,
      },
    );

    const updated = validRows.filter((row) =>
      existingJobNos.has(row.data.jobNo),
    ).length;

    return actionSuccess({
      sheetName: workbook.sheetName,
      total: validRows.length,
      created: validRows.length - updated,
      updated,
    });
  } catch (error) {
    if (error instanceof WorkbookImportError) {
      return importFailure(error.message, [], error.fieldErrors);
    }

    return actionFailure(mapDatabaseError(error));
  }
}

export async function importLaboursWorkbook(
  file: File,
): Promise<ActionResult<ExcelImportSummary>> {
  try {
    const workbook = await parseExcelWorkbook(file, labourColumns);
    const issues = duplicateIssues(
      workbook.rows,
      (row) => row.values.employeeId,
      "Employee ID",
    );
    const validRows: Array<{
      rowNumber: number;
      data: {
        employeeId: string;
        employeeName: string;
        designation: string;
        mobileNumber: string | null;
      };
    }> = [];

    for (const row of workbook.rows) {
      const parsed = labourInputSchema.safeParse(row.values);

      if (!parsed.success) {
        issues.push({
          rowNumber: row.rowNumber,
          message: validationMessages(parsed.error),
        });
        continue;
      }

      validRows.push({
        rowNumber: row.rowNumber,
        data: {
          ...parsed.data,
          mobileNumber: parsed.data.mobileNumber ?? null,
        },
      });
    }

    if (issues.length > 0) {
      return importFailure(
        `Import stopped because ${issues.length} row error(s) were found. No labour records were changed.`,
        issues,
      );
    }

    const employeeIds = validRows.map((row) => row.data.employeeId);
    const existing = await prisma.labour.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
      },
      select: {
        employeeId: true,
      },
    });
    const existingEmployeeIds = new Set(
      existing.map((labour) => labour.employeeId),
    );

    await withSerializableTransaction(
      async (transaction) => {
        for (const row of validRows) {
          await transaction.labour.upsert({
            where: {
              employeeId: row.data.employeeId,
            },
            create: row.data,
            update: {
              employeeName: row.data.employeeName,
              designation: row.data.designation,
              mobileNumber: row.data.mobileNumber,
            },
          });
        }
      },
      {
        maxWait: 5000,
        timeout: 60000,
      },
    );

    const updated = validRows.filter((row) =>
      existingEmployeeIds.has(row.data.employeeId),
    ).length;

    return actionSuccess({
      sheetName: workbook.sheetName,
      total: validRows.length,
      created: validRows.length - updated,
      updated,
    });
  } catch (error) {
    if (error instanceof WorkbookImportError) {
      return importFailure(error.message, [], error.fieldErrors);
    }

    return actionFailure(mapDatabaseError(error));
  }
}
