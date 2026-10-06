"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/states/error-state";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Something went wrong"
      description="The page could not be loaded. Try the request again."
      actionLabel="Try again"
      onAction={reset}
    />
  );
}
