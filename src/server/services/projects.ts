import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  validationFailure,
} from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import {
  projectInputSchema,
  projectKeySchema,
} from "@/lib/validation/project";
import { ApplicationError, mapDatabaseError } from "@/server/database/errors";
import { withSerializableTransaction } from "@/server/database/transaction";

export type SavedProject = {
  projectName: string;
  jobNo: string;
  soNo: string;
};

function mapProjectWriteError(error: unknown) {
  const mapped = mapDatabaseError(error);

  if (mapped.code === "CONFLICT") {
    return {
      ...mapped,
      message: "A project with this job number already exists.",
    };
  }

  return mapped;
}

export async function createProject(
  input: unknown,
): Promise<ActionResult<SavedProject>> {
  const parsed = projectInputSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const project = await prisma.project.create({
      data: parsed.data,
      select: {
        projectName: true,
        jobNo: true,
        soNo: true,
      },
    });

    return actionSuccess(project);
  } catch (error) {
    return actionFailure(mapProjectWriteError(error));
  }
}

export async function updateProject(
  originalJobNo: string,
  input: unknown,
): Promise<ActionResult<SavedProject>> {
  const key = projectKeySchema.safeParse({ jobNo: originalJobNo });

  if (!key.success) {
    return validationFailure(key.error);
  }

  const parsed = projectInputSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const project = await prisma.project.update({
      where: {
        jobNo: key.data.jobNo,
      },
      data: parsed.data,
      select: {
        projectName: true,
        jobNo: true,
        soNo: true,
      },
    });

    return actionSuccess(project);
  } catch (error) {
    return actionFailure(mapProjectWriteError(error));
  }
}

export async function deleteProject(
  jobNo: string,
): Promise<ActionResult<SavedProject>> {
  const parsed = projectKeySchema.safeParse({ jobNo });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const project = await withSerializableTransaction(async (transaction) => {
      const existing = await transaction.project.findUnique({
        where: {
          jobNo: parsed.data.jobNo,
        },
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
      });

      if (!existing) {
        throw new ApplicationError("NOT_FOUND", "The project no longer exists.");
      }

      if (existing._count.dailySchedules > 0) {
        throw new ApplicationError(
          "CONFLICT",
          "This project has daily schedules and cannot be deleted.",
        );
      }

      return transaction.project.delete({
        where: {
          jobNo: parsed.data.jobNo,
        },
        select: {
          projectName: true,
          jobNo: true,
          soNo: true,
        },
      });
    });

    return actionSuccess(project);
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}
