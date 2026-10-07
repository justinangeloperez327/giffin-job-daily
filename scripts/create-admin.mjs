import "dotenv/config";

import {
  randomBytes,
  randomUUID,
  scryptSync,
} from "node:crypto";
import pg from "pg";

const { Client } = pg;

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function required(name, envName) {
  const value = argument(name) ?? process.env[envName];

  if (!value) {
    throw new Error(
      `Missing ${name}. Pass --${name} or set ${envName}.`,
    );
  }

  return value;
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
  });

  return [
    "scrypt",
    16384,
    8,
    1,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const client = new Client({ connectionString });

try {
  await client.connect();

  const countResult = await client.query(
    'SELECT COUNT(*)::int AS "count" FROM "users"',
  );

  if (countResult.rows[0].count > 0) {
    console.log("Administrator bootstrap skipped: users already exist.");
  } else {
    const name = required("name", "ADMIN_NAME").trim();
    const email = required("email", "ADMIN_EMAIL").trim().toLowerCase();
    const password = required("password", "ADMIN_PASSWORD");

    if (password.length < 12 || password.length > 128) {
      throw new Error("Admin password must be between 12 and 128 characters.");
    }

    await client.query(
    `INSERT INTO "users"
      ("id", "name", "email", "password_hash", "role", "is_active",
       "failed_login_attempts", "created_at", "updated_at")
     VALUES ($1, $2, $3, $4, 'ADMIN', true, 0, NOW(), NOW())`,
      [randomUUID(), name, email, hashPassword(password)],
    );

    console.log(`Created administrator: ${email}`);
  }
} finally {
  await client.end();
}
