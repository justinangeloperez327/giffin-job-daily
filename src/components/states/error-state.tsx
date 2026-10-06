"use client";

import { CircleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ErrorState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-5 text-center">
      <div className="mb-3 rounded-md border bg-muted/40 p-2.5">
        <CircleAlert className="size-5 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {actionLabel && onAction ? (
        <Button className="mt-4" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
