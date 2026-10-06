"use server";

import { revalidatePath } from "next/cache";

import {
  deleteDailySchedule,
  saveDailySchedule,
} from "@/server/services/daily-schedule";

export async function saveDailyScheduleAction(input: unknown) {
  const result = await saveDailySchedule(input);

  if (result.ok) {
    revalidatePath("/daily-schedule");
    revalidatePath(
      `/projects/${encodeURIComponent(result.data.project.jobNo)}`,
    );
  }

  return result;
}

export async function deleteDailyScheduleAction(
  scheduleDate: string,
  projectJobNo: string,
) {
  const result = await deleteDailySchedule(scheduleDate, projectJobNo);

  if (result.ok) {
    revalidatePath("/daily-schedule");
    revalidatePath(`/projects/${encodeURIComponent(projectJobNo)}`);
  }

  return result;
}
