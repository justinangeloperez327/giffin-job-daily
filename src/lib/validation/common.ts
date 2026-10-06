import { z } from "zod";

import { isScheduleDate, isTimeValue } from "@/lib/date-time";

export function requiredText(label: string, maxLength: number) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(maxLength, `${label} must be ${maxLength} characters or fewer.`);
}

export function optionalText(maxLength: number) {
  return z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    },
    z.string().max(maxLength).optional(),
  );
}

export const scheduleDateSchema = z
  .string()
  .refine(isScheduleDate, "Enter a valid date in YYYY-MM-DD format.");

export const optionalTimeSchema = z.preprocess(
  (value) => {
    if (value === null || value === undefined || value === "") {
      return undefined;
    }

    return value;
  },
  z
    .string()
    .refine(isTimeValue, "Enter a valid time in HH:mm format.")
    .optional(),
);
