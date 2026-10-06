import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { isRetryableTransactionError } from "@/server/database/errors";

const MAX_TRANSACTION_ATTEMPTS = 3;
const RETRY_DELAY_MS = 25;

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function withSerializableTransaction<T>(
  operation: (transaction: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  let attempt = 0;

  while (attempt < MAX_TRANSACTION_ATTEMPTS) {
    attempt += 1;

    try {
      return await prisma.$transaction(operation, {
        isolationLevel: "Serializable",
      });
    } catch (error) {
      if (
        !isRetryableTransactionError(error) ||
        attempt >= MAX_TRANSACTION_ATTEMPTS
      ) {
        throw error;
      }

      await delay(RETRY_DELAY_MS * attempt);
    }
  }

  throw new Error("Transaction retry limit exceeded.");
}
