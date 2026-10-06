import { z } from "zod";

import { timeValueToMinutes } from "@/lib/date-time";
import {
  optionalText,
  optionalTimeSchema,
  requiredText,
  scheduleDateSchema,
} from "@/lib/validation/common";

export const dailyScheduleInputSchema = z
  .object({
    scheduleDate: scheduleDateSchema,
    projectJobNo: requiredText("Project", 50),
    foremanEmployeeId: requiredText("Foreman", 50),
    campStartTime: optionalTimeSchema,
    startTime: optionalTimeSchema,
    endTime: optionalTimeSchema,
    dailyTarget: optionalText(5000),
    driverEmployeeId: optionalText(50),
    equipmentVehicle: optionalText(200),
    labourEmployeeIds: z
      .array(requiredText("Labour employee ID", 50))
      .max(1000, "A schedule cannot contain more than 1,000 labour assignments.")
      .default([]),
  })
  .superRefine((value, context) => {
    const uniqueLabours = new Set(value.labourEmployeeIds);

    if (uniqueLabours.size !== value.labourEmployeeIds.length) {
      context.addIssue({
        code: "custom",
        path: ["labourEmployeeIds"],
        message: "The same labour employee cannot be assigned more than once.",
      });
    }

    if (uniqueLabours.has(value.foremanEmployeeId)) {
      context.addIssue({
        code: "custom",
        path: ["labourEmployeeIds"],
        message: "The foreman cannot also be assigned as labour.",
      });
    }

    if (
      value.driverEmployeeId &&
      value.driverEmployeeId === value.foremanEmployeeId
    ) {
      context.addIssue({
        code: "custom",
        path: ["driverEmployeeId"],
        message: "The foreman cannot also be assigned as the driver.",
      });
    }

    if (
      value.driverEmployeeId &&
      uniqueLabours.has(value.driverEmployeeId)
    ) {
      context.addIssue({
        code: "custom",
        path: ["driverEmployeeId"],
        message: "A labour employee cannot also be assigned as the driver.",
      });
    }

    if (
      value.campStartTime &&
      value.startTime &&
      timeValueToMinutes(value.campStartTime) >
        timeValueToMinutes(value.startTime)
    ) {
      context.addIssue({
        code: "custom",
        path: ["campStartTime"],
        message: "Camp start time cannot be later than work start time.",
      });
    }

    if (
      value.startTime &&
      value.endTime &&
      timeValueToMinutes(value.startTime) >= timeValueToMinutes(value.endTime)
    ) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time must be later than work start time.",
      });
    }
  });

export type DailyScheduleInput = z.infer<typeof dailyScheduleInputSchema>;
