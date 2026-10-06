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

export type ScheduleProjectOption = {
  projectName: string;
  jobNo: string;
  soNo: string;
};

export function ProjectSelector({
  projects,
  value,
  disabledJobNos,
  onValueChange,
  disabled,
  error,
}: {
  projects: ScheduleProjectOption[];
  value: string | null;
  disabledJobNos: string[];
  onValueChange: (jobNo: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedProject = projects.find((project) => project.jobNo === value);
  const blocked = new Set(disabledJobNos);

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
            {selectedProject ? (
              <>
                <span className="block truncate text-sm font-medium">
                  {selectedProject.projectName}
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                  Job {selectedProject.jobNo} · SO {selectedProject.soNo}
                </span>
              </>
            ) : (
              <>
                <span className="block text-sm font-medium">
                  Select project
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Search job, SO, or project name
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
          <CommandInput placeholder="Search project, job no, or SO no..." />
          <CommandList>
            <CommandEmpty>
              {error ?? "No matching projects found."}
            </CommandEmpty>
            <CommandGroup heading="Projects">
              {projects.map((project) => {
                const unavailable =
                  blocked.has(project.jobNo) && project.jobNo !== value;

                return (
                  <CommandItem
                    key={project.jobNo}
                    value={`${project.projectName} ${project.jobNo} ${project.soNo}`}
                    disabled={unavailable}
                    onSelect={() => {
                      onValueChange(project.jobNo);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "size-4 shrink-0",
                        project.jobNo === value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">
                        {project.projectName}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        Job {project.jobNo} · SO {project.soNo}
                      </span>
                    </span>
                    {unavailable ? (
                      <span className="shrink-0 text-xs text-muted-foreground">
                        Scheduled
                      </span>
                    ) : null}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
