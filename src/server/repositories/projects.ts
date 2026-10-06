import { prisma } from "@/lib/prisma";

export type ProjectListOptions = {
  search?: string;
  skip?: number;
  take?: number;
};

export async function listProjects({
  search,
  skip = 0,
  take = 100,
}: ProjectListOptions = {}) {
  const normalizedSearch = search?.trim();

  return prisma.project.findMany({
    where: normalizedSearch
      ? {
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
        }
      : undefined,
    orderBy: [{ projectName: "asc" }, { jobNo: "asc" }],
    skip: Math.max(0, skip),
    take: Math.min(Math.max(1, take), 500),
  });
}

export async function getProjectByJobNo(jobNo: string) {
  return prisma.project.findUnique({
    where: { jobNo },
  });
}
