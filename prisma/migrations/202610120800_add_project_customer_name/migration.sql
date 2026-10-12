ALTER TABLE "projects"
ADD COLUMN "customer_name" TEXT;

UPDATE "projects"
SET "customer_name" = "project_name"
WHERE "customer_name" IS NULL;

ALTER TABLE "projects"
ALTER COLUMN "customer_name" SET NOT NULL;
