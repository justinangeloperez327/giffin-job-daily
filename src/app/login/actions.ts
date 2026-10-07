"use server";

import { redirect } from "next/navigation";

import { authenticateUser } from "@/server/auth/authenticate";
import {
  createSession,
  destroyCurrentSession,
} from "@/server/auth/session";

export type LoginState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const result = await authenticateUser({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.ok) {
    return {
      error: result.error.message,
      fieldErrors: result.error.fieldErrors,
    };
  }

  await createSession(result.data.id);
  redirect("/");
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login");
}
