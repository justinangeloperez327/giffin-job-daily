import { z } from "zod";

import { optionalText, scheduleDateSchema } from "@/lib/validation/common";

const pageSchema = z.coerce.number().int().min(1).max(100000).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(25);

export const projectSortFieldSchema = z
  .enum(["projectName", "jobNo", "soNo"])
  .default("projectName");
export const labourSortFieldSchema = z
  .enum(["employeeName", "employeeId", "designation"])
  .default("employeeName");
export const sortOrderSchema = z.enum(["asc", "desc"]).default("asc");

export const projectListQuerySchema = z.object({
  search: optionalText(200),
  page: pageSchema,
  pageSize: pageSizeSchema,
  sort: projectSortFieldSchema,
  order: sortOrderSchema,
});

export const labourListQuerySchema = z.object({
  search: optionalText(200),
  designation: optionalText(100),
  page: pageSchema,
  pageSize: pageSizeSchema,
  sort: labourSortFieldSchema,
  order: sortOrderSchema,
});

export const scheduleDayQuerySchema = z.object({
  scheduleDate: scheduleDateSchema,
});

export const resourceAvailabilityQuerySchema = z.object({
  scheduleDate: scheduleDateSchema,
  search: optionalText(200),
  designation: optionalText(100),
  currentProjectJobNo: optionalText(50),
  take: z.coerce.number().int().min(1).max(2000).default(1000),
});

export type ProjectSortField = z.infer<typeof projectSortFieldSchema>;
export type LabourSortField = z.infer<typeof labourSortFieldSchema>;
export type SortOrder = z.infer<typeof sortOrderSchema>;
export type ProjectListQuery = z.infer<typeof projectListQuerySchema>;
export type LabourListQuery = z.infer<typeof labourListQuerySchema>;
export type ScheduleDayQuery = z.infer<typeof scheduleDayQuerySchema>;
export type ResourceAvailabilityQuery = z.infer<
  typeof resourceAvailabilityQuerySchema
>;
