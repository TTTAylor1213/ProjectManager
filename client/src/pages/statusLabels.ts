// 各模块状态值和对应标签颜色
export const projectStatusMap: Record<string, { label: string; color: string }> = {
  active: { label: "进行中", color: "blue" },
  completed: { label: "已完成", color: "green" },
  paused: { label: "已暂停", color: "orange" },
  cancelled: { label: "已取消", color: "red" },
};

export const deviceStatusMap: Record<string, { label: string; color: string }> = {
  normal: { label: "正常", color: "green" },
  abnormal: { label: "异常", color: "red" },
  repairing: { label: "维修中", color: "orange" },
  shipped: { label: "已发货", color: "blue" },
  rd: { label: "在研", color: "purple" },
};

export const shipmentStatusMap: Record<string, { label: string; color: string }> = {
  in_transit: { label: "运输中", color: "blue" },
  delivered: { label: "已签收", color: "green" },
  returned: { label: "已退回", color: "red" },
};

export const repairStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: "待维修", color: "orange" },
  repairing: { label: "维修中", color: "blue" },
  fixed: { label: "已修好", color: "green" },
  unfixable: { label: "无法修复", color: "red" },
};

export const rdPhaseMap: Record<string, { label: string; color: string }> = {
  requirement: { label: "需求", color: "blue" },
  design: { label: "设计", color: "cyan" },
  development: { label: "开发", color: "orange" },
  testing: { label: "测试", color: "purple" },
  acceptance: { label: "验收", color: "green" },
};

export const softwareStatusMap: Record<string, { label: string; color: string }> = {
  developing: { label: "开发中", color: "blue" },
  testing: { label: "测试中", color: "orange" },
  released: { label: "已发布", color: "green" },
  buggy: { label: "有缺陷", color: "red" },
};

export const hardwareStatusMap: Record<string, { label: string; color: string }> = {
  designing: { label: "设计中", color: "blue" },
  prototyping: { label: "打样中", color: "cyan" },
  testing: { label: "测试中", color: "orange" },
  finalized: { label: "已定型", color: "green" },
  problematic: { label: "有问题", color: "red" },
};
