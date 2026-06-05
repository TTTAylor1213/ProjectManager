// ====== 项目状态 ======
export const projectStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: "在研", color: "blue" },
  completed: { label: "已完成", color: "green" },
  paused: { label: "暂停", color: "default" },
  cancelled: { label: "取消", color: "default" },
};

// ====== 子模块状态（ARM / FPGA / PC / 硬件） ======
export const subStatusMap: Record<string, { label: string; color: string }> = {
  not_started: { label: "未开始", color: "default" },
  designing: { label: "设计中", color: "blue" },
  developing: { label: "开发中", color: "blue" },
  testing: { label: "测试中", color: "purple" },
  debugging: { label: "调试中", color: "purple" },
  completed: { label: "已完成", color: "green" },
  waiting_hardware: { label: "等待硬件", color: "orange" },
  paused: { label: "暂停", color: "default" },
  at_risk: { label: "存在风险", color: "red" },
};

// ====== 优先级 ======
export const priorityMap: Record<string, { label: string; color: string }> = {
  low: { label: "低", color: "green" },
  normal: { label: "中", color: "blue" },
  high: { label: "高", color: "orange" },
  urgent: { label: "紧急", color: "red" },
};

// ====== 风险等级 ======
export const riskLevelMap: Record<string, { label: string; color: string }> = {
  low: { label: "低风险", color: "green" },
  medium: { label: "中风险", color: "orange" },
  high: { label: "高风险", color: "red" },
};

// ====== 设备状态 ======
export const deviceStatusMap: Record<string, { label: string; color: string }> = {
  normal: { label: "库存中", color: "green" },
  rd: { label: "在研", color: "blue" },
  internal_test: { label: "内部测试", color: "purple" },
  shipped: { label: "已发货", color: "blue" },
  customer_site: { label: "客户现场", color: "cyan" },
  repairing: { label: "返修中", color: "red" },
  scrapped: { label: "已报废", color: "default" },
  archived: { label: "已归档", color: "default" },
  abnormal: { label: "异常", color: "red" },
};

// ====== 发货状态 ======
export const shipStatusMap: Record<string, { label: string; color: string }> = {
  not_shipped: { label: "未发货", color: "default" },
  pending: { label: "待发货", color: "blue" },
  shipped: { label: "已发货", color: "purple" },
  delivered: { label: "客户已签收", color: "green" },
  returned: { label: "已退回", color: "red" },
};

// ====== 维修状态 ======
export const repairStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待检测", color: "orange" },
  diagnosing: { label: "定位中", color: "blue" },
  repairing: { label: "维修中", color: "blue" },
  waiting_parts: { label: "等待配件", color: "orange" },
  fixed: { label: "已修复", color: "green" },
  returned: { label: "已返还", color: "green" },
  unfixable: { label: "无法修复", color: "red" },
  closed: { label: "关闭", color: "default" },
};

// 设备层面的维修状态
export const deviceRepairStatusMap: Record<string, { label: string; color: string }> = {
  normal: { label: "无", color: "green" },
  repairing: { label: "返修中", color: "red" },
  repaired: { label: "已修复", color: "green" },
};

// ====== 发货记录状态 ======
export const shipmentStatusMap: Record<string, { label: string; color: string }> = {
  in_transit: { label: "运输中", color: "blue" },
  delivered: { label: "已签收", color: "green" },
  returned: { label: "已退回", color: "red" },
};

// ====== 故障类型 ======
export const faultTypeMap: Record<string, { label: string; color: string }> = {
  hardware: { label: "硬件故障", color: "red" },
  software: { label: "软件故障", color: "blue" },
  fpga: { label: "FPGA故障", color: "purple" },
  arm: { label: "ARM故障", color: "purple" },
  communication: { label: "通信故障", color: "orange" },
  power: { label: "电源故障", color: "red" },
  structure: { label: "结构问题", color: "orange" },
  user_error: { label: "客户误操作", color: "default" },
  other: { label: "其他", color: "default" },
};

// ====== 软件状态 ======
export const softwareStatusMap: Record<string, { label: string; color: string }> = {
  developing: { label: "开发中", color: "blue" },
  testing: { label: "测试中", color: "orange" },
  released: { label: "已发布", color: "green" },
  buggy: { label: "有缺陷", color: "red" },
};

// ====== 硬件状态 ======
export const hardwareStatusMap: Record<string, { label: string; color: string }> = {
  designing: { label: "设计中", color: "blue" },
  prototyping: { label: "打样中", color: "cyan" },
  testing: { label: "测试中", color: "orange" },
  finalized: { label: "已定型", color: "green" },
  problematic: { label: "有问题", color: "red" },
};

// ====== 研发阶段 ======
export const rdPhaseMap: Record<string, { label: string; color: string }> = {
  requirement: { label: "需求", color: "blue" },
  design: { label: "设计", color: "cyan" },
  development: { label: "开发", color: "orange" },
  testing: { label: "测试", color: "purple" },
  acceptance: { label: "验收", color: "green" },
};
