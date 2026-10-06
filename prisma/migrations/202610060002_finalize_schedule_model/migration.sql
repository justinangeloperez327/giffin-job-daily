ALTER TABLE "labours"
ADD COLUMN "mobile_number" TEXT;

ALTER TABLE "daily_schedules"
ADD COLUMN "camp_start_time" TIME(0),
ADD COLUMN "start_time" TIME(0),
ADD COLUMN "end_time" TIME(0),
ADD COLUMN "daily_target" TEXT,
ADD COLUMN "driver_employee_id" TEXT,
ADD COLUMN "equipment_vehicle" TEXT;

CREATE UNIQUE INDEX "daily_schedules_schedule_date_foreman_employee_id_key"
ON "daily_schedules"("schedule_date", "foreman_employee_id");

CREATE UNIQUE INDEX "daily_schedules_schedule_date_driver_employee_id_key"
ON "daily_schedules"("schedule_date", "driver_employee_id");

CREATE INDEX "daily_schedules_driver_employee_id_idx"
ON "daily_schedules"("driver_employee_id");

CREATE UNIQUE INDEX "daily_schedules_labours_schedule_date_employee_id_key"
ON "daily_schedules_labours"(
    "daily_schedules_schedule_date",
    "labour_employee_id"
);

ALTER TABLE "daily_schedules"
ADD CONSTRAINT "daily_schedules_driver_employee_id_fkey"
FOREIGN KEY ("driver_employee_id")
REFERENCES "labours"("employee_id")
ON DELETE RESTRICT
ON UPDATE CASCADE;

ALTER TABLE "daily_schedules"
ADD CONSTRAINT "daily_schedules_camp_start_before_start_check"
CHECK (
    "camp_start_time" IS NULL
    OR "start_time" IS NULL
    OR "camp_start_time" <= "start_time"
);

ALTER TABLE "daily_schedules"
ADD CONSTRAINT "daily_schedules_start_before_end_check"
CHECK (
    "start_time" IS NULL
    OR "end_time" IS NULL
    OR "start_time" < "end_time"
);
