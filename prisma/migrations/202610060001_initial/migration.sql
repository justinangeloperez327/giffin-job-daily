CREATE TABLE "projects" (
    "project_name" TEXT NOT NULL,
    "job_no" TEXT NOT NULL,
    "so_no" TEXT NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("job_no")
);

CREATE TABLE "labours" (
    "employee_id" TEXT NOT NULL,
    "employee_name" TEXT NOT NULL,
    "designation" TEXT NOT NULL,

    CONSTRAINT "labours_pkey" PRIMARY KEY ("employee_id")
);

CREATE TABLE "daily_schedules" (
    "schedule_date" DATE NOT NULL,
    "project_job_no" TEXT NOT NULL,
    "foreman_employee_id" TEXT NOT NULL,

    CONSTRAINT "daily_schedules_pkey" PRIMARY KEY ("schedule_date", "project_job_no")
);

CREATE TABLE "daily_schedules_labours" (
    "daily_schedules_schedule_date" DATE NOT NULL,
    "daily_schedules_project_job_no" TEXT NOT NULL,
    "labour_employee_id" TEXT NOT NULL,

    CONSTRAINT "daily_schedules_labours_pkey" PRIMARY KEY (
        "daily_schedules_schedule_date",
        "daily_schedules_project_job_no",
        "labour_employee_id"
    )
);

CREATE INDEX "daily_schedules_project_job_no_idx"
ON "daily_schedules"("project_job_no");

CREATE INDEX "daily_schedules_foreman_employee_id_idx"
ON "daily_schedules"("foreman_employee_id");

CREATE INDEX "daily_schedules_labours_labour_employee_id_idx"
ON "daily_schedules_labours"("labour_employee_id");

ALTER TABLE "daily_schedules"
ADD CONSTRAINT "daily_schedules_project_job_no_fkey"
FOREIGN KEY ("project_job_no")
REFERENCES "projects"("job_no")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "daily_schedules"
ADD CONSTRAINT "daily_schedules_foreman_employee_id_fkey"
FOREIGN KEY ("foreman_employee_id")
REFERENCES "labours"("employee_id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "daily_schedules_labours"
ADD CONSTRAINT "daily_schedules_labours_schedule_fkey"
FOREIGN KEY (
    "daily_schedules_schedule_date",
    "daily_schedules_project_job_no"
)
REFERENCES "daily_schedules"("schedule_date", "project_job_no")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "daily_schedules_labours"
ADD CONSTRAINT "daily_schedules_labours_labour_employee_id_fkey"
FOREIGN KEY ("labour_employee_id")
REFERENCES "labours"("employee_id")
ON DELETE RESTRICT
ON UPDATE CASCADE;
