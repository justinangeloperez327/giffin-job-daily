import { describe, expect, it } from "vitest";

import {
  createUserSchema,
  loginSchema,
  updateUserSchema,
} from "@/lib/validation/user";

describe("user validation", () => {
  it("normalizes login email addresses", () => {
    const result = loginSchema.parse({
      email: "  ADMIN@Example.COM  ",
      password: "not-empty",
    });

    expect(result.email).toBe("admin@example.com");
  });

  it("requires strong initial passwords", () => {
    const result = createUserSchema.safeParse({
      name: "Planner",
      email: "planner@example.com",
      password: "short",
      role: "PLANNER",
    });

    expect(result.success).toBe(false);
  });

  it("accepts supported operational roles", () => {
    for (const role of ["ADMIN", "PLANNER", "VIEWER"] as const) {
      const result = createUserSchema.safeParse({
        name: "User",
        email: `${role.toLowerCase()}@example.com`,
        password: "a-secure-password",
        role,
      });

      expect(result.success).toBe(true);
    }
  });

  it("validates editable user state", () => {
    const result = updateUserSchema.safeParse({
      id: "9dfca304-f44a-4470-9f67-c93051fbd968",
      name: "Viewer",
      email: "viewer@example.com",
      role: "VIEWER",
      isActive: false,
    });

    expect(result.success).toBe(true);
  });
});
