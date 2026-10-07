import { describe, expect, it } from "vitest";

import { canManageOperations } from "@/lib/auth/constants";

describe("operational permissions", () => {
  it("allows administrators and planners to manage operations", () => {
    expect(canManageOperations("ADMIN")).toBe(true);
    expect(canManageOperations("PLANNER")).toBe(true);
  });

  it("keeps viewer access read-only", () => {
    expect(canManageOperations("VIEWER")).toBe(false);
  });
});
