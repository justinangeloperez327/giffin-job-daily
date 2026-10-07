import "server-only";

import {
  randomBytes,
  scrypt as nodeScrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLELIZATION = 1;

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = (await scrypt(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLELIZATION,
  })) as Buffer;

  return [
    "scrypt",
    COST,
    BLOCK_SIZE,
    PARALLELIZATION,
    salt.toString("base64url"),
    key.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, cost, blockSize, parallelization, saltValue, keyValue] =
    encoded.split("$");

  if (
    algorithm !== "scrypt" ||
    !cost ||
    !blockSize ||
    !parallelization ||
    !saltValue ||
    !keyValue
  ) {
    return false;
  }

  const expected = Buffer.from(keyValue, "base64url");
  const actual = (await scrypt(
    password,
    Buffer.from(saltValue, "base64url"),
    expected.length,
    {
      N: Number(cost),
      r: Number(blockSize),
      p: Number(parallelization),
    },
  )) as Buffer;

  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
