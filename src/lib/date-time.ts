const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isScheduleDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
}

export function parseScheduleDate(value: string): Date {
  if (!isScheduleDate(value)) {
    throw new Error(`Invalid schedule date: ${value}`);
  }

  return new Date(`${value}T00:00:00.000Z`);
}

export function formatScheduleDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function isTimeValue(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function parseTimeValue(value?: string | null): Date | null {
  if (!value) {
    return null;
  }

  if (!isTimeValue(value)) {
    throw new Error(`Invalid time value: ${value}`);
  }

  return new Date(`1970-01-01T${value}:00.000Z`);
}

export function formatTimeValue(value?: Date | null): string | null {
  if (!value) {
    return null;
  }

  return value.toISOString().slice(11, 16);
}

export function timeValueToMinutes(value: string): number {
  if (!isTimeValue(value)) {
    throw new Error(`Invalid time value: ${value}`);
  }

  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
