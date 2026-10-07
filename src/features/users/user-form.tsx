"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import {
  createUserAction,
  updateUserAction,
} from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { UserRoleValue } from "@/lib/auth/constants";

type EditableUser = {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  isActive: boolean;
};

export function UserForm({ user }: { user?: EditableUser }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setFieldErrors({});

    const formData = new FormData(event.currentTarget);
    const result = user
      ? await updateUserAction(user.id, formData)
      : await createUserAction(formData);

    setPending(false);

    if (!result.ok) {
      setFieldErrors(result.error.fieldErrors ?? {});
      toast.error(result.error.message);
      return;
    }

    toast.success(user ? "User updated." : "User created.");
    router.push("/users");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="name" className="text-sm font-medium">
          Name
        </label>
        <Input
          id="name"
          name="name"
          defaultValue={user?.name}
          required
          maxLength={120}
          aria-invalid={Boolean(fieldErrors.name)}
        />
        {fieldErrors.name?.[0] ? (
          <p className="text-xs text-destructive">{fieldErrors.name[0]}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={user?.email}
          required
          maxLength={254}
          aria-invalid={Boolean(fieldErrors.email)}
        />
        {fieldErrors.email?.[0] ? (
          <p className="text-xs text-destructive">{fieldErrors.email[0]}</p>
        ) : null}
      </div>

      {!user ? (
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            Temporary password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            minLength={12}
            maxLength={128}
            required
            autoComplete="new-password"
            aria-invalid={Boolean(fieldErrors.password)}
          />
          <p className="text-xs text-muted-foreground">
            Minimum 12 characters. Send it to the user through a secure channel.
          </p>
          {fieldErrors.password?.[0] ? (
            <p className="text-xs text-destructive">
              {fieldErrors.password[0]}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <NativeSelect
            id="role"
            name="role"
            defaultValue={user?.role ?? "VIEWER"}
          >
            <option value="ADMIN">Administrator</option>
            <option value="PLANNER">Planner</option>
            <option value="VIEWER">Viewer</option>
          </NativeSelect>
        </div>

        {user ? (
          <div className="space-y-1.5">
            <label htmlFor="status" className="text-sm font-medium">
              Status
            </label>
            <NativeSelect
              id="status"
              name="status"
              defaultValue={user.isActive ? "active" : "inactive"}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </NativeSelect>
          </div>
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/users")}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : user ? "Save changes" : "Create user"}
        </Button>
      </div>
    </form>
  );
}
