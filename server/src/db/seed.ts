import { queryOne, insert } from "./index.js";
import { now } from "../utils.js";

export function seedIfEmpty(): void {
  const existing = queryOne<{ c: number }>("SELECT COUNT(*) as c FROM project");
  if (existing && existing.c > 0) {
    console.log("📋 数据库已有数据，跳过种子数据");
    return;
  }

  console.log("🌱 插入示例数据...");
  const ts = now();

  // 人员
  const p1 = insert(
    `INSERT INTO personnel (name, department, phone, email, role, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["张三", "研发部", "13800001001", "zhangsan@example.com", "项目负责人", "", ts, ts]
  );
  const p2 = insert(
    `INSERT INTO personnel (name, department, phone, email, role, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["李四", "软件部", "13800001002", "lisi@example.com", "软件负责人", "", ts, ts]
  );
  const p3 = insert(
    `INSERT INTO personnel (name, department, phone, email, role, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["王五", "硬件部", "13800001003", "wangwu@example.com", "硬件负责人", "", ts, ts]
  );
  const p4 = insert(
    `INSERT INTO personnel (name, department, phone, email, role, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["赵六", "FPGA部", "13800001004", "zhaoliu@example.com", "FPGA负责人", "", ts, ts]
  );
  const p5 = insert(
    `INSERT INTO personnel (name, department, phone, email, role, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ["钱七", "ARM部", "13800001005", "qianqi@example.com", "ARM负责人", "", ts, ts]
  );

  // 项目1: NM9100-8
  const prj1 = insert(
    `INSERT INTO project (name, code, description, status, start_date, end_date, manager_id,
     software_owner_id, hardware_owner_id, fpga_owner_id, arm_owner_id,
     arm_status, fpga_status, pc_status, hardware_status,
     target_date, priority, risk_level, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "NM9100-8", "P-NM9100-8", "高精度频率计数与多通道采集设备",
      "active", "2025-01-15", null, p1,
      p2, p3, p4, p5,
      "designing", "testing", "developing", "waiting_hardware",
      "2026-09-30", "high", "medium",
      "CAN、温度检测、频率/转速输入等功能需等待新硬件到位后联调；频率计数可先用旧NM9100验证。",
      ts, ts,
    ]
  );

  // 项目2: EX10XXA
  const prj2 = insert(
    `INSERT INTO project (name, code, description, status, start_date, end_date, manager_id,
     software_owner_id, hardware_owner_id, fpga_owner_id, arm_owner_id,
     arm_status, fpga_status, pc_status, hardware_status,
     target_date, actual_finish_date, priority, risk_level, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "EX10XXA", "P-EX10XXA", "PC软件迭代基础版本平台",
      "completed", "2024-06-01", "2025-12-31", p2,
      p2, p3, p4, p5,
      "completed", "completed", "completed", "completed",
      "2025-12-31", "2025-12-20", "normal", "low", "作为后续PC软件迭代基础版本。",
      ts, ts,
    ]
  );

  // 设备1: NM9100-8样机
  insert(
    `INSERT INTO device (name, model, serial_number, device_type, device_no, status, location, customer,
     hardware_version, software_version, fpga_version, arm_version,
     ship_status, repair_status,
     project_id, responsible_id, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "NM9100-8 样机1", "NM9100-8", "NM9100-8-001", "综合采集设备", "NM9100-8-001",
      "rd", "公司实验室", "",
      "V0.1", "未发布", "dev-202606", "dev-202606",
      "not_shipped", "normal",
      prj1, p1, "用于联调测试。", ts, ts,
    ]
  );

  // 设备2: EX10XXA设备1
  const dev2 = insert(
    `INSERT INTO device (name, model, serial_number, device_type, device_no, status, location, customer,
     hardware_version, software_version, fpga_version, arm_version,
     ship_status, repair_status,
     project_id, responsible_id, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "EX10XXA 设备1", "EX10XXA", "EX10XXA-001", "PC平台", "EX10XXA-001",
      "customer_site", "客户现场", "某实验室",
      "V1.0", "V2.3", "release-1.0", "release-1.0",
      "shipped", "normal",
      prj2, p2, "客户现场正常运行。", ts, ts,
    ]
  );

  // 设备3: EX10XXA设备2（返修中）
  const dev3 = insert(
    `INSERT INTO device (name, model, serial_number, device_type, device_no, status, location, customer,
     hardware_version, software_version, fpga_version, arm_version,
     ship_status, ship_date, return_date, repair_status,
     project_id, responsible_id, remark, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "EX10XXA 设备2", "EX10XXA", "EX10XXA-002", "PC平台", "EX10XXA-002",
      "repairing", "公司维修区", "某高校实验室",
      "V1.0", "V2.2", "release-1.0", "release-1.0",
      "returned", "2026-03-01", "2026-03-15", "repairing",
      prj2, p3, "客户反馈通道采集异常。", ts, ts,
    ]
  );

  // 发货记录
  insert(
    `INSERT INTO shipment (recipient, recipient_phone, address, tracking_number, ship_date, status, note, device_id, project_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["某实验室", "010-12345678", "北京市海淀区", "SF1234567890", "2025-12-20", "delivered", "首批交付", dev2, prj2, ts, ts]
  );

  // 维修记录
  insert(
    `INSERT INTO repair (fault_description, fault_type, repair_status, sent_date, repair_provider, cost, result, handler_id, device_id, project_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "客户反馈通道采集异常，数据偶尔跳变", "hardware", "repairing", "2026-03-15",
      "公司维修组", 0, "", p3, dev3, prj2, ts, ts,
    ]
  );

  // 软件记录
  insert(
    `INSERT INTO software (name, version, status, update_date, note, developer_id, project_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["PC采集软件", "V2.3", "released", "2025-12-15", "EX10XXA正式发布版本", p2, prj2, ts, ts]
  );
  insert(
    `INSERT INTO software (name, version, status, update_date, note, developer_id, project_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["NM9100固件", "dev-0.1", "developing", "2026-05-01", "在研版本，等待硬件联调", p2, prj1, ts, ts]
  );

  // 硬件记录
  insert(
    `INSERT INTO hardware (name, version, status, update_date, note, designer_id, project_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["EX10XXA主板", "V1.0", "finalized", "2025-10-01", "已定型量产版本", p3, prj2, ts, ts]
  );
  insert(
    `INSERT INTO hardware (name, version, status, update_date, note, designer_id, project_id, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ["NM9100采集板", "V0.1", "prototyping", "2026-05-20", "等待新硬件打样", p3, prj1, ts, ts]
  );

  console.log("✅ 示例数据插入完成");
}
