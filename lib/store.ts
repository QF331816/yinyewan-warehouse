import fs from "node:fs";
import path from "node:path";
import { buildSeed } from "./seed";
import type { DB } from "./types";

// 在线演示版：数据是构建时打包进来的快照（db/demo.json），只读。
const DB_FILE = path.resolve(process.cwd(), "db", "demo.json");

export function dbFilePath() {
  return DB_FILE;
}

export function readDB(): DB {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as DB;
  } catch {
    return buildSeed();
  }
}

/** 演示版不写盘：所有写操作都是空操作 */
export function writeDB(_db: DB) {
  void _db;
}

export function mutate<T>(fn: (db: DB) => T): T {
  return fn(readDB());
}

export function resetDB() {
  // 演示版不支持重置
}
