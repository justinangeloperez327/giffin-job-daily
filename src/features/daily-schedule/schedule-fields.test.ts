import { describe, expect, it } from "vitest";

import {
  hasTimingErrors,
  scheduleEditableFieldsFrom,
  validateTimingFields,
} from "@/features/daily-schedule/schedule-fields";

describe("schedule editable fields", () => {
  it("normalizes nullable persisted values for inputs", () => {
    expect(
      scheduleEditableFieldsFrom({
        campStartTime: null,
        startTime: "07:00",
        endTime: null,
        dailyTarget: null,
      }),
    ).toEqual({
      campStartTime: "",
      startTime: "07:00",
      endTime: "",
      dailyTarget: "",
    });
  });
});

describe("timing editor validation", () => {
  it("accepts blank timing fields", () => {
    expect(
      hasTimingErrors(
        validateTimingFields({
          campStartTime: "",
          startTime: "",
          endTime: "",
        }),
      ),
    ).toBe(false);
  });

  it("accepts ordered times", () => {
    expect(
      validateTimingFields({
        campStartTime: "05:00",
        startTime: "07:00",
        endTime: "17:00",
      }),
    ).toEqual({});
  });

  it("rejects camp start after work start", () => {
    expect(
      validateTimingFields({
        campStartTime: "08:00",
        startTime: "07:00",
        endTime: "17:00",
      }).campStartTime,
    ).toBeDefined();
  });

  it("rejects end time equal to work start", () => {
    expect(
      validateTimingFields({
        campStartTime: "",
        startTime: "07:00",
        endTime: "07:00",
      }).endTime,
    ).toBeDefined();
  });
});
