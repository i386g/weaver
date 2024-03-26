import type {
  GeneratedAlways,
  Selectable,
  Insertable,
  Updateable,
} from "kysely";

export interface Reminder {
  id: string;
  chat_id: number;
  name: string;
  schedule: string;
  sequence: number;
}
export interface KyselyReminder extends Omit<Reminder, "id"> {
  id: GeneratedAlways<string>;
}
export type SelectableReminder = Selectable<KyselyReminder>;
export type InsertableReminder = Insertable<KyselyReminder>;
export type UpdateableReminder = Updateable<KyselyReminder>;

export interface Timezone {
  id: string;
  chat_id: number;
  zone: string;
}
export interface KyselyTimezone extends Omit<Timezone, "id"> {
  id: GeneratedAlways<string>;
}
export type SelectableTimezone = Selectable<KyselyTimezone>;
export type InsertableTimezone = Insertable<KyselyTimezone>;
export type UpdateableTimezone = Updateable<KyselyTimezone>;

export interface KyselyDatabase {
  reminders: KyselyReminder;
  timezones: KyselyTimezone;
}
