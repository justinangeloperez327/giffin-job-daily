"use server";

import { revalidatePath } from "next/cache";

import { deleteDailySchedule } from "@/server/services/daily-schedule";

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
