import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// ========== 负责人 ==========
export const personnel = sqliteTable("personnel", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  department: text("department").notNull().default(""),
  phone: text("phone").notNull().default(""),
  email: text("email").notNull().default(""),
  role: text("role").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 项目 ==========
export const project = sqliteTable("project", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().default(""),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  startDate: text("start_date").notNull().default(""),
  endDate: text("end_date"),
  managerId: integer("manager_id").references(() => personnel.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 设备 ==========
export const device = sqliteTable("device", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => project.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  model: text("model").notNull().default(""),
  serialNumber: text("serial_number").notNull().default(""),
  deviceType: text("device_type").notNull().default(""),
  status: text("status").notNull().default("normal"),
  location: text("location").notNull().default(""),
  responsibleId: integer("responsible_id").references(() => personnel.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 发货 ==========
export const shipment = sqliteTable("shipment", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: integer("device_id").references(() => device.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => project.id, { onDelete: "set null" }),
  recipient: text("recipient").notNull(),
  recipientPhone: text("recipient_phone").notNull().default(""),
  address: text("address").notNull().default(""),
  trackingNumber: text("tracking_number").notNull().default(""),
  shipDate: text("ship_date").notNull().default(""),
  status: text("status").notNull().default("in_transit"),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 维修 ==========
export const repair = sqliteTable("repair", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: integer("device_id").references(() => device.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => project.id, { onDelete: "set null" }),
  faultDescription: text("fault_description").notNull().default(""),
  repairStatus: text("repair_status").notNull().default("pending"),
  sentDate: text("sent_date").notNull().default(""),
  returnedDate: text("returned_date"),
  repairProvider: text("repair_provider").notNull().default(""),
  cost: integer("cost").notNull().default(0),
  handlerId: integer("handler_id").references(() => personnel.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 在研设备 ==========
export const rdDevice = sqliteTable("rd_device", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("project_id").references(() => project.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  model: text("model").notNull().default(""),
  researchPhase: text("research_phase").notNull().default("requirement"),
  currentStatus: text("current_status").notNull().default(""),
  targetDate: text("target_date").notNull().default(""),
  responsibleId: integer("responsible_id").references(() => personnel.id, { onDelete: "set null" }),
  specs: text("specs").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 软件 ==========
export const software = sqliteTable("software", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: integer("device_id").references(() => device.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => project.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  version: text("version").notNull().default(""),
  status: text("status").notNull().default("developing"),
  updateDate: text("update_date").notNull().default(""),
  developerId: integer("developer_id").references(() => personnel.id, { onDelete: "set null" }),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 硬件 ==========
export const hardware = sqliteTable("hardware", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  deviceId: integer("device_id").references(() => device.id, { onDelete: "set null" }),
  projectId: integer("project_id").references(() => project.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  version: text("version").notNull().default(""),
  status: text("status").notNull().default("designing"),
  updateDate: text("update_date").notNull().default(""),
  designerId: integer("designer_id").references(() => personnel.id, { onDelete: "set null" }),
  note: text("note").notNull().default(""),
  createdAt: text("created_at").notNull().default(""),
  updatedAt: text("updated_at").notNull().default(""),
});

// ========== 备注 ==========
export const note = sqliteTable("note", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  targetType: text("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  content: text("content").notNull().default(""),
  authorId: integer("author_id").references(() => personnel.id, { onDelete: "set null" }),
  createdAt: text("created_at").notNull().default(""),
});
