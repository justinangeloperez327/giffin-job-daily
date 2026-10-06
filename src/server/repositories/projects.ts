import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ProjectSortField,
  SortOrder,
} from "@/lib/validation/query";

export type ProjectListOptions = {
  search?: string;
  skip?: number;
  take?: number;
  sort?: ProjectSortField;
  order?: SortOrder;
};

function buildProjectWhere(search?: string): Prisma.ProjectWhereInput | undefined {
  const normalizedSearch = search?.trim();

  if (!normalizedSearch) {
    return undefined;
  }

  return {
    OR: [
      {
        projectName: {
          contains: normalizedSearch,
          mode: "insensitive",
        },
      },
      {
        jobNo: {
          contains: normalizedSearch,
          mode: "insensitive",
        },
      },
      {
        soNo: {
          contains: normalizedSearch,
          mode: "insensitive",
        },
      },
    ],
  };
}

function buildProjectOrderBy(
  sort: ProjectSortField = "projectName",
  order: SortOrder = "asc",
): Prisma.ProjectOrderByWithRelationInput[] {
  const primary = {
    [sort]: order,
  } as Prisma.ProjectOrderByWithRelationInput;

  return sort === "jobNo" ? [primary] : [primary, { jobNo: "asc" }];
}

export async function listProjects({
  search,
  skip = 0,
  take = 100,
  sort = "projectName",
  order = "asc",
}: ProjectListOptions = {}) {
  return prisma.project.findMany({
    where: buildProjectWhere(search),
    select: {
      projectName: true,
      jobNo: true,
      soNo: true,
      _count: {
        select: {
          dailySchedules: true,
        },
      },
    },
    orderBy: buildProjectOrderBy(sort, order),
    skip: Math.max(0, skip),
    take: Math.min(Math.max(1, take), 500),
  });
}

export async function listProjectOptions() {
  return prisma.project.findMany({
    select: {
      projectName: true,
      jobNo: true,
      soNo: true,
    },
    orderBy: [{ projectName: "asc" }, { jobNo: "asc" }],
    take: 2000,
  });
}

export async function countProjects(search?: string) {
  return prisma.project.count({
    where: buildProjectWhere(search),
  });
}

export async function getProjectByJobNo(jobNo: string) {
  return prisma.project.findUnique({
    where: { jobNo },
  });
}

export async function getProjectDetailByJobNo(jobNo: string) {
  return prisma.project.findUnique({
    where: { jobNo },
    include: {
      _count: {
        select: {
          dailySchedules: true,
        },
      },
      dailySchedules: {
        take: 100,
        orderBy: {
          scheduleDate: "desc",
        },
        include: {
          foreman: true,
          driver: true,
          _count: {
            select: {
              labours: true,
            },
          },
        },
      },
    },
  });
}
