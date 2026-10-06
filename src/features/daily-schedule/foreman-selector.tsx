"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type ForemanOption = {
  employeeId: string;
  employeeName: string;
  designation: string;
  available: boolean;
  selected: boolean;
  statusLabel?: string;
  assignmentRowKey?: string;
};

export function ForemanSelector({
  options,
  value,
  onValueChange,
  disabled,
}: {
  options: ForemanOption[];
  value: string | null;
  onValueChange: (employeeId: string) => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.employeeId === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-auto min-h-12 w-full justify-between px-3 py-2 text-left font-normal"
        >
          <span className="min-w-0">
            {selected ? (
              <>
                <span className="block truncate text-sm font-medium">
                  {selected.employeeName}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  {selected.employeeId} · {selected.designation}
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-medium">
                  Select foreman
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Search name or employee ID
                </span>
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(24rem,calc(100vw-2rem))] p-0"
      >
        <Command>
          <CommandInput placeholder="Search foreman..." />
          <CommandList>
            <CommandEmpty>No matching foremen found.</CommandEmpty>
            <CommandGroup heading="Foremen">
              {options.map((option) => (
                <CommandItem
                  key={option.employeeId}
                  value={`${option.employeeName} ${option.employeeId} ${option.designation}`}
                  disabled={!option.available && !option.selected}
                  onSelect={() => {
                    onValueChange(option.employeeId);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      option.selected ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {option.employeeName}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.employeeId} · {option.designation}
                    </span>
                  </span>
                  {option.statusLabel ? (
                    <span className="max-w-28 shrink-0 truncate text-xs text-muted-foreground">
                      {option.statusLabel}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
