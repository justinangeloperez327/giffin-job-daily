import type { ActionError } from "@/lib/action-result";

import { Input } from "@/components/ui/input";

export type ProjectFormDefaults = {
  projectName?: string;
  customerName?: string;
  jobNo?: string;
  soNo?: string;
  category?: string | null;
  subCategory?: string | null;
};

function FieldError({
  error,
  field,
}: {
  error: ActionError | null;
  field: string;
}) {
  const message = error?.fieldErrors?.[field]?.[0];

  return message ? (
    <p className="text-xs text-destructive">{message}</p>
  ) : null;
}

export function ProjectFormFields({
  defaults,
  error,
  idPrefix,
}: {
  defaults?: ProjectFormDefaults;
  error: ActionError | null;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {error ? (
        <div role="alert" className="sm:col-span-2 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-project-name`}
          className="text-sm font-medium"
        >
          Project Name
        </label>
        <Input
          id={`${idPrefix}-project-name`}
          name="projectName"
          defaultValue={defaults?.projectName}
          maxLength={200}
          required
          aria-invalid={Boolean(error?.fieldErrors?.projectName)}
        />
        <FieldError error={error} field="projectName" />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-customer-name`}
          className="text-sm font-medium"
        >
          Client / Customer
        </label>
        <Input
          id={`${idPrefix}-customer-name`}
          name="customerName"
          defaultValue={defaults?.customerName}
          maxLength={200}
          required
          aria-invalid={Boolean(error?.fieldErrors?.customerName)}
        />
        <FieldError error={error} field="customerName" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-category`} className="text-sm font-medium">
          Category
        </label>
        <Input
          id={`${idPrefix}-category`}
          name="category"
          defaultValue={defaults?.category ?? ""}
          maxLength={100}
          placeholder="Optional"
          aria-invalid={Boolean(error?.fieldErrors?.category)}
        />
        <FieldError error={error} field="category" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${idPrefix}-sub-category`} className="text-sm font-medium">
          Sub-category
        </label>
        <Input
          id={`${idPrefix}-sub-category`}
          name="subCategory"
          defaultValue={defaults?.subCategory ?? ""}
          maxLength={100}
          placeholder="Optional"
          aria-invalid={Boolean(error?.fieldErrors?.subCategory)}
        />
        <FieldError error={error} field="subCategory" />
      </div>

      <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label
            htmlFor={`${idPrefix}-job-no`}
            className="text-sm font-medium"
          >
            Job No
          </label>
          <Input
            id={`${idPrefix}-job-no`}
            name="jobNo"
            defaultValue={defaults?.jobNo}
            maxLength={50}
            required
            aria-invalid={Boolean(error?.fieldErrors?.jobNo)}
          />
          <FieldError error={error} field="jobNo" />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor={`${idPrefix}-so-no`}
            className="text-sm font-medium"
          >
            SO No
          </label>
          <Input
            id={`${idPrefix}-so-no`}
            name="soNo"
            defaultValue={defaults?.soNo}
            maxLength={50}
            required
            aria-invalid={Boolean(error?.fieldErrors?.soNo)}
          />
          <FieldError error={error} field="soNo" />
        </div>
      </div>
    </div>
  );
}
