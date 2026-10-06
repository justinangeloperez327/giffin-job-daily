"use client";

import { ErrorState } from "@/components/states/error-state";

export default function DailyScheduleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorState
      title="Daily Schedule unavailable"
      description="The schedule workspace could not be loaded. Retry the request before making further planning changes."
      actionLabel="Try again"
      onAction={reset}
    />
  );
}
