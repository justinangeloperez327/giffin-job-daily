import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type LabourListOptions = {
  search?: string;
  designation?: string;
  skip?: number;
  take?: number;
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

export async function listLabours({
  search,
  designation,
  skip = 0,
  take = 100,
}: LabourListOptions = {}) {
  return prisma.labour.findMany({
    where: buildLabourWhere({ search, designation }),
    orderBy: [{ employeeName: "asc" }, { employeeId: "asc" }],
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

export async function listLabourDesignations() {
  const rows = await prisma.labour.findMany({
    select: { designation: true },
    distinct: ["designation"],
    orderBy: { designation: "asc" },
  });

  return rows.map((row) => row.designation);
}
