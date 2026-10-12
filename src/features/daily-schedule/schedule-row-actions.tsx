"use client";

import { Trash2, Truck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ScheduleRowActions({
  logisticsExpanded,
  hasLogistics,
  onToggleLogistics,
  onRemove,
  removeDisabled,
  removeLabel,
}: {
  logisticsExpanded: boolean;
  hasLogistics: boolean;
  onToggleLogistics: () => void;
  onRemove: () => void;
  removeDisabled: boolean;
  removeLabel: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={cn(
          "size-8 text-muted-foreground hover:text-foreground",
          hasLogistics && "text-primary",
        )}
        aria-expanded={logisticsExpanded}
        aria-label={logisticsExpanded ? "Hide project logistics" : "Edit project logistics"}
        title="Show or hide logistics details"
        onClick={onToggleLogistics}
      >
        <Truck className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8 text-muted-foreground hover:text-destructive"
        disabled={removeDisabled}
        aria-label={removeLabel}
        title={removeLabel}
        onClick={onRemove}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}
