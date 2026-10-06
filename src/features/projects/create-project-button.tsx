"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { createProjectAction } from "@/app/projects/actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ProjectFormFields } from "@/features/projects/project-form-fields";
import type { ActionError } from "@/lib/action-result";

export function CreateProjectButton() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const [pending, startTransition] = useTransition();

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    startTransition(async () => {
      const result = await createProjectAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      toast.success("Project created.");
      setError(null);
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Add Project
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full p-0 sm:max-w-md">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>Add Project</SheetTitle>
          <p className="text-sm text-muted-foreground">
            Add the project information used by daily scheduling.
          </p>
        </SheetHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto p-5">
            <ProjectFormFields idPrefix="create-project" error={error} />
          </div>

          <div className="flex justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save Project"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
