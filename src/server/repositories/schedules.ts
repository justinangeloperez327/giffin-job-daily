import { parseScheduleDate } from "@/lib/date-time";
import { prisma } from "@/lib/prisma";

const scheduleInclude = {
  project: true,
  foreman: true,
  driver: true,
  labours: {
    include: {
      labour: true,
    },
    orderBy: {
      labour: {
        employeeName: "asc" as const,
      },
    },
  },
} as const;

export async function listDailySchedulesByDate(scheduleDate: string) {
  const date = parseScheduleDate(scheduleDate);

  return prisma.dailySchedule.findMany({
    where: { scheduleDate: date },
    include: scheduleInclude,
    orderBy: {
      project: {
        projectName: "asc",
      },
    },
  });
}

export async function getDailySchedule(
  scheduleDate: string,
  projectJobNo: string,
) {
  const date = parseScheduleDate(scheduleDate);

  return prisma.dailySchedule.findUnique({
    where: {
      scheduleDate_projectJobNo: {
        scheduleDate: date,
        projectJobNo,
      },
    },
    include: scheduleInclude,
  });
}

export async function listDailyScheduleLabours(
  scheduleDate: string,
  projectJobNo?: string,
) {
  const date = parseScheduleDate(scheduleDate);

  return prisma.dailyScheduleLabour.findMany({
    where: {
      scheduleDate: date,
      ...(projectJobNo ? { projectJobNo } : {}),
    },
    include: {
      labour: true,
      dailySchedule: {
        select: {
          project: true,
          foreman: true,
          driver: true,
        },
      },
    },
    orderBy: {
      labour: {
        employeeName: "asc",
      },
    },
  });
}
