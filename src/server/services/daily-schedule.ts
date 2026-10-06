import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  validationFailure,
} from "@/lib/action-result";
import {
  formatScheduleDate,
  formatTimeValue,
  parseScheduleDate,
  parseTimeValue,
} from "@/lib/date-time";
import {
  dailyScheduleInputSchema,
  dailyScheduleKeySchema,
  type DailyScheduleInput,
} from "@/lib/validation/schedule";
import { ApplicationError, mapDatabaseError } from "@/server/database/errors";
import { withSerializableTransaction } from "@/server/database/transaction";
import {
  buildResourceConflictMap,
  findFirstResourceConflict,
} from "@/server/services/resource-conflicts";

type ScheduleEmployee = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
};

export type SavedDailySchedule = {
  scheduleDate: string;
  project: {
    jobNo: string;
    soNo: string;
    projectName: string;
  };
  foreman: ScheduleEmployee;
  driver: ScheduleEmployee | null;
  campStartTime: string | null;
  startTime: string | null;
  endTime: string | null;
  dailyTarget: string | null;
  equipmentVehicle: string | null;
  labours: ScheduleEmployee[];
};

function toSavedSchedule(schedule: {
  scheduleDate: Date;
  campStartTime: Date | null;
  startTime: Date | null;
  endTime: Date | null;
  dailyTarget: string | null;
  equipmentVehicle: string | null;
  project: {
    jobNo: string;
    soNo: string;
    projectName: string;
  };
  foreman: ScheduleEmployee;
  driver: ScheduleEmployee | null;
  labours: Array<{ labour: ScheduleEmployee }>;
}): SavedDailySchedule {
  return {
    scheduleDate: formatScheduleDate(schedule.scheduleDate),
    project: schedule.project,
    foreman: schedule.foreman,
    driver: schedule.driver,
    campStartTime: formatTimeValue(schedule.campStartTime),
    startTime: formatTimeValue(schedule.startTime),
    endTime: formatTimeValue(schedule.endTime),
    dailyTarget: schedule.dailyTarget,
    equipmentVehicle: schedule.equipmentVehicle,
    labours: schedule.labours.map((assignment) => assignment.labour),
  };
}

function collectRequestedEmployees(input: DailyScheduleInput): string[] {
  return [
    input.foremanEmployeeId,
    ...(input.driverEmployeeId ? [input.driverEmployeeId] : []),
    ...input.labourEmployeeIds,
  ];
}

export async function saveDailySchedule(
  input: unknown,
): Promise<ActionResult<SavedDailySchedule>> {
  const parsed = dailyScheduleInputSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const saved = await withSerializableTransaction(async (transaction) => {
      const value = parsed.data;
      const scheduleDate = parseScheduleDate(value.scheduleDate);
      const requestedEmployeeIds = collectRequestedEmployees(value);

      const [project, employees, otherSchedules] = await Promise.all([
        transaction.project.findUnique({
          where: { jobNo: value.projectJobNo },
          select: { jobNo: true },
        }),
        transaction.labour.findMany({
          where: {
            employeeId: {
              in: requestedEmployeeIds,
            },
          },
          select: {
            employeeId: true,
          },
        }),
        transaction.dailySchedule.findMany({
          where: {
            scheduleDate,
            NOT: {
              projectJobNo: value.projectJobNo,
            },
          },
          select: {
            projectJobNo: true,
            foremanEmployeeId: true,
            driverEmployeeId: true,
            labours: {
              select: {
                employeeId: true,
              },
            },
          },
        }),
      ]);

      if (!project) {
        throw new ApplicationError(
          "INVALID_REFERENCE",
          "The selected project does not exist.",
        );
      }

      const existingEmployeeIds = new Set(
        employees.map((employee) => employee.employeeId),
      );
      const missingEmployeeIds = requestedEmployeeIds.filter(
        (employeeId) => !existingEmployeeIds.has(employeeId),
      );

      if (missingEmployeeIds.length > 0) {
        throw new ApplicationError(
          "INVALID_REFERENCE",
          `Employee not found: ${missingEmployeeIds.join(", ")}.`,
        );
      }

      const conflicts = buildResourceConflictMap(otherSchedules);
      const requestedConflict = findFirstResourceConflict(
        requestedEmployeeIds,
        conflicts,
      );

      if (requestedConflict) {
        throw new ApplicationError(
          "CONFLICT",
          `Employee ${requestedConflict.employeeId} is ${requestedConflict.message}.`,
        );
      }

      await transaction.dailySchedule.upsert({
        where: {
          scheduleDate_projectJobNo: {
            scheduleDate,
            projectJobNo: value.projectJobNo,
          },
        },
        create: {
          scheduleDate,
          projectJobNo: value.projectJobNo,
          foremanEmployeeId: value.foremanEmployeeId,
          campStartTime: parseTimeValue(value.campStartTime),
          startTime: parseTimeValue(value.startTime),
          endTime: parseTimeValue(value.endTime),
          dailyTarget: value.dailyTarget ?? null,
          driverEmployeeId: value.driverEmployeeId ?? null,
          equipmentVehicle: value.equipmentVehicle ?? null,
        },
        update: {
          foremanEmployeeId: value.foremanEmployeeId,
          campStartTime: parseTimeValue(value.campStartTime),
          startTime: parseTimeValue(value.startTime),
          endTime: parseTimeValue(value.endTime),
          dailyTarget: value.dailyTarget ?? null,
          driverEmployeeId: value.driverEmployeeId ?? null,
          equipmentVehicle: value.equipmentVehicle ?? null,
        },
      });

      await transaction.dailyScheduleLabour.deleteMany({
        where: {
          scheduleDate,
          projectJobNo: value.projectJobNo,
        },
      });

      if (value.labourEmployeeIds.length > 0) {
        await transaction.dailyScheduleLabour.createMany({
          data: value.labourEmployeeIds.map((employeeId) => ({
            scheduleDate,
            projectJobNo: value.projectJobNo,
            employeeId,
          })),
        });
      }

      const schedule = await transaction.dailySchedule.findUnique({
        where: {
          scheduleDate_projectJobNo: {
            scheduleDate,
            projectJobNo: value.projectJobNo,
          },
        },
        include: {
          project: true,
          foreman: true,
          driver: true,
          labours: {
            include: {
              labour: true,
            },
            orderBy: {
              labour: {
                employeeName: "asc",
              },
            },
          },
        },
      });

      if (!schedule) {
        throw new ApplicationError(
          "NOT_FOUND",
          "The schedule could not be loaded after saving.",
        );
      }

      return toSavedSchedule(schedule);
    });

    return actionSuccess(saved);
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function deleteDailySchedule(
  scheduleDate: string,
  projectJobNo: string,
): Promise<ActionResult<{ scheduleDate: string; projectJobNo: string }>> {
  const parsed = dailyScheduleKeySchema.safeParse({
    scheduleDate,
    projectJobNo,
  });

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const date = parseScheduleDate(parsed.data.scheduleDate);

    await withSerializableTransaction(async (transaction) => {
      await transaction.dailySchedule.delete({
        where: {
          scheduleDate_projectJobNo: {
            scheduleDate: date,
            projectJobNo: parsed.data.projectJobNo,
          },
        },
      });
    });

    return actionSuccess(parsed.data);
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}
