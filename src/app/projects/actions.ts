"use server";

import { revalidatePath } from "next/cache";

import { authorizeAction } from "@/server/auth/session";
import {
  createProject,
  deleteProject,
  updateProject,
} from "@/server/services/projects";

function projectInputFromForm(formData: FormData) {
  return {
    projectName: formData.get("projectName"),
    jobNo: formData.get("jobNo"),
    soNo: formData.get("soNo"),
  };
}

function projectDetailPath(jobNo: string) {
  return `/projects/${encodeURIComponent(jobNo)}`;
}

export async function createProjectAction(formData: FormData) {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);
  if (!auth.ok) return auth;

  const result = await createProject(projectInputFromForm(formData));

  if (result.ok) {
    revalidatePath("/projects");
  }

  return result;
}

export async function updateProjectAction(
  originalJobNo: string,
  formData: FormData,
) {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);
  if (!auth.ok) return auth;

  const result = await updateProject(
    originalJobNo,
    projectInputFromForm(formData),
  );

  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath(projectDetailPath(originalJobNo));
    revalidatePath(projectDetailPath(result.data.jobNo));
  }

  return result;
}

export async function deleteProjectAction(jobNo: string) {
  const auth = await authorizeAction(["ADMIN", "PLANNER"]);
  if (!auth.ok) return auth;

  const result = await deleteProject(jobNo);

  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath(projectDetailPath(jobNo));
  }

  return result;
}
