"use client";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

import {
  deleteProjectAction,
  updateProjectAction,
} from "@/app/projects/actions";
import { ProjectFormFields } from "@/features/projects/project-form-fields";
import type { ActionError } from "@/lib/action-result";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type ProjectActionRecord = {
  projectName: string;
  jobNo: string;
  soNo: string;
  scheduleCount: number;
};

export function ProjectActions({ project }: { project: ProjectActionRecord }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editError, setEditError] = useState<ActionError | null>(null);
  const [pending, startTransition] = useTransition();

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateProjectAction(project.jobNo, formData);

      if (!result.ok) {
        setEditError(result.error);
        return;
      }

      toast.success("Project updated.");
      setEditError(null);
      setEditOpen(false);
      router.refresh();
    });
  }

  function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await deleteProjectAction(project.jobNo);

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Project deleted.");
      setDeleteOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Actions for ${project.projectName}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/projects/${encodeURIComponent(project.jobNo)}`}>
              <Eye />
              View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setDeleteOpen(true)}
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Sheet
        open={editOpen}
        onOpenChange={(nextOpen) => {
          setEditOpen(nextOpen);

          if (!nextOpen) {
            setEditError(null);
          }
        }}
      >
        <SheetContent side="right" className="w-full max-w-md p-0">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Edit Project</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Update project, job number, or sales order information.
            </p>
          </SheetHeader>

          <form
            onSubmit={handleEditSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5">
              <ProjectFormFields
                idPrefix={`edit-${project.jobNo}`}
                defaults={project}
                error={editError}
              />
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditOpen(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              {project.scheduleCount > 0
                ? `${project.projectName} has ${project.scheduleCount} daily schedule(s) and cannot be deleted while those records exist.`
                : `This permanently deletes ${project.projectName} (${project.jobNo}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending || project.scheduleCount > 0}
              onClick={handleDelete}
            >
              {pending ? "Deleting..." : "Delete Project"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
