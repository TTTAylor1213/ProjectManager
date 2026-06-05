import { useState, useEffect } from "react";
import { Modal, Descriptions, Table, Tag, Spin, Tabs } from "antd";
import StatusTag from "./StatusTag";
import { projectStatusMap, subStatusMap, priorityMap, riskLevelMap, deviceStatusMap, shipStatusMap, repairStatusMap } from "../pages/statusLabels";
import api from "../api";
import dayjs from "dayjs";

interface Props { projectId: number | null; open: boolean; onClose: () => void; }

export default function ProjectDetailModal({ projectId, open, onClose }: Props) {
  const [project, setProject] = useState<any>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId || !open) return;
    setLoading(true);
    Promise.all([
      api.get(`/projects/${projectId}`),
      api.get("/devices", { params: { projectId: String(projectId) } }),
      api.get("/repairs", { params: { projectId: String(projectId) } }),
    ]).then(([pr, dev, rep]) => {
      setProject(pr.data.data);
      setDevices(dev.data.data || []);
      setRepairs(rep.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [projectId, open]);

  if (!project) return null;

  const tabItems = [
    {
      key: "info", label: "基本信息",
      children: (
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="项目名称">{project.name}</Descriptions.Item>
          <Descriptions.Item label="编号">{project.code}</Descriptions.Item>
          <Descriptions.Item label="状态"><StatusTag status={project.status} map={projectStatusMap} /></Descriptions.Item>
          <Descriptions.Item label="优先级"><StatusTag status={project.priority} map={priorityMap} /></Descriptions.Item>
          <Descriptions.Item label="风险等级"><StatusTag status={project.risk_level} map={riskLevelMap} /></Descriptions.Item>
          <Descriptions.Item label="开始日期">{project.start_date ? dayjs(project.start_date).format("YYYY-MM-DD") : "-"}</Descriptions.Item>
          <Descriptions.Item label="目标日期">{project.target_date ? dayjs(project.target_date).format("YYYY-MM-DD") : "-"}</Descriptions.Item>
          <Descriptions.Item label="实际完成">{project.actual_finish_date ? dayjs(project.actual_finish_date).format("YYYY-MM-DD") : "-"}</Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>{project.description || "-"}</Descriptions.Item>
          <Descriptions.Item label="备注" span={2}>{project.remark || "-"}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "owners", label: "负责人",
      children: (
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="项目负责人">{project.manager_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="软件负责人">{project.software_owner_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="硬件负责人">{project.hardware_owner_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="FPGA负责人">{project.fpga_owner_name || "-"}</Descriptions.Item>
          <Descriptions.Item label="ARM负责人" span={2}>{project.arm_owner_name || "-"}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "rd", label: "研发状态",
      children: (
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label="ARM状态"><StatusTag status={project.arm_status} map={subStatusMap} /></Descriptions.Item>
          <Descriptions.Item label="FPGA状态"><StatusTag status={project.fpga_status} map={subStatusMap} /></Descriptions.Item>
          <Descriptions.Item label="PC软件状态"><StatusTag status={project.pc_status} map={subStatusMap} /></Descriptions.Item>
          <Descriptions.Item label="硬件状态"><StatusTag status={project.hardware_status} map={subStatusMap} /></Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: "devices", label: `设备 (${devices.length})`,
      children: (
        <Table rowKey="id" dataSource={devices} pagination={false} size="small"
          columns={[
            { title: "编号", dataIndex: "device_no", width: 100 },
            { title: "名称", dataIndex: "name", width: 120 },
            { title: "状态", dataIndex: "status", width: 90, render: (s: string) => <StatusTag status={s} map={deviceStatusMap} /> },
            { title: "发货", dataIndex: "ship_status", width: 90, render: (s: string) => <StatusTag status={s} map={shipStatusMap} /> },
            { title: "位置", dataIndex: "location", width: 100 },
            { title: "客户", dataIndex: "customer", width: 100 },
            { title: "硬件版本", dataIndex: "hardware_version", width: 90 },
            { title: "软件版本", dataIndex: "software_version", width: 90 },
          ]}
        />
      ),
    },
    {
      key: "repairs", label: `维修 (${repairs.length})`,
      children: (
        <Table rowKey="id" dataSource={repairs} pagination={false} size="small"
          columns={[
            { title: "设备", dataIndex: "device_name", width: 120 },
            { title: "故障描述", dataIndex: "fault_description", ellipsis: true },
            { title: "状态", dataIndex: "repair_status", width: 90, render: (s: string) => <StatusTag status={s} map={repairStatusMap} /> },
            { title: "处理人", dataIndex: "handler_name", width: 80 },
            { title: "费用", dataIndex: "cost", width: 70, render: (c: number) => `¥${c}` },
          ]}
        />
      ),
    },
  ];

  return (
    <Modal title={`项目详情 - ${project.name}`} open={open} onCancel={onClose} footer={null} width={800} destroyOnClose>
      <Spin spinning={loading}>
        <Tabs defaultActiveKey="info" items={tabItems} />
      </Spin>
    </Modal>
  );
}
