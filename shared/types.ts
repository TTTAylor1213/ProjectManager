// 共享类型定义 — 前后端共用

// ========== 负责人 ==========
export interface Personnel {
  id: number;
  name: string;
  department: string;
  phone: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 项目 ==========
export type ProjectStatus = 'active' | 'completed' | 'paused' | 'cancelled';

export interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string | null;
  managerId: number | null;
  managerName?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 设备 ==========
export type DeviceStatus = 'normal' | 'abnormal' | 'repairing' | 'shipped' | 'rd';

export interface Device {
  id: number;
  projectId: number | null;
  projectName?: string;
  name: string;
  model: string;
  serialNumber: string;
  deviceType: string;
  status: DeviceStatus;
  location: string;
  responsibleId: number | null;
  responsibleName?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 发货 ==========
export type ShipmentStatus = 'in_transit' | 'delivered' | 'returned';

export interface Shipment {
  id: number;
  deviceId: number | null;
  deviceName?: string;
  projectId: number | null;
  projectName?: string;
  recipient: string;
  recipientPhone: string;
  address: string;
  trackingNumber: string;
  shipDate: string;
  status: ShipmentStatus;
  note: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 维修 ==========
export type RepairStatus = 'pending' | 'repairing' | 'fixed' | 'unfixable';

export interface Repair {
  id: number;
  deviceId: number | null;
  deviceName?: string;
  projectId: number | null;
  projectName?: string;
  faultDescription: string;
  repairStatus: RepairStatus;
  sentDate: string;
  returnedDate: string | null;
  repairProvider: string;
  cost: number;
  handlerId: number | null;
  handlerName?: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 在研设备 ==========
export type RdPhase = 'requirement' | 'design' | 'development' | 'testing' | 'acceptance';

export interface RdDevice {
  id: number;
  projectId: number | null;
  projectName?: string;
  name: string;
  model: string;
  researchPhase: RdPhase;
  currentStatus: string;
  targetDate: string;
  responsibleId: number | null;
  responsibleName?: string;
  specs: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 软件 ==========
export type SoftwareStatus = 'developing' | 'testing' | 'released' | 'buggy';

export interface Software {
  id: number;
  deviceId: number | null;
  deviceName?: string;
  projectId: number | null;
  projectName?: string;
  name: string;
  version: string;
  status: SoftwareStatus;
  updateDate: string;
  developerId: number | null;
  developerName?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 硬件 ==========
export type HardwareStatus = 'designing' | 'prototyping' | 'testing' | 'finalized' | 'problematic';

export interface Hardware {
  id: number;
  deviceId: number | null;
  deviceName?: string;
  projectId: number | null;
  projectName?: string;
  name: string;
  version: string;
  status: HardwareStatus;
  updateDate: string;
  designerId: number | null;
  designerName?: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

// ========== 备注 ==========
export type NoteTargetType = 'project' | 'device' | 'shipment' | 'repair' | 'rd_device' | 'software' | 'hardware';

export interface Note {
  id: number;
  targetType: NoteTargetType;
  targetId: number;
  content: string;
  authorId: number | null;
  authorName?: string;
  createdAt: string;
}

// ========== API 通用响应 ==========
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
}
