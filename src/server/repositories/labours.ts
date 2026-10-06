import { prisma } from "@/lib/prisma";

export type LabourListOptions = {
  search?: string;
  designation?: string;
  skip?: number;
  take?: number;
};

export async function listLabours({
  search,
  designation,
  skip = 0,
  take = 100,
}: LabourListOptions = {}) {
  const normalizedSearch = search?.trim();
  const normalizedDesignation = designation?.trim();

  return prisma.labour.findMany({
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
    orderBy: [{ employeeName: "asc" }, { employeeId: "asc" }],
    skip: Math.max(0, skip),
    take: Math.min(Math.max(1, take), 1000),
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
