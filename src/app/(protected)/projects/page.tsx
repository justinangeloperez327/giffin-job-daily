import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";

import { CreateProjectButton } from "@/features/projects/create-project-button";
import { ProjectActions } from "@/features/projects/project-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { canManageOperations } from "@/lib/auth/constants";
import { cn } from "@/lib/utils";
import type { ProjectSortField, SortOrder } from "@/lib/validation/query";
import { requirePageUser } from "@/server/auth/session";
import { loadProjectsPage } from "@/server/services/read-models";

type SearchParams = Record<string, string | string[] | undefined>;

function projectListHref({
  search,
  page,
  pageSize,
  sort,
  order,
}: {
  search?: string;
  page: number;
  pageSize: number;
  sort: ProjectSortField;
  order: SortOrder;
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== 25) {
    params.set("pageSize", String(pageSize));
  }

  if (sort !== "projectName") {
    params.set("sort", sort);
  }

  if (order !== "asc") {
    params.set("order", order);
  }

  const query = params.toString();
  return query ? `/projects?${query}` : "/projects";
}

function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  search,
  pageSize,
}: {
  label: string;
  field: ProjectSortField;
  currentSort: ProjectSortField;
  currentOrder: SortOrder;
  search?: string;
  pageSize: number;
}) {
  const active = currentSort === field;
  const nextOrder = active && currentOrder === "asc" ? "desc" : "asc";
  const Icon = !active
    ? ArrowUpDown
    : currentOrder === "asc"
      ? ArrowUp
      : ArrowDown;

  return (
    <Link
      href={projectListHref({
        search,
        page: 1,
        pageSize,
        sort: field,
        order: nextOrder,
      })}
      className="inline-flex items-center gap-1.5 hover:text-foreground"
    >
      {label}
      <Icon className="size-3.5" aria-hidden="true" />
    </Link>
  );
}

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [rawSearchParams, user] = await Promise.all([
    searchParams,
    requirePageUser(),
  ]);
  const canManage = canManageOperations(user.role);
  const result = await loadProjectsPage(rawSearchParams);

  if (!result.ok) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Projects"
          description="Manage project, job number, and sales order information."
          actions={canManage ? <CreateProjectButton /> : undefined}
        />
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {result.error.message}
        </div>
      </div>
    );
  }

  const data = result.data;
  const totalPages = Math.max(data.pageCount, 1);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Projects"
        description="Manage project, job number, and sales order information."
        actions={canManage ? <CreateProjectButton /> : undefined}
      />

      <div className="space-y-3">
        <form
          method="get"
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          <div className="relative w-full max-w-lg">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="search"
              defaultValue={data.search}
              placeholder="Search project, job no, or SO no..."
              className="pl-9"
            />
          </div>
          <input type="hidden" name="sort" value={data.sort} />
          <input type="hidden" name="order" value={data.order} />
          {data.pageSize !== 25 ? (
            <input type="hidden" name="pageSize" value={data.pageSize} />
          ) : null}
          <Button type="submit" variant="outline">
            Search
          </Button>
          {data.search ? (
            <Link
              href={projectListHref({
                page: 1,
                pageSize: data.pageSize,
                sort: data.sort,
                order: data.order,
              })}
              className={buttonVariants({ variant: "ghost" })}
            >
              Clear
            </Link>
          ) : null}
        </form>

        <div className="overflow-hidden rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>
                  <SortHeader
                    label="Job No"
                    field="jobNo"
                    currentSort={data.sort}
                    currentOrder={data.order}
                    search={data.search}
                    pageSize={data.pageSize}
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="SO No"
                    field="soNo"
                    currentSort={data.sort}
                    currentOrder={data.order}
                    search={data.search}
                    pageSize={data.pageSize}
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Project Name"
                    field="projectName"
                    currentSort={data.sort}
                    currentOrder={data.order}
                    search={data.search}
                    pageSize={data.pageSize}
                  />
                </TableHead>
                <TableHead className="w-28 text-right">Schedules</TableHead>
                {canManage ? (
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.items.length > 0 ? (
                data.items.map((project) => (
                  <TableRow key={project.jobNo}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/projects/${encodeURIComponent(project.jobNo)}`}
                        className="hover:underline"
                      >
                        {project.jobNo}
                      </Link>
                    </TableCell>
                    <TableCell>{project.soNo}</TableCell>
                    <TableCell>{project.projectName}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {project._count.dailySchedules}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-right">
                        <ProjectActions
                          project={{
                            projectName: project.projectName,
                            jobNo: project.jobNo,
                            soNo: project.soNo,
                            scheduleCount: project._count.dailySchedules,
                          }}
                        />
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={canManage ? 5 : 4} className="h-40 text-center">
                    <p className="text-sm font-medium">
                      {data.search ? "No projects found" : "No projects yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {data.search
                        ? "Try a different project name, job number, or SO number."
                        : "Add the first project to start scheduling work."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data.total} {data.total === 1 ? "project" : "projects"}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {totalPages}
              </span>

              {data.page > 1 ? (
                <Link
                  href={projectListHref({
                    search: data.search,
                    page: data.page - 1,
                    pageSize: data.pageSize,
                    sort: data.sort,
                    order: data.order,
                  })}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Previous
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Previous
                </Button>
              )}

              {data.page < data.pageCount ? (
                <Link
                  href={projectListHref({
                    search: data.search,
                    page: data.page + 1,
                    pageSize: data.pageSize,
                    sort: data.sort,
                    order: data.order,
                  })}
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                >
                  Next
                </Link>
              ) : (
                <Button size="sm" variant="outline" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
