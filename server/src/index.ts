import express from "express";
import cors from "cors";
import { initDb, run } from "./db/index.js";
import personnelRouter from "./routes/personnel.js";
import projectRouter from "./routes/project.js";
import deviceRouter from "./routes/device.js";
import shipmentRouter from "./routes/shipment.js";
import repairRouter from "./routes/repair.js";
import rdDeviceRouter from "./routes/rdDevice.js";
import softwareRouter from "./routes/software.js";
import hardwareRouter from "./routes/hardware.js";
import noteRouter from "./routes/note.js";
import exportRouter from "./routes/export.js";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// 初始化数据库表
function initTables(): void {
  run(`CREATE TABLE IF NOT EXISTS personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    role TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS project (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    start_date TEXT NOT NULL DEFAULT '',
    end_date TEXT,
    manager_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS device (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES project(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT '',
    serial_number TEXT NOT NULL DEFAULT '',
    device_type TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'normal',
    location TEXT NOT NULL DEFAULT '',
    responsible_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS shipment (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES device(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES project(id) ON DELETE SET NULL,
    recipient TEXT NOT NULL,
    recipient_phone TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    tracking_number TEXT NOT NULL DEFAULT '',
    ship_date TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'in_transit',
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS repair (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES device(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES project(id) ON DELETE SET NULL,
    fault_description TEXT NOT NULL DEFAULT '',
    repair_status TEXT NOT NULL DEFAULT 'pending',
    sent_date TEXT NOT NULL DEFAULT '',
    returned_date TEXT,
    repair_provider TEXT NOT NULL DEFAULT '',
    cost INTEGER NOT NULL DEFAULT 0,
    handler_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS rd_device (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER REFERENCES project(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    model TEXT NOT NULL DEFAULT '',
    research_phase TEXT NOT NULL DEFAULT 'requirement',
    current_status TEXT NOT NULL DEFAULT '',
    target_date TEXT NOT NULL DEFAULT '',
    responsible_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL,
    specs TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS software (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES device(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES project(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'developing',
    update_date TEXT NOT NULL DEFAULT '',
    developer_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS hardware (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id INTEGER REFERENCES device(id) ON DELETE SET NULL,
    project_id INTEGER REFERENCES project(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    version TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'designing',
    update_date TEXT NOT NULL DEFAULT '',
    designer_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL,
    note TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT ''
  )`);

  run(`CREATE TABLE IF NOT EXISTS note (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    target_type TEXT NOT NULL,
    target_id INTEGER NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    author_id INTEGER REFERENCES personnel(id) ON DELETE SET NULL,
    created_at TEXT NOT NULL DEFAULT ''
  )`);
}

// 路由注册
app.use("/api/personnel", personnelRouter);
app.use("/api/projects", projectRouter);
app.use("/api/devices", deviceRouter);
app.use("/api/shipments", shipmentRouter);
app.use("/api/repairs", repairRouter);
app.use("/api/rd-devices", rdDeviceRouter);
app.use("/api/software", softwareRouter);
app.use("/api/hardware", hardwareRouter);
app.use("/api/notes", noteRouter);
app.use("/api/export", exportRouter);

// 健康检查
app.get("/api/health", (_req, res) => {
  res.json({ success: true, message: "服务器运行正常" });
});

// 启动服务器
async function start() {
  await initDb();
  initTables();
  console.log("✅ 数据库表初始化完成");

  app.listen(PORT, () => {
    console.log(`✅ 后端服务已启动: http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("❌ 启动失败:", err);
  process.exit(1);
});
