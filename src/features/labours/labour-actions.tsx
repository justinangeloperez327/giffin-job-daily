"use client";

import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type MouseEvent,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  deleteLabourAction,
  updateLabourAction,
} from "@/app/labours/actions";
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
import { LabourFormFields } from "@/features/labours/labour-form-fields";
import type { ActionError } from "@/lib/action-result";

export type LabourActionRecord = {
  employeeId: string;
  employeeName: string;
  designation: string;
  mobileNumber: string | null;
  usageCount: number;
};

export function LabourActions({ labour }: { labour: LabourActionRecord }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editError, setEditError] = useState<ActionError | null>(null);
  const [pending, startTransition] = useTransition();

  function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateLabourAction(labour.employeeId, formData);

      if (!result.ok) {
        setEditError(result.error);
        return;
      }

      toast.success("Employee updated.");
      setEditError(null);
      setEditOpen(false);
      router.refresh();
    });
  }

  function handleDelete(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await deleteLabourAction(labour.employeeId);

      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }

      toast.success("Employee deleted.");
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
            aria-label={`Actions for ${labour.employeeName}`}
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/labours/${encodeURIComponent(labour.employeeId)}`}>
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
        <SheetContent side="right" className="w-full p-0 sm:max-w-md">
          <SheetHeader className="border-b px-5 py-4">
            <SheetTitle>Edit Employee</SheetTitle>
            <p className="text-sm text-muted-foreground">
              Update employee identity, designation, or mobile number.
            </p>
          </SheetHeader>

          <form
            onSubmit={handleEditSubmit}
            className="flex flex-1 flex-col overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-5">
              <LabourFormFields
                idPrefix={`edit-${labour.employeeId}`}
                defaults={labour}
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
            <AlertDialogTitle>Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              {labour.usageCount > 0
                ? `${labour.employeeName} is referenced by ${labour.usageCount} schedule assignment(s) and cannot be deleted.`
                : `This permanently deletes ${labour.employeeName} (${labour.employeeId}).`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              disabled={pending || labour.usageCount > 0}
              onClick={handleDelete}
            >
              {pending ? "Deleting..." : "Delete Employee"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
