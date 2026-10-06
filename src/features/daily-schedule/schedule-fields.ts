import {
  isTimeValue,
  timeValueToMinutes,
} from "@/lib/date-time";

export type ScheduleEditableFields = {
  campStartTime: string;
  startTime: string;
  endTime: string;
  dailyTarget: string;
};

export type TimingFieldErrors = Partial<
  Record<"campStartTime" | "startTime" | "endTime", string>
>;

export function scheduleEditableFieldsFrom({
  campStartTime,
  startTime,
  endTime,
  dailyTarget,
}: {
  campStartTime?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  dailyTarget?: string | null;
}): ScheduleEditableFields {
  return {
    campStartTime: campStartTime ?? "",
    startTime: startTime ?? "",
    endTime: endTime ?? "",
    dailyTarget: dailyTarget ?? "",
  };
}

export function validateTimingFields(
  value: Pick<
    ScheduleEditableFields,
    "campStartTime" | "startTime" | "endTime"
  >,
): TimingFieldErrors {
  const errors: TimingFieldErrors = {};
  const entries = [
    ["campStartTime", value.campStartTime],
    ["startTime", value.startTime],
    ["endTime", value.endTime],
  ] as const;

  for (const [field, time] of entries) {
    if (time && !isTimeValue(time)) {
      errors[field] = "Use a valid 24-hour time.";
    }
  }

  if (
    !errors.campStartTime &&
    !errors.startTime &&
    value.campStartTime &&
    value.startTime &&
    timeValueToMinutes(value.campStartTime) >
      timeValueToMinutes(value.startTime)
  ) {
    errors.campStartTime =
      "Camp start cannot be later than work start.";
  }

  if (
    !errors.startTime &&
    !errors.endTime &&
    value.startTime &&
    value.endTime &&
    timeValueToMinutes(value.startTime) >=
      timeValueToMinutes(value.endTime)
  ) {
    errors.endTime = "End time must be later than work start.";
  }

  return errors;
}

export function hasTimingErrors(errors: TimingFieldErrors) {
  return Object.keys(errors).length > 0;
}
