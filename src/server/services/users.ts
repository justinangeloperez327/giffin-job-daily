import "server-only";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  validationFailure,
} from "@/lib/action-result";
import type { UserRoleValue } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserSchema,
  userIdSchema,
} from "@/lib/validation/user";
import { mapDatabaseError } from "@/server/database/errors";
import { hashPassword } from "@/server/auth/password";
import { withSerializableTransaction } from "@/server/database/transaction";

export type ManagedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toManagedUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ManagedUser {
  return {
    ...user,
    role: user.role as UserRoleValue,
  };
}

function mapUserWriteError(error: unknown) {
  const mapped = mapDatabaseError(error);

  if (mapped.code === "CONFLICT") {
    return {
      ...mapped,
      message: "A user with this email address already exists.",
    };
  }

  return mapped;
}

export async function listUsers(): Promise<ActionResult<ManagedUser[]>> {
  try {
    const users = await prisma.user.findMany({
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      select: userSelect,
    });

    return actionSuccess(users.map(toManagedUser));
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function getUserById(
  id: string,
): Promise<ActionResult<ManagedUser>> {
  const parsed = userIdSchema.safeParse(id);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: parsed.data },
      select: userSelect,
    });

    if (!user) {
      return actionFailure({
        code: "NOT_FOUND",
        message: "The user does not exist.",
      });
    }

    return actionSuccess(toManagedUser(user));
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function createUser(
  input: unknown,
): Promise<ActionResult<ManagedUser>> {
  const parsed = createUserSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: parsed.data.role,
      },
      select: userSelect,
    });

    return actionSuccess(toManagedUser(user));
  } catch (error) {
    return actionFailure(mapUserWriteError(error));
  }
}

export async function updateUser(
  actorUserId: string,
  input: unknown,
): Promise<ActionResult<ManagedUser>> {
  const parsed = updateUserSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  if (parsed.data.id === actorUserId && !parsed.data.isActive) {
    return actionFailure({
      code: "CONFLICT",
      message: "You cannot deactivate your own account.",
    });
  }

  try {
    const user = await withSerializableTransaction(async (transaction) => {
      const existing = await transaction.user.findUnique({
        where: { id: parsed.data.id },
        select: {
          id: true,
          role: true,
          isActive: true,
        },
      });

      if (!existing) {
        throw new Error("USER_NOT_FOUND");
      }

      const removesActiveAdmin =
        existing.role === "ADMIN" &&
        existing.isActive &&
        (parsed.data.role !== "ADMIN" || !parsed.data.isActive);

      if (removesActiveAdmin) {
        const activeAdmins = await transaction.user.count({
          where: {
            role: "ADMIN",
            isActive: true,
          },
        });

        if (activeAdmins <= 1) {
          throw new Error("LAST_ADMIN");
        }
      }

      return transaction.user.update({
        where: { id: parsed.data.id },
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          role: parsed.data.role,
          isActive: parsed.data.isActive,
          sessions: parsed.data.isActive
            ? undefined
            : {
                deleteMany: {},
              },
        },
        select: userSelect,
      });
    });

    return actionSuccess(toManagedUser(user));
  } catch (error) {
    if (error instanceof Error && error.message === "USER_NOT_FOUND") {
      return actionFailure({
        code: "NOT_FOUND",
        message: "The user no longer exists.",
      });
    }

    if (error instanceof Error && error.message === "LAST_ADMIN") {
      return actionFailure({
        code: "CONFLICT",
        message: "At least one active administrator is required.",
      });
    }

    return actionFailure(mapUserWriteError(error));
  }
}

export async function resetUserPassword(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = resetUserPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const passwordHash = await hashPassword(parsed.data.password);

    await withSerializableTransaction(async (transaction) => {
      await transaction.user.update({
        where: { id: parsed.data.id },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
      });

      await transaction.session.deleteMany({
        where: { userId: parsed.data.id },
      });
    });

    return actionSuccess({ id: parsed.data.id });
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}
