import "server-only";

import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  validationFailure,
} from "@/lib/action-result";
import type { UserRoleValue } from "@/lib/auth/constants";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/user";
import { verifyPassword } from "@/server/auth/password";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$ABEiM0RVZneImaq7zN3u_w$X4fBpWbRutnO330NTAPjpMqOvH5TwnWYp8DtcfAPwyNVNc7YR0jAipxYWuX7FIVaGYwp7zDDmxXgq9JWsZEvNQ";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
};

function invalidCredentials<T = never>(): ActionResult<T> {
  return actionFailure({
    code: "UNAUTHORIZED",
    message: "Email or password is incorrect.",
  });
}

export async function authenticateUser(
  input: unknown,
): Promise<ActionResult<AuthenticatedUser>> {
  const parsed = loginSchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const user = await prisma.user.findUnique({
    where: {
      email: parsed.data.email,
    },
  });

  if (!user) {
    await verifyPassword(parsed.data.password, DUMMY_PASSWORD_HASH);
    return invalidCredentials();
  }

  const now = new Date();
  const activeLock = user.lockedUntil && user.lockedUntil > now;

  if (activeLock) {
    await verifyPassword(parsed.data.password, user.passwordHash);
    return invalidCredentials();
  }

  const passwordValid = await verifyPassword(
    parsed.data.password,
    user.passwordHash,
  );

  if (!passwordValid || !user.isActive) {
    const failures =
      user.lockedUntil && user.lockedUntil <= now
        ? 1
        : user.failedLoginAttempts + 1;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: failures,
        lockedUntil:
          failures >= MAX_FAILED_ATTEMPTS
            ? new Date(now.getTime() + LOCK_MINUTES * 60 * 1000)
            : null,
      },
    });

    return invalidCredentials();
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: now,
    },
  });

  return actionSuccess({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRoleValue,
  });
}
