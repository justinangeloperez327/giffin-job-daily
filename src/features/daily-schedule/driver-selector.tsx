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
import type { DriverOption } from "@/features/daily-schedule/driver-options";
import { cn } from "@/lib/utils";

export function DriverSelector({
  options,
  value,
  disabled,
  onValueChange,
}: {
  options: DriverOption[];
  value: string | null;
  disabled?: boolean;
  onValueChange: (employeeId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.employeeId === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-auto min-h-10 w-full justify-between px-3 py-2 text-left font-normal"
        >
          <span className="min-w-0">
            {selected ? (
              <>
                <span className="block truncate text-sm font-medium">
                  {selected.employeeName}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {selected.employeeId} · {selected.designation}
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-medium">Select driver</span>
                <span className="block text-xs text-muted-foreground">
                  Optional
                </span>
              </>
            )}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(26rem,calc(100vw-2rem))] p-0"
      >
        <Command>
          <CommandInput placeholder="Search driver..." />
          <CommandList>
            <CommandEmpty>No matching drivers found.</CommandEmpty>
            <CommandGroup heading="Drivers">
              {value ? (
                <CommandItem
                  value="clear-driver"
                  onSelect={() => {
                    onValueChange(null);
                    setOpen(false);
                  }}
                >
                  <span className="ml-6 text-muted-foreground">No driver</span>
                </CommandItem>
              ) : null}

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
