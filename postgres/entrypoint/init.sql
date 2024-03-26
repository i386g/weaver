DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

DROP SCHEMA IF EXISTS weaver CASCADE;

CREATE EXTENSION "uuid-ossp";

CREATE SCHEMA weaver;

CREATE TABLE weaver.reminders (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
    "chat_id" double precision NOT NULL,
    "name" text NOT NULL,
    "schedule" text NOT NULL,
    "sequence" smallint NOT NULL,
    UNIQUE("chat_id", "name")
);

CREATE TABLE weaver.timezones (
    "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY NOT NULL,
    "chat_id" double precision NOT NULL,
    "zone" text NOT NULL,
    UNIQUE("chat_id")
); 