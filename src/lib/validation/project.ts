import { z } from "zod";

import { requiredText } from "@/lib/validation/common";

export const projectJobNoSchema = requiredText("Job number", 50);

export const projectKeySchema = z.object({
  jobNo: projectJobNoSchema,
});

export const projectInputSchema = z.object({
  projectName: requiredText("Project name", 200),
  jobNo: projectJobNoSchema,
  soNo: requiredText("SO number", 50),
});

export type ProjectKey = z.infer<typeof projectKeySchema>;
export type ProjectInput = z.infer<typeof projectInputSchema>;
