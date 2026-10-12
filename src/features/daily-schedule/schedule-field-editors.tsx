"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type {
  ScheduleEditableFields,
  TimingFieldErrors,
} from "@/features/daily-schedule/schedule-fields";

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
          <Input
            type="time"
            step={60}
            value={value[field]}
            disabled={disabled}
            aria-invalid={Boolean(errors[field])}
            onChange={(event) => onChange(field, event.target.value)}
            className="h-8 rounded-none px-1.5 text-xs tabular-nums"
          />
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
