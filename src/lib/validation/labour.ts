import { z } from "zod";

import { optionalText, requiredText } from "@/lib/validation/common";

export const employeeIdSchema = requiredText("Employee ID", 50);

export const labourKeySchema = z.object({
  employeeId: employeeIdSchema,
});

export const labourInputSchema = z.object({
  employeeId: employeeIdSchema,
  employeeName: requiredText("Employee name", 150),
  designation: requiredText("Designation", 100),
  mobileNumber: optionalText(30),
});

export type LabourKey = z.infer<typeof labourKeySchema>;
export type LabourInput = z.infer<typeof labourInputSchema>;
