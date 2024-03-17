import assert from "node:assert";
import postgres from "postgres";
import * as luxon from "luxon";
import { Kysely } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import type { KyselyDatabase } from "./types.mjs";

import env from "./env.mjs";

const POSTGRES_HOST = env("POSTGRES_HOST", "localhost");
assert(typeof POSTGRES_HOST === "string");

const POSTGRES_PORT = env("POSTGRES_PORT", 5432);
assert(typeof POSTGRES_PORT === "number");

const POSTGRES_DB = env("POSTGRES_DB", "postgres");
assert(typeof POSTGRES_DB === "string");

const POSTGRES_USER = env("POSTGRES_USER", "postgres");
assert(typeof POSTGRES_USER === "string");

const POSTGRES_PASSWORD = env("POSTGRES_PASSWORD", "postgres");
assert(typeof POSTGRES_PASSWORD === "string");

export const client = postgres({
  database: POSTGRES_DB,
  host: POSTGRES_HOST,
  port: POSTGRES_PORT,
  user: POSTGRES_USER,
  password: POSTGRES_PASSWORD,
  max: 10,
  types: {
    date: {
      to: 1184,
      from: [1082, 1083, 1114, 1184],
      /**
       * TypeScript to PostgreSQL
       */
      serialize: (value: string) => {
        if (typeof value === "string") {
          return luxon.DateTime.fromISO(value).toSQL() as string;
        }
        return value;
      },
      /**
       * PostgreSQL to TypeScript
       */
      parse: (value: string) => {
        if (typeof value === "string") {
          return luxon.DateTime.fromSQL(value).toISO() as string;
        }
        return value;
      },
    },
  },
});

export const dialect = new PostgresJSDialect({ postgres: client });

export const db = new Kysely<KyselyDatabase>({ dialect });

export default db.withSchema("weaver");
