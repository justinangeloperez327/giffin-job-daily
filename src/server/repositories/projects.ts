import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type ProjectListOptions = {
  search?: string;
  skip?: number;
  take?: number;
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

export async function listProjects({
  search,
  skip = 0,
  take = 100,
}: ProjectListOptions = {}) {
  return prisma.project.findMany({
    where: buildProjectWhere(search),
    orderBy: [{ projectName: "asc" }, { jobNo: "asc" }],
    skip: Math.max(0, skip),
    take: Math.min(Math.max(1, take), 500),
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
