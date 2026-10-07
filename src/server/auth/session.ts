import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type UserRoleValue,
} from "@/lib/auth/constants";
import {
  actionFailure,
  actionSuccess,
  type ActionResult,
} from "@/lib/action-result";
import { prisma } from "@/lib/prisma";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionUserSelect() {
  return {
    id: true,
    name: true,
    email: true,
    role: true,
    isActive: true,
  } as const;
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await prisma.session.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: {
        tokenHash: hashSessionToken(token),
      },
    });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token),
    },
    select: {
      expiresAt: true,
      user: {
        select: sessionUserSelect(),
      },
    },
  });

  if (
    !session ||
    session.expiresAt <= new Date() ||
    !session.user.isActive
  ) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as UserRoleValue,
  };
}

export async function requirePageUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePageRole(...roles: UserRoleValue[]) {
  const user = await requirePageUser();

  if (!roles.includes(user.role)) {
    redirect("/");
  }

  return user;
}

export async function authorizeAction(
  roles?: UserRoleValue[],
): Promise<ActionResult<AuthUser>> {
  const user = await getCurrentUser();

  if (!user) {
    return actionFailure({
      code: "UNAUTHORIZED",
      message: "Your session has expired. Sign in again.",
    });
  }

  if (roles && !roles.includes(user.role)) {
    return actionFailure({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }

  return actionSuccess(user);
}
