/**
 * env.mts - env var / env file / cli arg loader.
 * [x] Environment Variable CONSTANT_FORMAT=value
 * [x] Environment File CONSTANT_FORMAT=value
 * [x] Command Line Argument --kebab-format=value
 */

import fs from "node:fs";
import path from "node:path";
import assert from "node:assert";
import process from "node:process";
import Case from "case";
import _ from "lodash";

export const parse = (value: string) => {
  assert(typeof value === "string");
  if (value === "" || value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  if (Number.isFinite(Number(value)) === true) {
    return Number(value);
  }
  return value;
};

/**
 * @description loads environment variable value from process.env.
 * @param key env var key.
 * @param default_value default value.
 */
export const get_env = (
  key: string,
  default_value?: string | number | boolean | null,
) => {
  assert(typeof key === "string");
  const key_constant = Case.constant(key);
  const value = process.env[key_constant];
  if (typeof value === "string") {
    return parse(value);
  }
  if (typeof default_value === "undefined") {
    throw new Error(`get_env "${key}" not found. default value is undefined.`);
  }
  return default_value;
};

/**
 * @description loads environment variable value from .env file.
 * @param key env var key.
 * @param default_value default value.
 */
export const get_envf = (
  key: string,
  default_value?: string | number | boolean | null,
) => {
  assert(typeof key === "string");
  const key_constant = Case.constant(key);
  const envf_path = path.join(process.cwd(), ".env");
  if (fs.existsSync(envf_path) === true) {
    const key_constant_prefix = key_constant.concat("=");
    const lines = fs
      .readFileSync(envf_path, { encoding: "utf-8" })
      .replace(/\r/g, "")
      .split("\n");
    for (let i = 0, l = lines.length; i < l; i += 1) {
      const line = lines[i];
      if (line.startsWith(key_constant_prefix) === true) {
        const value = line.substring(key_constant_prefix.length);
        return parse(value);
      }
    }
  }
  if (typeof default_value === "undefined") {
    throw new Error(`get_envf "${key}" not found. default value is undefined.`);
  }
  return default_value;
};

/**
 * @description loads command line argument value from process.argv.
 * @param key cli arg key.
 * @param default_value default value.
 */
export const get_argv = (
  key: string,
  default_value?: string | number | boolean | null,
) => {
  assert(typeof key === "string");
  const key_kebab = Case.kebab(key);
  const flag_bool = "--".concat(_.trimStart(key_kebab, "-"));
  const flag_with_value = flag_bool.concat("=");
  const args = process.argv.slice(2);
  for (let i = 0, l = args.length; i < l; i += 1) {
    const arg = args[i];
    if (arg === flag_bool) {
      return true;
    }
    if (arg.startsWith(flag_with_value) === true) {
      const value = arg.substring(flag_with_value.length);
      return parse(value);
    }
  }
  if (typeof default_value === "undefined") {
    throw new Error(`get_argv "${key}" not found. default value is undefined.`);
  }
  return default_value;
};

/**
 * @description loads environment variable value from process.env.
 * @description loads environment variable value from .env file.
 * @description loads command line argument value from process.argv.
 * @param key env var key / cli arg key.
 * @param default_value default value.
 */
export const get = (
  key: string,
  default_value?: string | number | boolean | null,
) => {
  assert(typeof key === "string");
  return (
    get_env(key, null) || get_envf(key, null) || get_argv(key, default_value)
  );
};

export default get;
