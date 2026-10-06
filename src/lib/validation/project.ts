import { z } from "zod";

import { requiredText } from "@/lib/validation/common";

export const projectInputSchema = z.object({
  projectName: requiredText("Project name", 200),
  jobNo: requiredText("Job number", 50),
  soNo: requiredText("SO number", 50),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;
