import { spawnSync } from "node:child_process";

const vercelEnvironment = process.env.VERCEL_ENV ?? "development";
const migratePreview =
  vercelEnvironment === "preview" &&
  process.env.VERCEL_MIGRATE_PREVIEW === "1";
const shouldMigrate =
  vercelEnvironment === "production" || migratePreview;
const shouldBootstrapAdmin =
  vercelEnvironment === "production" && process.env.VERCEL === "1";

function run(command, args) {
  const executable =
    process.platform === "win32" ? `${command}.cmd` : command;

  const result = spawnSync(executable, args, {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log(
  `Vercel build environment: ${vercelEnvironment}. Database migrations: ${shouldMigrate ? "enabled" : "skipped"}.`,
);

if (shouldMigrate) {
  run("npx", ["prisma", "migrate", "deploy"]);
}

if (shouldBootstrapAdmin) {
  run("node", ["scripts/create-admin.mjs"]);
}

run("npx", ["prisma", "generate"]);
run("npx", ["next", "build"]);
