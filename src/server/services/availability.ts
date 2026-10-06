import { parseScheduleDate } from "@/lib/date-time";
import { prisma } from "@/lib/prisma";

export type ResourceRole = "FOREMAN" | "LABOUR" | "DRIVER";

export type ResourceAssignment = {
  role: ResourceRole;
  projectJobNo: string;
  projectName: string;
};

export type ResourceAvailability = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
  available: boolean;
  assignedToCurrentSchedule: boolean;
  assignments: ResourceAssignment[];
  blockingAssignments: ResourceAssignment[];
};

export type AvailabilityOptions = {
  search?: string;
  designation?: string;
  currentProjectJobNo?: string;
  take?: number;
};

export async function getResourceAvailability(
  scheduleDate: string,
  {
    search,
    designation,
    currentProjectJobNo,
    take = 1000,
  }: AvailabilityOptions = {},
): Promise<ResourceAvailability[]> {
  const date = parseScheduleDate(scheduleDate);
  const normalizedSearch = search?.trim();
  const normalizedDesignation = designation?.trim();
  const normalizedCurrentProject = currentProjectJobNo?.trim();

  const employees = await prisma.labour.findMany({
    where: {
      ...(normalizedDesignation
        ? { designation: { equals: normalizedDesignation, mode: "insensitive" } }
        : {}),
      ...(normalizedSearch
        ? {
            OR: [
              {
                employeeId: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
              {
                employeeName: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
              {
                designation: {
                  contains: normalizedSearch,
                  mode: "insensitive",
                },
              },
            ],
          }
        : {}),
    },
    include: {
      foremanSchedules: {
        where: { scheduleDate: date },
        select: {
          projectJobNo: true,
          project: {
            select: {
              projectName: true,
            },
          },
        },
      },
      driverSchedules: {
        where: { scheduleDate: date },
        select: {
          projectJobNo: true,
          project: {
            select: {
              projectName: true,
            },
          },
        },
      },
      scheduleAssignments: {
        where: { scheduleDate: date },
        select: {
          projectJobNo: true,
          dailySchedule: {
            select: {
              project: {
                select: {
                  projectName: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: [{ employeeName: "asc" }, { employeeId: "asc" }],
    take: Math.min(Math.max(1, take), 2000),
  });

  return employees.map((employee) => {
    const assignments: ResourceAssignment[] = [
      ...employee.foremanSchedules.map((schedule) => ({
        role: "FOREMAN" as const,
        projectJobNo: schedule.projectJobNo,
        projectName: schedule.project.projectName,
      })),
      ...employee.scheduleAssignments.map((assignment) => ({
        role: "LABOUR" as const,
        projectJobNo: assignment.projectJobNo,
        projectName: assignment.dailySchedule.project.projectName,
      })),
      ...employee.driverSchedules.map((schedule) => ({
        role: "DRIVER" as const,
        projectJobNo: schedule.projectJobNo,
        projectName: schedule.project.projectName,
      })),
    ];

    const blockingAssignments = normalizedCurrentProject
      ? assignments.filter(
          (assignment) => assignment.projectJobNo !== normalizedCurrentProject,
        )
      : assignments;

    return {
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      designation: employee.designation,
      mobileNumber: employee.mobileNumber,
      available: blockingAssignments.length === 0,
      assignedToCurrentSchedule:
        Boolean(normalizedCurrentProject) &&
        assignments.some(
          (assignment) => assignment.projectJobNo === normalizedCurrentProject,
        ),
      assignments,
      blockingAssignments,
    };
  });
}
