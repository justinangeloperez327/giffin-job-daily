# Giffin Job Daily

Daily project and labour scheduling application built with Next.js, TypeScript, shadcn/ui, Prisma, and PostgreSQL.

## Stack

- Next.js 16.3.8
- React 19.3.0
- TypeScript 7.0.0
- shadcn 4.21.1
- Tailwind CSS 4.3.3
- Prisma ORM 7.10.0
- PostgreSQL 18
- Zod 4.6.5
- Vitest 5.0.3

## Database

### `projects`

- `project_name`
- `job_no` — primary key
- `so_no`

### `labours`

- `employee_id` — primary key
- `employee_name`
- `designation`
- `mobile_number` — optional

The same employee table is used for foremen, drivers, and labour resources. Designation is descriptive rather than a database enum so operational designations can evolve without a schema migration.

### `daily_schedules`

- `schedule_date`
- `project_job_no`
- `foreman_employee_id`
- `camp_start_time`
- `start_time`
- `end_time`
- `daily_target`
- `driver_employee_id`
- `equipment_vehicle`

The primary key is:

```text
schedule_date + project_job_no
```

This permits several projects on the same day while allowing only one schedule per project per date.

The database also prevents the same foreman from being assigned to more than one project on the same date.

Timing fields, daily target, driver, and equipment/vehicle are nullable at the database layer so schedules can be built incrementally and existing installations can apply the migration safely. Application validation enforces workflow rules before writes.

Timing constraints enforce:

```text
camp_start_time <= start_time
start_time < end_time
```

when the relevant values are present.

### `daily_schedules_labours`

- `daily_schedules_schedule_date`
- `daily_schedules_project_job_no`
- `labour_employee_id`

The composite primary key is:

```text
schedule_date + project_job_no + employee_id
```

A second unique constraint on:

```text
schedule_date + employee_id
```

prevents the same labour employee from being allocated to two projects on the same date.

### Scheduling rules

Database-enforced rules:

- One schedule per project per date.
- One foreman assignment per employee per date.
- One labour assignment per employee per date.
- Project, foreman, driver, and labour references must point to existing records.
- Referenced projects and employees cannot be deleted accidentally.
- Deleting a schedule removes its labour assignment rows.
- Camp start cannot be later than work start when both are provided.
- Work start must be earlier than work end when both are provided.

Application validation additionally prevents cross-role conflicts so an employee cannot be assigned simultaneously as foreman, labour, or driver on different projects for the same date.

## Application modules

### Projects

The Projects module provides:

- searchable, sortable, paginated project listing
- add and edit workflows
- protected deletion when schedule history exists
- project detail view
- recent schedule history
- schedule counts for operational visibility

Changing a job number updates related schedule references through the configured database cascade.

### Labours

The Labours module provides:

- search by employee ID, employee name, or designation
- designation filtering
- sortable, paginated employee listing
- add and edit workflows
- optional mobile number
- protected deletion when the employee is referenced by a schedule
- employee detail view
- separate foreman, labour, and driver assignment history
- assignment usage counts

Changing an employee ID updates related schedule references through the configured database cascade.

### Daily Schedule

The Daily Schedule workspace provides:

- previous/next day navigation
- native date selection and Today navigation
- configurable business timezone through `APP_TIME_ZONE`
- saved and draft schedule rows for the selected date
- searchable project selection by project name, job number, or SO number
- duplicate-project prevention across saved and draft rows
- direct foreman selection plus the right-side Foremen resource pool
- searchable/filterable Labour resource pool with checkbox multi-select
- bulk labour assignment, individual removal, and saved-project reassignment
- same-day and cross-role resource conflict prevention
- inline Camp Start, Start, and End time editing
- inline Daily Target editing
- timing validation before save
- dirty-row tracking for saved schedules
- unsaved-change protection for browser unload, internal navigation, and date changes
- persisted schedule-row deletion
- sticky desktop resource pool and mobile resource-pool sheet
- empty-day state, loading skeleton, and daily resource summary

Timing rules are enforced in both the editor and server validation:

```text
camp_start_time <= start_time
start_time < end_time
```

All timing fields remain optional. Clearing a time input saves it as `NULL`. Daily Target is optional and limited to 5,000 characters.

Draft schedules can be saved once each row has a Project and Foreman. Labour, timing, and Daily Target can be added before the first save or edited later. Existing saved-row timing and Daily Target edits remain local until **Save Schedule** is pressed, and they participate in the same unsaved-change protection as new draft rows.

Foreman and labour resource changes on already-saved rows are persisted immediately through the existing transaction-safe server actions. Dirty timing/target edits on the same row are preserved across those same-day refreshes until explicitly saved or discarded.

## Shared data layer

The server-side data layer is organized into:

```text
src/server/database
src/server/repositories
src/server/services
src/lib/validation
```

Repositories provide reusable read queries for projects, labours, schedules, and schedule labour assignments.

The availability service returns each employee's same-day assignments, whether those assignments block selection, and whether the employee is already assigned to the schedule currently being edited. Assignments on the current project therefore remain selectable while assignments on another project remain blocked.

Resource-conflict evaluation is centralized and shared by schedule writes and future UI/API preflight checks.

Schedule writes use a serializable Prisma transaction. A save:

1. Validates the complete payload with Zod.
2. Confirms the project and employees exist.
3. Checks same-day foreman, labour, and driver conflicts.
4. Upserts the schedule.
5. Replaces its labour assignments atomically.
6. Reloads and returns the complete saved schedule.

Serialization conflicts are retried up to three times with a short backoff. Prisma/database failures are mapped to a consistent application error structure.

The Prisma entry point is marked `server-only` so database code cannot accidentally be imported into Client Components.

## Testing

Run the shared business-rule test suite with:

```bash
npm test
```

Current unit coverage includes:

- schedule date and time parsing
- business-timezone schedule dates
- schedule-date shifting
- project validation
- labour validation
- list-query normalization and sorting inputs
- duplicate labour validation
- foreman/labour role conflicts
- driver/foreman and driver/labour conflicts
- timing validation
- resource conflict mapping and lookup
- foreman availability including draft labour conflicts
- labour availability and draft-to-draft conflicts
- labour reassignment input validation
- timing editor normalization and ordering rules

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your PostgreSQL connection string.
3. Set `APP_TIME_ZONE` to the timezone used for daily schedule dates. The default application configuration is `Asia/Dubai`.
4. Install dependencies:

   ```bash
   npm install
   ```

5. Generate Prisma Client:

   ```bash
   npm run db:generate
   ```

6. Apply the database migrations:

   ```bash
   npm run db:deploy
   ```

7. Run validation checks:

   ```bash
   npm run typecheck
   npm test
   ```

8. Start development:

   ```bash
   npm run dev
   ```

## Prisma

Prisma 7.10 uses `prisma7.config.ts` for datasource configuration and generates the client into `src/generated/prisma`.

The schedule model is intentionally extensible so additional daily operational fields can be added without restructuring project and labour relationships.
