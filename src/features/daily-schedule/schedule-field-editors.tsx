"use client";

import { Textarea } from "@/components/ui/textarea";
import type {
  ScheduleEditableFields,
  TimingFieldErrors,
} from "@/features/daily-schedule/schedule-fields";

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = hours24 % 12 || 12;

  return {
    value: `${String(hours24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    label: `${hours12}:${String(minutes).padStart(2, "0")} ${period}`,
  };
});

export function TimingEditor({
  value,
  errors,
  disabled,
  onChange,
}: {
  value: ScheduleEditableFields;
  errors: TimingFieldErrors;
  disabled: boolean;
  onChange: (
    field: "campStartTime" | "startTime" | "endTime",
    value: string,
  ) => void;
}) {
  const fields = [
    ["campStartTime", "Camp"],
    ["startTime", "Start"],
    ["endTime", "End"],
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-1.5">
      {fields.map(([field, label]) => (
        <div key={field} className="space-y-1">
          <label className="text-[11px] text-muted-foreground">
            {label}
          </label>
          <select
            value={value[field]}
            disabled={disabled}
            aria-invalid={Boolean(errors[field])}
            onChange={(event) => onChange(field, event.target.value)}
            className="h-8 w-full border border-input bg-background px-1.5 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">—</option>
            {TIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors[field] ? (
            <p className="text-[11px] leading-4 text-destructive">
              {errors[field]}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DailyTargetEditor({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Textarea
      value={value}
      disabled={disabled}
      maxLength={5000}
      rows={4}
      placeholder="Daily work target..."
      onChange={(event) => onChange(event.target.value)}
      className="min-h-20 resize-y rounded-none px-2 py-1.5"
    />
  );
}
