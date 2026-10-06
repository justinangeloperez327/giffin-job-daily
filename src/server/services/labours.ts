import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  validationFailure,
} from "@/lib/action-result";
import { prisma } from "@/lib/prisma";
import {
  labourInputSchema,
  labourKeySchema,
} from "@/lib/validation/labour";
import { ApplicationError, mapDatabaseError } from "@/server/database/errors";
import { withSerializableTransaction } from "@/server/database/transaction";

export type SavedLabour = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
};

function mapLabourWriteError(error: unknown) {
  const mapped = mapDatabaseError(error);

  if (mapped.code === "CONFLICT") {
    return {
      ...mapped,
      message: "An employee with this employee ID already exists.",
    };
  }

  return mapped;
}

export async function createLabour(
  input: unknown,
): Promise<ActionResult<SavedLabour>> {
  const parsed = labourInputSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const labour = await prisma.labour.create({
      data: {
        ...parsed.data,
        mobileNumber: parsed.data.mobileNumber ?? null,
      },
      select: {
        employeeId: true,
        employeeName: true,
        designation: true,
        mobileNumber: true,
      },
    });

    return actionSuccess(labour);
  } catch (error) {
    return actionFailure(mapLabourWriteError(error));
  }
}

export async function updateLabour(
  originalEmployeeId: string,
  input: unknown,
): Promise<ActionResult<SavedLabour>> {
  const key = labourKeySchema.safeParse({ employeeId: originalEmployeeId });

  if (!key.success) {
    return validationFailure(key.error);
  }

  const parsed = labourInputSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const labour = await prisma.labour.update({
      where: {
        employeeId: key.data.employeeId,
      },
      data: {
        ...parsed.data,
        mobileNumber: parsed.data.mobileNumber ?? null,
      },
      select: {
        employeeId: true,
        employeeName: true,
        designation: true,
        mobileNumber: true,
      },
    });

    return actionSuccess(labour);
  } catch (error) {
    return actionFailure(mapLabourWriteError(error));
  }
}

export async function deleteLabour(
  employeeId: string,
): Promise<ActionResult<SavedLabour>> {
  const parsed = labourKeySchema.safeParse({ employeeId });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const labour = await withSerializableTransaction(async (transaction) => {
      const existing = await transaction.labour.findUnique({
        where: {
          employeeId: parsed.data.employeeId,
        },
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
      });

      if (!existing) {
        throw new ApplicationError("NOT_FOUND", "The employee no longer exists.");
      }

      const assignmentCount =
        existing._count.foremanSchedules +
        existing._count.driverSchedules +
        existing._count.scheduleAssignments;

      if (assignmentCount > 0) {
        throw new ApplicationError(
          "CONFLICT",
          "This employee is used by daily schedules and cannot be deleted.",
        );
      }

      return transaction.labour.delete({
        where: {
          employeeId: parsed.data.employeeId,
        },
        select: {
          employeeId: true,
          employeeName: true,
          designation: true,
          mobileNumber: true,
        },
      });
    });

    return actionSuccess(labour);
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}
