import { Input } from "@/components/ui/input";
import type { ActionError } from "@/lib/action-result";

export type LabourFormDefaults = {
  employeeId?: string;
  employeeName?: string;
  designation?: string;
  mobileNumber?: string | null;
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

export function LabourFormFields({
  defaults,
  error,
  idPrefix,
}: {
  defaults?: LabourFormDefaults;
  error: ActionError | null;
  idPrefix: string;
}) {
  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error.message}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-employee-name`}
          className="text-sm font-medium"
        >
          Employee Name
        </label>
        <Input
          id={`${idPrefix}-employee-name`}
          name="employeeName"
          defaultValue={defaults?.employeeName}
          maxLength={150}
          required
          aria-invalid={Boolean(error?.fieldErrors?.employeeName)}
        />
        <FieldError error={error} field="employeeName" />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-employee-id`}
          className="text-sm font-medium"
        >
          Employee ID
        </label>
        <Input
          id={`${idPrefix}-employee-id`}
          name="employeeId"
          defaultValue={defaults?.employeeId}
          maxLength={50}
          required
          aria-invalid={Boolean(error?.fieldErrors?.employeeId)}
        />
        <FieldError error={error} field="employeeId" />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-designation`}
          className="text-sm font-medium"
        >
          Designation
        </label>
        <Input
          id={`${idPrefix}-designation`}
          name="designation"
          defaultValue={defaults?.designation}
          maxLength={100}
          placeholder="e.g. Foreman, Electrician, Driver"
          required
          aria-invalid={Boolean(error?.fieldErrors?.designation)}
        />
        <FieldError error={error} field="designation" />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-mobile-number`}
          className="text-sm font-medium"
        >
          Mobile Number
        </label>
        <Input
          id={`${idPrefix}-mobile-number`}
          name="mobileNumber"
          type="tel"
          defaultValue={defaults?.mobileNumber ?? ""}
          maxLength={30}
          placeholder="Optional"
          aria-invalid={Boolean(error?.fieldErrors?.mobileNumber)}
        />
        <FieldError error={error} field="mobileNumber" />
      </div>
    </div>
  );
}
