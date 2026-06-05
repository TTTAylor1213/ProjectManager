import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "../../../data/project-manager.db");

let db: SqlJsDatabase;

export async function initDb(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  // 如果数据库文件存在，加载它；否则创建新数据库
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
    console.log("📂 已加载现有数据库");
  } else {
    db = new SQL.Database();
    console.log("🆕 已创建新数据库");
  }

  db.run("PRAGMA foreign_keys = ON");
  return db;
}

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error("数据库尚未初始化，请先调用 initDb()");
  }
  return db;
}

export function saveDb(): void {
  if (!db) return;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

// 写入操作后自动保存
export function run(sql: string, params?: any[]): void {
  const database = getDb();
  database.run(sql, params);
  saveDb();
}

// 查询操作
export function query<T = any>(sql: string, params?: any[]): T[] {
  const database = getDb();
  const stmt = database.prepare(sql);
  if (params) stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

// 查询单行
export function queryOne<T = any>(sql: string, params?: any[]): T | null {
  const results = query<T>(sql, params);
  return results.length > 0 ? results[0] : null;
}

// 插入并返回 ID
export function insert(sql: string, params?: any[]): number {
  const database = getDb();
  database.run(sql, params);
  const result = queryOne<{ id: number }>("SELECT last_insert_rowid() as id");
  saveDb();
  return result?.id ?? 0;
}
