"use server";

import { revalidatePath } from "next/cache";

import { authorizeAction } from "@/server/auth/session";
import {
  createLabour,
  deleteLabour,
  updateLabour,
} from "@/server/services/labours";

function labourInputFromForm(formData: FormData) {
  return {
    employeeId: formData.get("employeeId"),
    employeeName: formData.get("employeeName"),
    designation: formData.get("designation"),
    mobileNumber: formData.get("mobileNumber"),
  };
}

function labourDetailPath(employeeId: string) {
  return `/labours/${encodeURIComponent(employeeId)}`;
}

export async function createLabourAction(formData: FormData) {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);
  if (!auth.ok) return auth;

  const result = await createLabour(labourInputFromForm(formData));

  if (result.ok) {
    revalidatePath("/labours");
  }

  return result;
}

export async function updateLabourAction(
  originalEmployeeId: string,
  formData: FormData,
) {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);
  if (!auth.ok) return auth;

  const result = await updateLabour(
    originalEmployeeId,
    labourInputFromForm(formData),
  );

  if (result.ok) {
    revalidatePath("/labours");
    revalidatePath(labourDetailPath(originalEmployeeId));
    revalidatePath(labourDetailPath(result.data.employeeId));
    revalidatePath("/daily-schedule");
  }

  return result;
}

export async function deleteLabourAction(employeeId: string) {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);
  if (!auth.ok) return auth;

  const result = await deleteLabour(employeeId);

  if (result.ok) {
    revalidatePath("/labours");
    revalidatePath(labourDetailPath(employeeId));
    revalidatePath("/daily-schedule");
  }

  return result;
}
