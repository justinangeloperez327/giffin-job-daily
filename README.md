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

Timing fields, daily target, driver, and equipment/vehicle are nullable at the database layer so schedules can be built incrementally and existing installations can apply the migration safely. Application validation will enforce completeness where the workflow requires it.

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

The schedule-to-labour table includes the project job number because a single date can contain schedules for multiple projects.

### Scheduling rules

Database-enforced rules:

- One schedule per project per date.
- One foreman assignment per employee per date.
- One labour assignment per employee per date.
- Project, foreman, driver, and labour references must point to existing records.
- A project or employee referenced by a schedule cannot be deleted accidentally.
- Deleting a schedule removes its labour assignment rows.
- Camp start cannot be later than work start when both are provided.
- Work start must be earlier than work end when both are provided.

Application-level validation will additionally handle cross-role conflicts, including driver availability and preventing one employee from being assigned simultaneously as foreman, labour, or driver where the workflow disallows it.

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `DATABASE_URL` to your PostgreSQL connection string.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Generate Prisma Client:

   ```bash
   npm run db:generate
   ```

5. Apply the database migrations:

   ```bash
   npm run db:deploy
   ```

6. Start development:

   ```bash
   npm run dev
   ```

## Prisma

Prisma 7.10 uses `prisma7.config.ts` for datasource configuration and generates the client into `src/generated/prisma`.

The schedule model is intentionally extensible so additional daily operational fields can be added without restructuring project and labour relationships.
