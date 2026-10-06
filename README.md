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

Initial tables:

- `projects`
  - `project_name`
  - `job_no` — primary key
  - `so_no`
- `labours`
  - `employee_id` — primary key
  - `employee_name`
  - `designation`
- `daily_schedules`
  - `schedule_date`
  - `project_job_no`
  - `foreman_employee_id`
  - composite primary key: `schedule_date + project_job_no`
- `daily_schedules_labours`
  - `daily_schedules_schedule_date`
  - `daily_schedules_project_job_no`
  - `labour_employee_id`

The schedule-to-labour table includes the project job number because a single date can contain schedules for multiple projects.

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

5. Apply the database migration:

   ```bash
   npm run db:deploy
   ```

6. Start development:

   ```bash
   npm run dev
   ```

## Prisma

Prisma 7.10 uses `prisma7.config.ts` for the datasource configuration and generates the client into `src/generated/prisma`.

More fields can be added to `daily_schedules` later without changing the current relationship design.
