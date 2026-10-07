"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { resetUserPasswordAction } from "@/app/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);

    const form = event.currentTarget;
    const result = await resetUserPasswordAction(
      userId,
      new FormData(form),
    );

    setPending(false);

    if (!result.ok) {
      toast.error(result.error.message);
      return;
    }

    form.reset();
    toast.success("Password reset. Existing sessions were signed out.");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="w-full max-w-md space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          New password
        </label>
        <Input
          id="password"
          name="password"
          type="password"
          minLength={12}
          maxLength={128}
          autoComplete="new-password"
          required
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Resetting..." : "Reset password"}
      </Button>
    </form>
  );
}
