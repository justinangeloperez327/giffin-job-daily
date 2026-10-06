import type { ZodError } from "zod";

export type AppErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_REFERENCE"
  | "DATABASE"
  | "UNKNOWN";

export type FieldErrors = Record<string, string[]>;

export type ActionError = {
  code: AppErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
};

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ActionError };

export function actionSuccess<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function actionFailure<T = never>(error: ActionError): ActionResult<T> {
  return { ok: false, error };
}

export function validationFailure<T = never>(
  error: ZodError,
): ActionResult<T> {
  const flattened = error.flatten();

  return actionFailure({
    code: "VALIDATION",
    message: "Please correct the highlighted fields.",
    fieldErrors: flattened.fieldErrors as FieldErrors,
  });
}
