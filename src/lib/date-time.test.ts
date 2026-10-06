import { describe, expect, it } from "vitest";

import {
  formatScheduleDate,
  formatTimeValue,
  getScheduleDateInTimeZone,
  isScheduleDate,
  isTimeValue,
  parseScheduleDate,
  parseTimeValue,
  shiftScheduleDate,
  timeValueToMinutes,
} from "@/lib/date-time";

describe("schedule date helpers", () => {
  it("accepts real calendar dates", () => {
    expect(isScheduleDate("2026-10-06")).toBe(true);
    expect(isScheduleDate("2026-02-29")).toBe(false);
    expect(isScheduleDate("2024-02-29")).toBe(true);
  });

  it("round-trips a schedule date", () => {
    expect(formatScheduleDate(parseScheduleDate("2026-10-06"))).toBe(
      "2026-10-06",
    );
  });

  it("shifts dates across month boundaries", () => {
    expect(shiftScheduleDate("2026-10-31", 1)).toBe("2026-11-01");
    expect(shiftScheduleDate("2026-10-01", -1)).toBe("2026-09-30");
  });

  it("derives the business date from a timezone", () => {
    const value = new Date("2026-10-06T21:30:00.000Z");

    expect(getScheduleDateInTimeZone(value, "Asia/Dubai")).toBe("2026-10-07");
    expect(getScheduleDateInTimeZone(value, "UTC")).toBe("2026-10-06");
  });
});

describe("schedule time helpers", () => {
  it("accepts valid 24-hour times", () => {
    expect(isTimeValue("00:00")).toBe(true);
    expect(isTimeValue("23:59")).toBe(true);
    expect(isTimeValue("24:00")).toBe(false);
    expect(isTimeValue("7:00")).toBe(false);
  });

  it("round-trips time values", () => {
    expect(formatTimeValue(parseTimeValue("05:30"))).toBe("05:30");
    expect(parseTimeValue(undefined)).toBeNull();
  });

  it("converts time values to minutes", () => {
    expect(timeValueToMinutes("05:30")).toBe(330);
    expect(timeValueToMinutes("17:00")).toBe(1020);
  });
});
