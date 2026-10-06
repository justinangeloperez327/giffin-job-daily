import type { ActionError, AppErrorCode } from "@/lib/action-result";

type PrismaLikeError = {
  code: string;
  meta?: Record<string, unknown>;
};

function isPrismaLikeError(error: unknown): error is PrismaLikeError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  );
}

export class ApplicationError extends Error {
  readonly code: AppErrorCode;

  constructor(code: AppErrorCode, message: string) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
  }
}

export function mapDatabaseError(error: unknown): ActionError {
  if (error instanceof ApplicationError) {
    return {
      code: error.code,
      message: error.message,
    };
  }

  if (!isPrismaLikeError(error)) {
    return {
      code: "UNKNOWN",
      message: "An unexpected error occurred.",
    };
  }

  switch (error.code) {
    case "P2002":
      return {
        code: "CONFLICT",
        message: "A record with the same unique value already exists.",
      };
    case "P2003":
      return {
        code: "INVALID_REFERENCE",
        message: "A referenced project or employee does not exist.",
      };
    case "P2025":
      return {
        code: "NOT_FOUND",
        message: "The requested record could not be found.",
      };
    case "P2034":
      return {
        code: "CONFLICT",
        message:
          "The record changed while it was being saved. Please retry the operation.",
      };
    default:
      return {
        code: "DATABASE",
        message: "The database operation could not be completed.",
      };
  }
}

export function isRetryableTransactionError(error: unknown): boolean {
  return isPrismaLikeError(error) && error.code === "P2034";
}
