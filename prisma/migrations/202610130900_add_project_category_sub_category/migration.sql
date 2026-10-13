-- Nullable fields keep existing projects valid and allow older import templates.
ALTER TABLE "projects"
  ADD COLUMN "category" TEXT,
  ADD COLUMN "sub_category" TEXT;
