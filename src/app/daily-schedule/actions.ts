"use server";

import { revalidatePath } from "next/cache";

import {
  deleteDailySchedule,
  moveLabourAssignment,
  saveDailySchedule,
} from "@/server/services/daily-schedule";

function revalidateScheduleProjects(...jobNos: string[]) {
  revalidatePath("/daily-schedule");
  for (const jobNo of new Set(jobNos)) {
    revalidatePath(`/projects/${encodeURIComponent(jobNo)}`);
  }
}

export async function saveDailyScheduleAction(input: unknown) {
  const result = await saveDailySchedule(input);
  if (result.ok) revalidateScheduleProjects(result.data.project.jobNo);
  return result;
}

export async function moveLabourAssignmentAction(input: unknown) {
  const result = await moveLabourAssignment(input);
  if (result.ok) {
    revalidateScheduleProjects(result.data.fromProjectJobNo, result.data.toProjectJobNo);
  }
  return result;
}

export async function deleteDailyScheduleAction(scheduleDate: string, projectJobNo: string) {
  const result = await deleteDailySchedule(scheduleDate, projectJobNo);
  if (result.ok) revalidateScheduleProjects(projectJobNo);
  return result;
}
