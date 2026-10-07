"use server";

import { revalidatePath } from "next/cache";

import { authorizeAction } from "@/server/auth/session";
import {
  createUser,
  resetUserPassword,
  updateUser,
} from "@/server/services/users";

function createUserInput(formData: FormData) {
  return {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  };
}

export async function createUserAction(formData: FormData) {
  const auth = await authorizeAction(["ADMIN"]);

  if (!auth.ok) {
    return auth;
  }

  const result = await createUser(createUserInput(formData));

  if (result.ok) {
    revalidatePath("/users");
  }

  return result;
}

export async function updateUserAction(id: string, formData: FormData) {
  const auth = await authorizeAction(["ADMIN"]);

  if (!auth.ok) {
    return auth;
  }

  const result = await updateUser(auth.data.id, {
    id,
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    isActive: formData.get("status") === "active",
  });

  if (result.ok) {
    revalidatePath("/users");
    revalidatePath(`/users/${encodeURIComponent(id)}`);
  }

  return result;
}

export async function resetUserPasswordAction(
  id: string,
  formData: FormData,
) {
  const auth = await authorizeAction(["ADMIN"]);

  if (!auth.ok) {
    return auth;
  }

  const result = await resetUserPassword({
    id,
    password: formData.get("password"),
  });

  if (result.ok) {
    revalidatePath(`/users/${encodeURIComponent(id)}`);
  }

  return result;
}
