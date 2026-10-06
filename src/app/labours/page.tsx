import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CreateLabourButton } from "@/features/labours/create-labour-button";
import { LabourActions } from "@/features/labours/labour-actions";
import { cn } from "@/lib/utils";
import type { LabourSortField, SortOrder } from "@/lib/validation/query";
import { loadLaboursPage } from "@/server/services/read-models";

type SearchParams = Record<string, string | string[] | undefined>;

function labourListHref({
  search,
  designation,
  page,
  pageSize,
  sort,
  order,
}: {
  search?: string;
  designation?: string;
  page: number;
  pageSize: number;
  sort: LabourSortField;
  order: SortOrder;
}) {
  const params = new URLSearchParams();

  if (search) {
    params.set("search", search);
  }

  if (designation) {
    params.set("designation", designation);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  if (pageSize !== 25) {
    params.set("pageSize", String(pageSize));
  }

  if (sort !== "employeeName") {
    params.set("sort", sort);
  }

  if (order !== "asc") {
    params.set("order", order);
  }

  const query = params.toString();
  return query ? `/labours?${query}` : "/labours";
}

function SortHeader({
  label,
  field,
  currentSort,
  currentOrder,
  search,
  designation,
  pageSize,
}: {
  label: string;
  field: LabourSortField;
  currentSort: LabourSortField;
  currentOrder: SortOrder;
  search?: string;
  designation?: string;
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
      href={labourListHref({
        search,
        designation,
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

export default async function LaboursPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const rawSearchParams = await searchParams;
  const result = await loadLaboursPage(rawSearchParams);

  if (!result.ok) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Labours"
          description="Manage employees and designations used by daily schedules."
          actions={<CreateLabourButton />}
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
        title="Labours"
        description="Manage employees and designations used by daily schedules."
        actions={<CreateLabourButton />}
      />

      <div className="space-y-3">
        <form
          method="get"
          className="flex flex-col gap-2 lg:flex-row lg:items-center"
        >
          <div className="relative w-full max-w-lg">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              name="search"
              defaultValue={data.search}
              placeholder="Search employee ID, name, or designation..."
              className="pl-9"
            />
          </div>

          <NativeSelect
            name="designation"
            defaultValue={data.designation ?? ""}
            className="w-full lg:w-52"
            aria-label="Filter by designation"
          >
            <option value="">All designations</option>
            {data.designations.map((designation) => (
              <option key={designation} value={designation}>
                {designation}
              </option>
            ))}
          </NativeSelect>

          <input type="hidden" name="sort" value={data.sort} />
          <input type="hidden" name="order" value={data.order} />
          {data.pageSize !== 25 ? (
            <input type="hidden" name="pageSize" value={data.pageSize} />
          ) : null}

          <Button type="submit" variant="outline">
            Apply
          </Button>

          {data.search || data.designation ? (
            <Link
              href={labourListHref({
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
                    label="Employee ID"
                    field="employeeId"
                    currentSort={data.sort}
                    currentOrder={data.order}
                    search={data.search}
                    designation={data.designation}
                    pageSize={data.pageSize}
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Employee Name"
                    field="employeeName"
                    currentSort={data.sort}
                    currentOrder={data.order}
                    search={data.search}
                    designation={data.designation}
                    pageSize={data.pageSize}
                  />
                </TableHead>
                <TableHead>
                  <SortHeader
                    label="Designation"
                    field="designation"
                    currentSort={data.sort}
                    currentOrder={data.order}
                    search={data.search}
                    designation={data.designation}
                    pageSize={data.pageSize}
                  />
                </TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="w-24 text-right">Usage</TableHead>
                <TableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {data.items.length > 0 ? (
                data.items.map((labour) => {
                  const usageCount =
                    labour._count.foremanSchedules +
                    labour._count.driverSchedules +
                    labour._count.scheduleAssignments;

                  return (
                    <TableRow key={labour.employeeId}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/labours/${encodeURIComponent(labour.employeeId)}`}
                          className="hover:underline"
                        >
                          {labour.employeeId}
                        </Link>
                      </TableCell>
                      <TableCell>{labour.employeeName}</TableCell>
                      <TableCell>{labour.designation}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {labour.mobileNumber ?? "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {usageCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <LabourActions
                          labour={{
                            employeeId: labour.employeeId,
                            employeeName: labour.employeeName,
                            designation: labour.designation,
                            mobileNumber: labour.mobileNumber,
                            usageCount,
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={6} className="h-40 text-center">
                    <p className="text-sm font-medium">
                      {data.search || data.designation
                        ? "No employees found"
                        : "No employees yet"}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {data.search || data.designation
                        ? "Change the search or designation filter and try again."
                        : "Add the first employee to start assigning resources."}
                    </p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-3 border-t px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data.total} {data.total === 1 ? "employee" : "employees"}
            </p>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Page {data.page} of {totalPages}
              </span>

              {data.page > 1 ? (
                <Link
                  href={labourListHref({
                    search: data.search,
                    designation: data.designation,
                    page: data.page - 1,
                    pageSize: data.pageSize,
                    sort: data.sort,
                    order: data.order,
                  })}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
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
                  href={labourListHref({
                    search: data.search,
                    designation: data.designation,
                    page: data.page + 1,
                    pageSize: data.pageSize,
                    sort: data.sort,
                    order: data.order,
                  })}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                  )}
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
