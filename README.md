# Giffin Job Daily

Daily project and labour scheduling application built with Next.js, TypeScript, shadcn/ui, Prisma, and PostgreSQL.

## Stack

- Next.js 16.3.8
- React 19.3.0
- TypeScript 7.0.2 compiler with TypeScript 6.0.2 compatibility API for ESLint
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
- Excel `.xlsx` bulk import for the project master list

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
- Excel `.xlsx` bulk import for the labour master list

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
- expandable Logistics editor under each schedule row
- Driver selection from the existing employee table
- derived Driver Name and Driver Mobile from the selected employee
- Equipment / Vehicle entry
- driver same-day and cross-role conflict prevention
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

Draft schedules can be saved once each row has a Project and Foreman. Labour, timing, Daily Target, Driver, and Equipment / Vehicle can be added before the first save or edited later.

Logistics is intentionally expandable below the five-column planning row rather than consuming permanent horizontal space. Driver Name and Driver Mobile are read from the selected employee record and are not duplicated into `daily_schedules`.

Existing saved-row timing, Daily Target, Driver, and Equipment / Vehicle edits remain local until **Save Schedule** is pressed, and they participate in the same unsaved-change protection as new draft rows.

Foreman and labour resource changes on already-saved rows are persisted immediately through the existing transaction-safe server actions. Dirty timing/target/logistics edits on the same row are preserved across same-day refreshes until explicitly saved or discarded.

### Excel master-data import

Administrators and Planners can bulk import master data from the Projects and Labours pages.

Project workbooks use the first worksheet and require:

```text
Project Name | Job No | SO No
```

Labour workbooks require:

```text
Employee ID | Employee Name | Designation | Mobile Number
```

`Mobile Number` is optional. Common case, spacing, and underscore variations are accepted for headers. The header row may appear within the first 20 rows.

Imports accept `.xlsx` files up to 5 MB and 2,000 data rows. The full workbook is validated before any write occurs. Duplicate Employee IDs or Job Nos inside the workbook stop the import. Once validation passes, matching Employee IDs or Job Nos are updated and new records are created in one transaction.

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
- driver availability and same-day assignment conflicts
- driver conflicts with draft foreman and labour selections

## Authentication and user management

The application uses internal accounts. Public registration is intentionally disabled.

### Roles

- **ADMIN** — full operational access plus user management.
- **PLANNER** — can manage projects, labour records, and daily schedules.
- **VIEWER** — read-only access to the dashboard, projects, labours, and daily schedules.

All write actions enforce roles on the server. The UI also removes operational write controls for Viewer accounts. User management routes require an Administrator session.

### Sessions and password security

- Passwords are hashed with Node.js `scrypt` using a per-password random salt.
- Session tokens are random 256-bit values.
- Only a SHA-256 hash of each session token is stored in PostgreSQL.
- Session cookies are HttpOnly, SameSite=Lax, and Secure in production.
- Sessions expire after seven days.
- Five failed sign-in attempts lock the account for 15 minutes.
- Resetting a password revokes all existing sessions for that user.
- Deactivating a user revokes that user's existing sessions.
- The application prevents deactivating your own account and prevents removing the final active Administrator.

Next.js `proxy.ts` performs only an optimistic cookie-presence redirect. The protected application layout validates the database session, and every Server Action performs its own authorization check.

### Create the first Administrator

Apply the database migrations first, then bootstrap the first Administrator from a trusted machine connected to the target database.

PowerShell example:

```powershell
$env:DATABASE_URL="<production-postgres-url>"
$env:ADMIN_NAME="Justin Perez"
$env:ADMIN_EMAIL="you@example.com"
$env:ADMIN_PASSWORD="<strong-password-at-least-12-characters>"
npm run user:create-admin
```

The bootstrap is idempotent: when no **active Administrator** exists, a Vercel production build creates one from `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. Once an active Administrator exists, later deployments skip the bootstrap without changing credentials.

The bootstrap never promotes, reactivates, or overwrites an existing user. If `ADMIN_EMAIL` already belongs to another account while no active Administrator exists, deployment stops with a clear error so the account can be recovered deliberately rather than modified implicitly.

After the first Administrator signs in, create all additional accounts from **Users → Add User**. You can then remove `ADMIN_PASSWORD` from Vercel if you do not want the bootstrap secret retained; existing database users are unaffected.

Do not commit administrator credentials to `.env.example`, source control, or deployment configuration.

## Production readiness

The application includes:

- internal login and database-backed session authentication
- role-based access control for Administrator, Planner, and Viewer
- administrator-only user management
- live operational dashboard backed by the current schedule date
- explicit dynamic rendering for database-backed pages
- `/api/health` database readiness endpoint
- standalone Next.js production output
- removal of the `X-Powered-By` response header
- baseline content-type, framing, referrer, and browser-permission headers
- explicit `DATABASE_URL` startup validation
- GitHub Actions CI with PostgreSQL 18
- TypeScript 7 compiler running side-by-side with the TypeScript 6 compatibility API required by current ESLint tooling
- Prisma schema validation and migration deployment in CI
- lint, TypeScript, unit-test, and production-build gates

Run the full local quality gate with:

```bash
npm run check
```

The health endpoint returns `200` with `{"status":"ok"}` when PostgreSQL is reachable and `503` with `{"status":"unavailable"}` when database readiness fails. It does not expose database error details.

## Deploying to Vercel

The repository is configured for Vercel + Prisma Postgres.

### Vercel project setup

1. Import this GitHub repository into Vercel.
2. Add **Prisma Postgres** from the Vercel Marketplace and connect it to the project.
3. Confirm that Vercel created the `DATABASE_URL` environment variable.
4. Add:

   ```text
   APP_TIME_ZONE=Asia/Dubai
   ```

5. Deploy the `main` branch.

The repository pins Node.js to `24.x` so Vercel, CI, and local development use the current Vercel-supported LTS major.

### Prisma generation and migrations

`postinstall` runs:

```bash
prisma generate
```

on every Vercel dependency installation.

Vercel uses the repository's `vercel.json`, which runs:

```bash
npm run vercel-build
```

The Vercel build script behaves differently by environment:

- **Production:** runs `prisma migrate deploy`, regenerates Prisma Client, then runs `next build`.
- **Preview:** skips database migrations by default, regenerates Prisma Client, then runs `next build`.
- **Local/non-Vercel:** skips production migrations.

This prevents an ordinary preview deployment from applying schema changes to a production database.

If you later configure a dedicated Preview database, set:

```text
VERCEL_MIGRATE_PREVIEW=1
```

for the Preview environment only. Preview deployments will then apply pending migrations to that Preview database.

Do not set `VERCEL_MIGRATE_PREVIEW=1` while Preview and Production share the same database.

### Deployment verification

After deployment, verify:

```text
/api/health
```

A healthy deployment returns HTTP `200` with:

```json
{"status":"ok"}
```

Prisma Postgres connected through the Vercel Marketplace supplies a pooled `DATABASE_URL`, so no separate connection-pool service is required.

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

Prisma 7.10+ uses `prisma7.config.ts` for Prisma 7 configuration and generates the client into `src/generated/prisma`. This filename is intentional for Prisma 7.10+ compatibility with the newer Prisma 8 config format.

The schedule model is intentionally extensible so additional daily operational fields can be added without restructuring project and labour relationships.
