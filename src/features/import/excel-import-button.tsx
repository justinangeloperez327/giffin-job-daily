"use client";

import { FileSpreadsheet, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import {
  importLaboursExcelAction,
  importProjectsExcelAction,
} from "@/app/import/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { ActionError } from "@/lib/action-result";
import type { ExcelImportSummary } from "@/server/services/import-master-data";

type ImportKind = "projects" | "labours";

const importConfig = {
  projects: {
    title: "Import Projects",
    description:
      "Upload the project master list. Existing Job No records are updated and new Job No records are created.",
    headers: ["Project Name", "Job No", "SO No"],
  },
  labours: {
    title: "Import Labours",
    description:
      "Upload the labour master list. Existing Employee ID records are updated and new Employee ID records are created.",
    headers: [
      "Employee ID",
      "Employee Name",
      "Designation",
      "Mobile Number (optional)",
    ],
  },
} satisfies Record<
  ImportKind,
  {
    title: string;
    description: string;
    headers: string[];
  }
>;

export function ExcelImportButton({ kind }: { kind: ImportKind }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ActionError | null>(null);
  const [summary, setSummary] = useState<ExcelImportSummary | null>(null);
  const config = importConfig[kind];

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
      setSummary(null);
      formRef.current?.reset();
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    setError(null);
    setSummary(null);

    startTransition(async () => {
      const result =
        kind === "projects"
          ? await importProjectsExcelAction(formData)
          : await importLaboursExcelAction(formData);

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setSummary(result.data);
      formRef.current?.reset();
      router.refresh();

      toast.success(
        `Imported ${result.data.total} row(s): ${result.data.created} created, ${result.data.updated} updated.`,
      );
    });
  }

  const rowErrors = error?.fieldErrors
    ? Object.entries(error.fieldErrors)
        .filter(([key]) => key.startsWith("row_"))
        .map(([key, messages]) => ({
          row: key.replace("row_", ""),
          messages,
        }))
    : [];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline">
          <Upload className="size-4" />
          Import Excel
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{config.title}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
        </SheetHeader>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            <div className="rounded-lg border bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="size-4 text-muted-foreground" />
                <p className="text-sm font-medium">Excel format</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                Use the first worksheet. The header row can be within the
                first 20 rows. A workbook can contain up to 2,000 data rows
                and must be 5 MB or smaller.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {config.headers.map((header) => (
                  <span
                    key={header}
                    className="rounded-md border bg-background px-2 py-1 text-xs"
                  >
                    {header}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor={`excel-${kind}`} className="text-sm font-medium">
                Workbook
              </label>
              <Input
                id={`excel-${kind}`}
                name="file"
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                required
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">
                Import is atomic. If any row is invalid, no records are
                created or updated.
              </p>
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-sm font-medium text-destructive">
                  {error.message}
                </p>

                {error.fieldErrors?.file?.map((message) => (
                  <p
                    key={message}
                    className="mt-1 text-xs text-destructive"
                  >
                    {message}
                  </p>
                ))}

                {rowErrors.length > 0 ? (
                  <div className="mt-3 max-h-56 space-y-2 overflow-y-auto border-t border-destructive/20 pt-3">
                    {rowErrors.map((item) => (
                      <div key={item.row} className="text-xs">
                        <span className="font-medium text-destructive">
                          Row {item.row}:
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {item.messages.join(" ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {summary ? (
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-sm font-medium">Import complete</p>
                <div className="mt-2 grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Rows</p>
                    <p className="font-medium tabular-nums">{summary.total}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="font-medium tabular-nums">{summary.created}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Updated</p>
                    <p className="font-medium tabular-nums">{summary.updated}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Worksheet: {summary.sheetName}
                </p>
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t p-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Close
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Importing..." : "Import Workbook"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
