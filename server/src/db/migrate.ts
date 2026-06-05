import { query, run } from "./index.js";

// 检查列是否存在
function columnExists(table: string, column: string): boolean {
  const rows = query<{ name: string }>(`PRAGMA table_info(${table})`);
  return rows.some((r) => r.name === column);
}

// 安全添加列
function addColumn(table: string, column: string, type: string): void {
  if (!columnExists(table, column)) {
    run(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`  ✅ 已添加列: ${table}.${column}`);
  }
}

// 运行所有迁移
export function runMigrations(): void {
  console.log("📋 检查数据库迁移...");

  // project 表
  addColumn("project", "software_owner_id", "INTEGER REFERENCES personnel(id) ON DELETE SET NULL");
  addColumn("project", "hardware_owner_id", "INTEGER REFERENCES personnel(id) ON DELETE SET NULL");
  addColumn("project", "fpga_owner_id", "INTEGER REFERENCES personnel(id) ON DELETE SET NULL");
  addColumn("project", "arm_owner_id", "INTEGER REFERENCES personnel(id) ON DELETE SET NULL");
  addColumn("project", "arm_status", "TEXT NOT NULL DEFAULT 'not_started'");
  addColumn("project", "fpga_status", "TEXT NOT NULL DEFAULT 'not_started'");
  addColumn("project", "pc_status", "TEXT NOT NULL DEFAULT 'not_started'");
  addColumn("project", "hardware_status", "TEXT NOT NULL DEFAULT 'not_started'");
  addColumn("project", "target_date", "TEXT NOT NULL DEFAULT ''");
  addColumn("project", "actual_finish_date", "TEXT");
  addColumn("project", "priority", "TEXT NOT NULL DEFAULT 'normal'");
  addColumn("project", "risk_level", "TEXT NOT NULL DEFAULT 'low'");
  addColumn("project", "remark", "TEXT NOT NULL DEFAULT ''");

  // device 表
  addColumn("device", "device_no", "TEXT NOT NULL DEFAULT ''");
  addColumn("device", "customer", "TEXT NOT NULL DEFAULT ''");
  addColumn("device", "hardware_version", "TEXT NOT NULL DEFAULT ''");
  addColumn("device", "software_version", "TEXT NOT NULL DEFAULT ''");
  addColumn("device", "fpga_version", "TEXT NOT NULL DEFAULT ''");
  addColumn("device", "arm_version", "TEXT NOT NULL DEFAULT ''");
  addColumn("device", "ship_status", "TEXT NOT NULL DEFAULT 'not_shipped'");
  addColumn("device", "ship_date", "TEXT");
  addColumn("device", "return_date", "TEXT");
  addColumn("device", "repair_status", "TEXT NOT NULL DEFAULT 'normal'");
  addColumn("device", "remark", "TEXT NOT NULL DEFAULT ''");

  // repair 表
  addColumn("repair", "fault_type", "TEXT NOT NULL DEFAULT ''");
  addColumn("repair", "result", "TEXT NOT NULL DEFAULT ''");

  // personnel 表
  addColumn("personnel", "remark", "TEXT NOT NULL DEFAULT ''");

  console.log("✅ 数据库迁移完成");
}
