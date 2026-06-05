import { useState, useEffect, useCallback } from "react";
import { Row, Col, Card, Statistic, Typography, Space, Radio, Input, Descriptions, Divider, Empty } from "antd";
import { SearchOutlined, ProjectOutlined, ToolOutlined, SendOutlined, SettingOutlined, TeamOutlined, WarningOutlined } from "@ant-design/icons";
import StatusTag from "../components/StatusTag";
import { projectStatusMap, subStatusMap, priorityMap, riskLevelMap } from "./statusLabels";
import api from "../api";
import dayjs from "dayjs";

interface ProjectCard {
  id: number; name: string; code: string; status: string;
  manager_name?: string; software_owner_name?: string; hardware_owner_name?: string;
  fpga_owner_name?: string; arm_owner_name?: string;
  arm_status: string; fpga_status: string; pc_status: string; hardware_status: string;
  priority: string; risk_level: string; remark: string;
  device_count: number; shipped_count: number; customer_site_count: number; repairing_count: number;
  target_date: string; actual_finish_date: string | null; updated_at: string;
}

interface Summary {
  totalProjects: number; activeProjects: number; completedProjects: number; riskProjects: number;
  totalDevices: number; shippedDevices: number; customerSiteDevices: number; repairingDevices: number;
  totalPersonnel: number; totalRepairs: number;
}

export default function Dashboard() {
  const [cards, setCards] = useState<ProjectCard[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await api.get("/dashboard/cards", { params });
      setCards(res.data.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, [statusFilter]);

  useEffect(() => { fetchCards(); }, [fetchCards]);
  useEffect(() => {
    api.get("/dashboard/summary").then(r => setSummary(r.data.data)).catch(() => {});
  }, []);

  const filteredCards = cards.filter(c =>
    !search || c.name.includes(search) || c.code.includes(search) ||
    (c.manager_name && c.manager_name.includes(search))
  );

  const statusFilterOptions = [
    { label: "全部", value: "all" },
    ...Object.entries(projectStatusMap).map(([k, v]) => ({ label: v.label, value: k })),
  ];

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>设备研发状态看板</Typography.Title>

      {/* 统计卡片 */}
      {summary && (
        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="项目总数" value={summary.totalProjects} prefix={<ProjectOutlined style={{ color: "#1677ff" }} />} /></Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="在研" value={summary.activeProjects} valueStyle={{ color: "#1677ff" }} /></Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="已完成" value={summary.completedProjects} valueStyle={{ color: "#52c41a" }} /></Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="风险项目" value={summary.riskProjects} prefix={<WarningOutlined style={{ color: "#ff4d4f" }} />} valueStyle={{ color: summary.riskProjects > 0 ? "#ff4d4f" : undefined }} /></Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="设备总数" value={summary.totalDevices} prefix={<ToolOutlined style={{ color: "#52c41a" }} />} /></Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="已发货" value={summary.shippedDevices} prefix={<SendOutlined style={{ color: "#722ed1" }} />} /></Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="客户现场" value={summary.customerSiteDevices} valueStyle={{ color: "#13c2c2" }} /></Card>
          </Col>
          <Col xs={12} sm={6} md={3}>
            <Card size="small"><Statistic title="维修中" value={summary.repairingDevices} prefix={<SettingOutlined style={{ color: "#fa8c16" }} />} valueStyle={{ color: summary.repairingDevices > 0 ? "#fa8c16" : undefined }} /></Card>
          </Col>
        </Row>
      )}

      {/* 状态筛选 */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Radio.Group
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          optionType="button"
          buttonStyle="solid"
          options={statusFilterOptions}
        />
        <Input
          placeholder="搜索项目..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 200 }}
        />
      </Space>

      {/* 项目卡片墙 */}
      {filteredCards.length === 0 ? (
        <Empty description="暂无匹配的项目" />
      ) : (
        <Row gutter={[16, 16]}>
          {filteredCards.map((project) => (
            <Col xs={24} sm={12} md={8} lg={6} key={project.id}>
              <Card
                hoverable
                loading={loading}
                title={
                  <Space>
                    <span style={{ fontWeight: "bold", fontSize: 16 }}>{project.name}</span>
                    <StatusTag status={project.status} map={projectStatusMap} />
                    {project.risk_level !== "low" && <StatusTag status={project.risk_level} map={riskLevelMap} />}
                  </Space>
                }
                extra={<StatusTag status={project.priority} map={priorityMap} />}
                size="small"
              >
                {/* 编号 + 负责人 */}
                <Descriptions size="small" column={2} colon={false}>
                  <Descriptions.Item label="编号">{project.code}</Descriptions.Item>
                  <Descriptions.Item label="负责人">{project.manager_name || "-"}</Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: "8px 0" }} />

                {/* 子模块状态 */}
                <div style={{ marginBottom: 8 }}>
                  <Space wrap size={[4, 4]}>
                    <span style={{ fontSize: 12, color: "#888" }}>ARM:</span>
                    <StatusTag status={project.arm_status} map={subStatusMap} />
                    <span style={{ fontSize: 12, color: "#888" }}>FPGA:</span>
                    <StatusTag status={project.fpga_status} map={subStatusMap} />
                    <span style={{ fontSize: 12, color: "#888" }}>PC:</span>
                    <StatusTag status={project.pc_status} map={subStatusMap} />
                    <span style={{ fontSize: 12, color: "#888" }}>HW:</span>
                    <StatusTag status={project.hardware_status} map={subStatusMap} />
                  </Space>
                </div>

                {/* 负责人信息 */}
                <Descriptions size="small" column={2} colon={false} style={{ marginBottom: 4 }}>
                  <Descriptions.Item label="软件">{project.software_owner_name || "-"}</Descriptions.Item>
                  <Descriptions.Item label="硬件">{project.hardware_owner_name || "-"}</Descriptions.Item>
                  <Descriptions.Item label="FPGA">{project.fpga_owner_name || "-"}</Descriptions.Item>
                  <Descriptions.Item label="ARM">{project.arm_owner_name || "-"}</Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: "4px 0" }} />

                {/* 设备统计 */}
                <Row gutter={4}>
                  <Col span={6}><Statistic title="设备" value={project.device_count} valueStyle={{ fontSize: 14 }} /></Col>
                  <Col span={6}><Statistic title="已发货" value={project.shipped_count} valueStyle={{ fontSize: 14, color: "#722ed1" }} /></Col>
                  <Col span={6}><Statistic title="客户" value={project.customer_site_count} valueStyle={{ fontSize: 14, color: "#13c2c2" }} /></Col>
                  <Col span={6}><Statistic title="返修" value={project.repairing_count} valueStyle={{ fontSize: 14, color: project.repairing_count > 0 ? "#ff4d4f" : undefined }} /></Col>
                </Row>

                {project.remark && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#888", lineHeight: "18px", maxHeight: 36, overflow: "hidden" }}>
                    💬 {project.remark}
                  </div>
                )}

                <Divider style={{ margin: "4px 0" }} />

                {/* 底部信息 */}
                <div style={{ fontSize: 11, color: "#aaa", display: "flex", justifyContent: "space-between" }}>
                  <span>目标: {project.target_date ? dayjs(project.target_date).format("MM-DD") : "-"}</span>
                  {project.actual_finish_date && <span>完成: {dayjs(project.actual_finish_date).format("MM-DD")}</span>}
                  <span>更新: {dayjs(project.updated_at).format("MM-DD")}</span>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
