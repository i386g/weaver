# weaver

Weaver Bot - a bot for scheduling at recurring intervals.

Live at https://myweaverbot.t.me/.

```
Weaver Bot - @myweaverbot
• a bot for scheduling at recurring intervals.

Create
• creates a reminder.
• accepts military time.
/create [hhmm] [name]
/create 0600 example
• accepts cron schedule.
/create [schedule] [name]
/create * * * * * example

Cron Schedules
• are codes for scheduling at recurring intervals.

Cron Schedule Examples
• 00 06 * * 1 - At 06:00 AM, only on Monday
• 00 18 * * * - At 06:00 PM

Cron Schedule References
• https://croner.56k.guru/usage/pattern/
• https://crontab.guru/

Explain
• explains a cron schedule.
/explain [schedule]
/explain 00 06 * * 1

Delete
• deletes a reminder.
/delete [name]
/delete example

List
• lists all reminders.
/list

Verbose List
• verbosely lists all reminders.
/verbose

Timezone
• gets or sets the timezone.
/timezone [zone]
/timezone Asia/Manila

Timezones
• gets all timezones.
/timezones

Start / Help
• shows usage info.
/start
/help

Shortcuts
• /c for /create
• /e for /explain
• /d for /delete
• /l for /list
• /v for /verbose
• /tz for /timezone
• /tzs for /timezones
• /s for /start
• /h for /help
```

#### Development

```sh
cd ./server/
npm install
npm run dev
```

#### VSCode Extensions

- ESLint
- Prettier
- Stylelint
- Tailwind CSS Intellisense
- PostCSS Intellisense and Highlighting
- CSS Variable Autocomplete

#### License

MIT
