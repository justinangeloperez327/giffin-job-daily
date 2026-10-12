"use client";

import { formatTimeLabel } from "@/lib/date-time";
import { Textarea } from "@/components/ui/textarea";

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

export function TimeSelectEditor({
  value,
  error,
  disabled,
  ariaLabel,
  onChange,
}: {
  value: string;
  error?: string;
  disabled: boolean;
  ariaLabel: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <select
        value={value}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-invalid={Boolean(error)}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full border border-input bg-background px-1.5 text-xs tabular-nums outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">—</option>
        {value && !TIME_OPTIONS.some((option) => option.value === value) ? (
          <option value={value}>{formatTimeLabel(value)}</option>
        ) : null}
        {TIME_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] leading-4 text-destructive">{error}</p>
      ) : null}
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
      aria-label="Daily target"
      disabled={disabled}
      maxLength={5000}
      rows={2}
      placeholder="Daily work target..."
      onChange={(event) => onChange(event.target.value)}
      className="min-h-14 resize-y rounded-none px-2 py-1.5"
    />
  );
}
