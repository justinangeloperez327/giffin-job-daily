"use server";

import { revalidatePath } from "next/cache";

import {
  actionFailure,
  type ActionResult,
} from "@/lib/action-result";
import { authorizeAction } from "@/server/auth/session";
import {
  importLaboursWorkbook,
  importProjectsWorkbook,
  type ExcelImportSummary,
} from "@/server/services/import-master-data";

function workbookFromFormData(
  formData: FormData,
): ActionResult<File> {
  const value = formData.get("file");

  if (!(value instanceof File)) {
    return actionFailure({
      code: "VALIDATION",
      message: "Choose an Excel workbook to import.",
      fieldErrors: {
        file: ["Select a .xlsx file."],
      },
    });
  }

  return {
    ok: true,
    data: value,
  };
}

export async function importProjectsExcelAction(
  formData: FormData,
): Promise<ActionResult<ExcelImportSummary>> {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);

  if (!auth.ok) {
    return auth;
  }

  const file = workbookFromFormData(formData);

  if (!file.ok) {
    return file;
  }

  const result = await importProjectsWorkbook(file.data);

  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath("/daily-schedule");
    revalidatePath("/");
  }

  return result;
}

export async function importLaboursExcelAction(
  formData: FormData,
): Promise<ActionResult<ExcelImportSummary>> {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);

  if (!auth.ok) {
    return auth;
  }

  const file = workbookFromFormData(formData);

  if (!file.ok) {
    return file;
  }

  const result = await importLaboursWorkbook(file.data);

  if (result.ok) {
    revalidatePath("/labours");
    revalidatePath("/daily-schedule");
    revalidatePath("/");
  }

  return result;
}
