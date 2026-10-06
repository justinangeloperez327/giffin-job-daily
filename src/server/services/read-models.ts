import {
  actionFailure,
  actionSuccess,
  type ActionResult,
  validationFailure,
} from "@/lib/action-result";
import { labourKeySchema } from "@/lib/validation/labour";
import { projectKeySchema } from "@/lib/validation/project";
import {
  labourListQuerySchema,
  projectListQuerySchema,
  resourceAvailabilityQuerySchema,
  scheduleDayQuerySchema,
} from "@/lib/validation/query";
import { mapDatabaseError } from "@/server/database/errors";
import {
  countLabours,
  countProjects,
  getLabourDetailByEmployeeId,
  getProjectDetailByJobNo,
  listDailySchedulesByDate,
  listLabourDesignations,
  listLabours,
  listProjectOptions,
  listProjects,
} from "@/server/repositories";
import { getResourceAvailability } from "@/server/services/availability";

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export type ProjectsPageResult = PaginatedResult<
  Awaited<ReturnType<typeof listProjects>>[number]
> & {
  search?: string;
  sort: "projectName" | "jobNo" | "soNo";
  order: "asc" | "desc";
};

export type LaboursPageResult = PaginatedResult<
  Awaited<ReturnType<typeof listLabours>>[number]
> & {
  search?: string;
  designation?: string;
  designations: string[];
  sort: "employeeName" | "employeeId" | "designation";
  order: "asc" | "desc";
};

function pageCount(total: number, pageSize: number) {
  return total === 0 ? 0 : Math.ceil(total / pageSize);
}

export async function loadProjectsPage(
  input: unknown = {},
): Promise<ActionResult<ProjectsPageResult>> {
  const parsed = projectListQuerySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { search, page, pageSize, sort, order } = parsed.data;

  try {
    const total = await countProjects(search);
    const totalPages = pageCount(total, pageSize);
    const normalizedPage =
      totalPages === 0 ? 1 : Math.min(page, totalPages);
    const skip = (normalizedPage - 1) * pageSize;
    const items = await listProjects({
      search,
      skip,
      take: pageSize,
      sort,
      order,
    });

    return actionSuccess({
      items,
      total,
      page: normalizedPage,
      pageSize,
      pageCount: totalPages,
      search,
      sort,
      order,
    });
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function loadProjectOptions() {
  try {
    return actionSuccess(await listProjectOptions());
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function loadProjectDetail(input: unknown) {
  const parsed = projectKeySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const project = await getProjectDetailByJobNo(parsed.data.jobNo);

    if (!project) {
      return actionFailure({
        code: "NOT_FOUND",
        message: "The requested project could not be found.",
      });
    }

    return actionSuccess(project);
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function loadLaboursPage(
  input: unknown = {},
): Promise<ActionResult<LaboursPageResult>> {
  const parsed = labourListQuerySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  const { search, designation, page, pageSize, sort, order } = parsed.data;

  try {
    const [total, designations] = await Promise.all([
      countLabours({ search, designation }),
      listLabourDesignations(),
    ]);
    const totalPages = pageCount(total, pageSize);
    const normalizedPage =
      totalPages === 0 ? 1 : Math.min(page, totalPages);
    const skip = (normalizedPage - 1) * pageSize;
    const items = await listLabours({
      search,
      designation,
      skip,
      take: pageSize,
      sort,
      order,
    });

    return actionSuccess({
      items,
      total,
      page: normalizedPage,
      pageSize,
      pageCount: totalPages,
      search,
      designation,
      designations,
      sort,
      order,
    });
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function loadLabourDetail(input: unknown) {
  const parsed = labourKeySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    const labour = await getLabourDetailByEmployeeId(parsed.data.employeeId);

    if (!labour) {
      return actionFailure({
        code: "NOT_FOUND",
        message: "The requested employee could not be found.",
      });
    }

    return actionSuccess(labour);
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function loadScheduleDay(
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof listDailySchedulesByDate>>>> {
  const parsed = scheduleDayQuerySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    return actionSuccess(
      await listDailySchedulesByDate(parsed.data.scheduleDate),
    );
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}

export async function loadResourcePool(
  input: unknown,
): Promise<ActionResult<Awaited<ReturnType<typeof getResourceAvailability>>>> {
  const parsed = resourceAvailabilityQuerySchema.safeParse(input);

  if (!parsed.success) {
    return validationFailure(parsed.error);
  }

  try {
    return actionSuccess(
      await getResourceAvailability(parsed.data.scheduleDate, {
        search: parsed.data.search,
        designation: parsed.data.designation,
        currentProjectJobNo: parsed.data.currentProjectJobNo,
        take: parsed.data.take,
      }),
    );
  } catch (error) {
    return actionFailure(mapDatabaseError(error));
  }
}
