import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  LabourSortField,
  SortOrder,
} from "@/lib/validation/query";

export type LabourListOptions = {
  search?: string;
  designation?: string;
  skip?: number;
  take?: number;
  sort?: LabourSortField;
  order?: SortOrder;
};

function buildLabourWhere({
  search,
  designation,
}: Pick<LabourListOptions, "search" | "designation">): Prisma.LabourWhereInput {
  const normalizedSearch = search?.trim();
  const normalizedDesignation = designation?.trim();

  return {
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
  };
}

function buildLabourOrderBy(
  sort: LabourSortField = "employeeName",
  order: SortOrder = "asc",
): Prisma.LabourOrderByWithRelationInput[] {
  const primary = {
    [sort]: order,
  } as Prisma.LabourOrderByWithRelationInput;

  return sort === "employeeId" ? [primary] : [primary, { employeeId: "asc" }];
}

export async function listLabours({
  search,
  designation,
  skip = 0,
  take = 100,
  sort = "employeeName",
  order = "asc",
}: LabourListOptions = {}) {
  return prisma.labour.findMany({
    where: buildLabourWhere({ search, designation }),
    select: {
      employeeId: true,
      employeeName: true,
      designation: true,
      mobileNumber: true,
      _count: {
        select: {
          foremanSchedules: true,
          driverSchedules: true,
          scheduleAssignments: true,
        },
      },
    },
    orderBy: buildLabourOrderBy(sort, order),
    skip: Math.max(0, skip),
    take: Math.min(Math.max(1, take), 1000),
  });
}

export async function countLabours({
  search,
  designation,
}: Pick<LabourListOptions, "search" | "designation"> = {}) {
  return prisma.labour.count({
    where: buildLabourWhere({ search, designation }),
  });
}

export async function getLabourByEmployeeId(employeeId: string) {
  return prisma.labour.findUnique({
    where: { employeeId },
  });
}

export async function getLabourDetailByEmployeeId(employeeId: string) {
  return prisma.labour.findUnique({
    where: { employeeId },
    include: {
      _count: {
        select: {
          foremanSchedules: true,
          driverSchedules: true,
          scheduleAssignments: true,
        },
      },
      foremanSchedules: {
        take: 50,
        orderBy: { scheduleDate: "desc" },
        include: {
          project: true,
        },
      },
      driverSchedules: {
        take: 50,
        orderBy: { scheduleDate: "desc" },
        include: {
          project: true,
        },
      },
      scheduleAssignments: {
        take: 50,
        orderBy: { scheduleDate: "desc" },
        include: {
          dailySchedule: {
            include: {
              project: true,
            },
          },
        },
      },
    },
  });
}

export async function listLabourDesignations() {
  const rows = await prisma.labour.findMany({
    select: { designation: true },
    distinct: ["designation"],
    orderBy: { designation: "asc" },
  });

  return rows.map((row) => row.designation);
}
