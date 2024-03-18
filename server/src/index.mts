/* eslint-disable max-len */

import assert from "node:assert";

import Grammy from "grammy";
import { Cron } from "croner";
import * as luxon from "luxon";
import { default as cronstrue } from "cronstrue";
import { default as lodash } from "lodash";

import env from "./env.mjs";
import db from "./db.mjs";

import type { CronOptions } from "croner";
import type { InsertableReminder, InsertableTimezone } from "./types.mjs";

const TELEGRAM_BOT_TOKEN = env("TELEGRAM_BOT_TOKEN");
assert(typeof TELEGRAM_BOT_TOKEN === "string");

const bot = new Grammy.Bot(TELEGRAM_BOT_TOKEN);

const rx_command = /^\/([a-z]+)/;

/**
 * @description /create * * * * * * example
 */
const rx_create_cron = /^\/(create|c) (.+) ([a-z0-9-]+)$/;

/**
 * @description /create 0600 example
 */
const rx_create_hhmm = /^\/(create|c) (\d{4}) ([a-z0-9-]+)$/;

/**
 * @description /delete example
 */
const rx_delete = /^\/(delete|d) ([a-z0-9-]+)$/;

/**
 * @description /timezone Asia/Manila
 */
const rx_timezone = /^\/(timezone|tz) (.+)$/;

/**
 * @description /explain * * * * * *
 */
const rx_explain_cron = /^\/(explain|e) (.+)$/;

const jobs: Map<string, Cron> = new Map();

const extract_command = (text: string) => {
  if (rx_command.test(text) === true) {
    const match = text.match(rx_command);
    assert(match instanceof Array);
    const command = match[1];
    return command;
  }
  return null;
};

const get_timezone = async (chat_id: number) => {
  assert(typeof chat_id === "number");
  const existing_timezone = await db
    .selectFrom("timezones")
    .selectAll()
    .where("chat_id", "=", chat_id)
    .executeTakeFirst();
  if (existing_timezone instanceof Object) {
    return existing_timezone;
  }
  const timezone: InsertableTimezone = {
    chat_id,
    zone: "Asia/Manila",
  };
  const created_timezone = await db
    .insertInto("timezones")
    .values(timezone)
    .returningAll()
    .executeTakeFirstOrThrow();
  return created_timezone;
};

bot.on("message", async (ctx) => {
  try {
    if (typeof ctx.message.text === "string") {
      const chat_id = ctx.chat.id;

      const command = extract_command(ctx.message.text);

      switch (command) {
        case "start":
        case "s":
        case "help":
        case "h": {
          const instructions = [
            "<strong>Weaver Bot</strong> - @myweaverbot",
            "• a bot for scheduling at recurring intervals.",
            "",
            "<strong>Create</strong>",
            "• creates a reminder.",
            "• accepts military time.",
            "/create [hhmm] [name]",
            "/create 0600 example",
            "• accepts cron schedule.",
            "/create [schedule] [name]",
            "/create * * * * * example",
            "",
            "<strong>Cron Schedules</strong>",
            "• are codes for scheduling at recurring intervals.",
            "",
            "<strong>Cron Schedule Examples</strong>",
            "• <strong>00 06 * * 1</strong> - At 06:00 AM, only on Monday",
            "• <strong>00 18 * * *</strong> - At 06:00 PM",
            "",
            "<strong>Cron Schedule References</strong>",
            "• https://croner.56k.guru/usage/pattern/",
            "• https://crontab.guru/",
            "",
            "<strong>Explain</strong>",
            "• explains a cron schedule.",
            "/explain [schedule]",
            "/explain 00 06 * * 1",
            "",
            "<strong>Delete</strong>",
            "• deletes a reminder.",
            "/delete [name]",
            "/delete example",
            "",
            "<strong>List</strong>",
            "• lists all reminders.",
            "/list",
            "",
            "<strong>Verbose List</strong>",
            "• verbosely lists all reminders.",
            "/verbose",
            "",
            "<strong>Timezone</strong>",
            "• gets or sets the timezone.",
            "/timezone [zone]",
            "/timezone Asia/Manila",
            "",
            "<strong>Timezones</strong>",
            "• gets all timezones.",
            "/timezones",
            "",
            "<strong>Start / Help</strong>",
            "• shows usage info.",
            "/start",
            "/help",
            "",
            "<strong>Shortcuts</strong>",
            "• /c for /create",
            "• /e for /explain",
            "• /d for /delete",
            "• /l for /list",
            "• /v for /verbose",
            "• /tz for /timezone",
            "• /tzs for /timezones",
            "• /s for /start",
            "• /h for /help",
            "",
          ];
          await bot.api.sendMessage(chat_id, instructions.join("\n"), {
            link_preview_options: { is_disabled: true },
            parse_mode: "HTML",
          });

          break;
        }

        case "create":
        case "c": {
          if (rx_create_hhmm.test(ctx.message.text) === true) {
            const match = ctx.message.text.match(rx_create_hhmm);
            assert(match instanceof Array);
            const hhmm = match[2];
            const name = match[3];
            assert(typeof hhmm === "string");
            assert(typeof name === "string");
            const hh = hhmm.substring(0, 2);
            const mm = hhmm.substring(2, 4);
            const schedule = `${mm} ${hh} * * *`;
            const timezone = await get_timezone(chat_id);
            const existing_reminder = await db
              .selectFrom("reminders")
              .selectAll()
              .where("chat_id", "=", chat_id)
              .where("name", "=", name)
              .executeTakeFirst();
            assert(existing_reminder === undefined, `Error: "${name}" exists.`);
            const reminder: InsertableReminder = {
              chat_id,
              name,
              schedule,
            };
            const created_reminder = await db
              .insertInto("reminders")
              .values(reminder)
              .returningAll()
              .executeTakeFirstOrThrow();
            const options: CronOptions = {
              name: created_reminder.id,
              timezone: timezone.zone,
            };
            const callback = async () => {
              await bot.api.sendMessage(chat_id, `Reminder: ${name}`);
            };
            const job = new Cron(schedule, options, callback);
            jobs.set(created_reminder.id, job);
            await bot.api.sendMessage(chat_id, "Reminder created.");
            return;
          }

          if (rx_create_cron.test(ctx.message.text) === true) {
            const match = ctx.message.text.match(rx_create_cron);
            assert(match instanceof Array);
            const schedule = match[2];
            const name = match[3];
            assert(typeof schedule === "string");
            assert(typeof name === "string");
            const timezone = await get_timezone(chat_id);
            const existing_reminder = await db
              .selectFrom("reminders")
              .selectAll()
              .where("chat_id", "=", chat_id)
              .where("name", "=", name)
              .executeTakeFirst();
            assert(existing_reminder === undefined, `Error: "${name}" exists.`);
            const reminder: InsertableReminder = {
              chat_id,
              name,
              schedule,
            };
            const created_reminder = await db
              .insertInto("reminders")
              .values(reminder)
              .returningAll()
              .executeTakeFirstOrThrow();
            const options: CronOptions = {
              name: created_reminder.id,
              timezone: timezone.zone,
            };
            const callback = async () => {
              await bot.api.sendMessage(chat_id, `Reminder: ${name}`);
            };
            const job = new Cron(schedule, options, callback);
            jobs.set(created_reminder.id, job);
            await bot.api.sendMessage(chat_id, "Reminder created.");
            return;
          }

          await bot.api.sendMessage(chat_id, "Error: incorrect format.");

          break;
        }

        case "explain":
        case "e": {
          if (rx_explain_cron.test(ctx.message.text) === true) {
            const match = ctx.message.text.match(rx_explain_cron);
            assert(match instanceof Array);
            const schedule = match[2];
            assert(typeof schedule === "string");
            await bot.api.sendMessage(chat_id, cronstrue.toString(schedule));
            return;
          }
          await bot.api.sendMessage(chat_id, "Error: incorrect format.");
          break;
        }

        case "delete":
        case "d": {
          if (rx_delete.test(ctx.message.text) === true) {
            const match = ctx.message.text.match(rx_delete);
            assert(match instanceof Array);
            const name = match[2];
            assert(typeof name === "string");
            const existing_reminder = await db
              .selectFrom("reminders")
              .selectAll()
              .where("chat_id", "=", chat_id)
              .where("name", "=", name)
              .executeTakeFirst();
            assert(
              existing_reminder instanceof Object,
              `Error: "${name}" not found.`,
            );
            const deleted_reminder = await db
              .deleteFrom("reminders")
              .where("id", "=", existing_reminder.id)
              .returningAll()
              .executeTakeFirstOrThrow();
            const job = jobs.get(deleted_reminder.id);
            assert(job instanceof Object);
            job.stop();
            jobs.delete(deleted_reminder.id);
            await bot.api.sendMessage(chat_id, "Reminder deleted.");
            return;
          }

          await bot.api.sendMessage(chat_id, "Error: incorrect format.");

          break;
        }

        case "list":
        case "l": {
          const reminders = await db
            .selectFrom("reminders")
            .selectAll()
            .where("chat_id", "=", chat_id)
            .execute();
          if (reminders.length === 0) {
            await bot.api.sendMessage(chat_id, `Reminders are empty.`);
            return;
          }
          for (const reminder of reminders) {
            const { id, name, schedule } = reminder;
            const job = jobs.get(id);
            assert(job instanceof Object);
            const schedule_readable = cronstrue.toString(schedule);
            const next = job.nextRun() as Date;
            const next_relative = luxon.DateTime.fromJSDate(next).toRelative();
            await bot.api.sendMessage(
              chat_id,
              `${name}: ${schedule_readable} (${next_relative})`,
            );
          }
          break;
        }

        case "verbose":
        case "v": {
          const reminders = await db
            .selectFrom("reminders")
            .selectAll()
            .where("chat_id", "=", chat_id)
            .execute();
          if (reminders.length === 0) {
            await bot.api.sendMessage(chat_id, `Reminders are empty.`);
            return;
          }
          for (const reminder of reminders) {
            const { id, name, schedule } = reminder;
            const job = jobs.get(id);
            assert(job instanceof Object);
            const schedule_readable = cronstrue.toString(schedule);
            const next = job.nextRun() as Date;
            const next_iso = luxon.DateTime.fromJSDate(next).toISO();
            const next_relative = luxon.DateTime.fromJSDate(next).toRelative();
            const info = {
              id,
              name,
              schedule,
              schedule_readable,
              next_iso,
              next_relative,
            };
            await bot.api.sendMessage(chat_id, JSON.stringify(info, null, 2));
          }
          break;
        }

        case "timezones":
        case "tzs": {
          const valid_timezones = Intl.supportedValuesOf("timeZone");
          const chunks = lodash.chunk(valid_timezones, 100);
          for (const chunk of chunks) {
            await bot.api.sendMessage(chat_id, chunk.join(", "));
          }
          break;
        }

        case "timezone":
        case "tz": {
          if (rx_timezone.test(ctx.message.text) === true) {
            const match = ctx.message.text.match(rx_timezone);
            assert(match instanceof Array);
            const zone = match[2];
            assert(typeof zone === "string");
            const zones = Intl.supportedValuesOf("timeZone");
            assert(zones.includes(zone) === true, "Error: invalid timezone.");
            const timezone = await get_timezone(chat_id);
            timezone.zone = zone;
            await db
              .updateTable("timezones")
              .set(timezone)
              .where("id", "=", timezone.id)
              .returningAll()
              .executeTakeFirstOrThrow();
            await bot.api.sendMessage(chat_id, `Timezone: ${timezone.zone}`);
            const reminders = await db
              .selectFrom("reminders")
              .selectAll()
              .where("chat_id", "=", chat_id)
              .execute();
            for (const reminder of reminders) {
              const { id, name, schedule } = reminder;
              /**
               * Delete cron job.
               */
              {
                assert(jobs.has(id) === true);
                const job = jobs.get(id);
                assert(job instanceof Object);
                job.stop();
              }
              /**
               * Create cron job.
               */
              {
                const options: CronOptions = {
                  name: reminder.id,
                  timezone: timezone.zone,
                };
                const callback = async () => {
                  await bot.api.sendMessage(chat_id, `Reminder: ${name}`);
                };
                const job = new Cron(schedule, options, callback);
                jobs.set(reminder.id, job);
                const schedule_readable = cronstrue.toString(schedule);
                const next = job.nextRun() as Date;
                const next_iso = luxon.DateTime.fromJSDate(next).toISO();
                const next_relative =
                  luxon.DateTime.fromJSDate(next).toRelative();
                const info = {
                  id,
                  name,
                  schedule,
                  schedule_readable,
                  next_iso,
                  next_relative,
                };
                await bot.api.sendMessage(
                  chat_id,
                  JSON.stringify(info, null, 2),
                );
              }
            }
            return;
          }

          const timezone = await get_timezone(chat_id);
          await bot.api.sendMessage(chat_id, `Timezone: ${timezone.zone}`);

          break;
        }

        default: {
          await bot.api.sendMessage(chat_id, "Unknown command.");
          break;
        }
      }
    }
  } catch (e) {
    if (e instanceof Error) {
      console.error(e);
      await ctx.reply(e.message);
    }
    if (typeof e === "string") {
      console.error(e);
      await ctx.reply(e);
    }
  }
});

bot.start().catch(console.error);

{
  const reminders = await db.selectFrom("reminders").selectAll().execute();
  for (const reminder of reminders) {
    const { chat_id, name, schedule } = reminder;
    const timezone = await get_timezone(chat_id);
    const options: CronOptions = {
      name: reminder.id,
      timezone: timezone.zone,
    };
    const callback = async () => {
      await bot.api.sendMessage(chat_id, `Reminder: ${name}`);
    };
    const job = new Cron(schedule, options, callback);
    jobs.set(reminder.id, job);
  }
}

console.log("Weaver started.");
