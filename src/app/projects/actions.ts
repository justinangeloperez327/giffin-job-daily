"use server";

import { revalidatePath } from "next/cache";

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

export async function createProjectAction(formData: FormData) {
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
  const result = await updateProject(
    originalJobNo,
    projectInputFromForm(formData),
  );

  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath(`/projects/${originalJobNo}`);
    revalidatePath(`/projects/${result.data.jobNo}`);
  }

  return result;
}

export async function deleteProjectAction(jobNo: string) {
  const result = await deleteProject(jobNo);

  if (result.ok) {
    revalidatePath("/projects");
  }

  return result;
}
