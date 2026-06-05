import { useState, useEffect } from "react";
import { Row, Col, Card, Statistic, Typography, Table, Tag } from "antd";
import {
  ProjectOutlined, ToolOutlined, SendOutlined, SettingOutlined,
  ExperimentOutlined, CodeOutlined, DatabaseOutlined, TeamOutlined,
} from "@ant-design/icons";
import api from "../api";
import { projectStatusMap, deviceStatusMap, repairStatusMap } from "./statusLabels";
import dayjs from "dayjs";

interface StatCount { total: number; }

export default function Dashboard() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [recentRepairs, setRecentRepairs] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const tables = ["personnel", "project", "device", "shipment", "repair", "rd_device", "software", "hardware", "note"];
        const results = await Promise.all(tables.map((t) => api.get(`/${t === "rd_device" ? "rd-devices" : t === "personnel" ? "personnel" : t + "s"}`)));
        const c: Record<string, number> = {};
        tables.forEach((t, i) => { c[t] = results[i].data.total || results[i].data.data?.length || 0; });
        setCounts(c);

        // 最近项目和维修
        const [pr, rp] = await Promise.all([
          api.get("/projects"),
          api.get("/repairs"),
        ]);
        setRecentProjects((pr.data.data || []).slice(0, 5));
        setRecentRepairs((rp.data.data || []).slice(0, 5));
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  const stats = [
    { title: "项目总数", value: counts.project || 0, icon: <ProjectOutlined />, color: "#1677ff" },
    { title: "设备总数", value: counts.device || 0, icon: <ToolOutlined />, color: "#52c41a" },
    { title: "在研设备", value: counts.rd_device || 0, icon: <ExperimentOutlined />, color: "#722ed1" },
    { title: "发货记录", value: counts.shipment || 0, icon: <SendOutlined />, color: "#13c2c2" },
    { title: "维修记录", value: counts.repair || 0, icon: <SettingOutlined />, color: "#fa8c16" },
    { title: "软件版本", value: counts.software || 0, icon: <CodeOutlined />, color: "#eb2f96" },
    { title: "硬件版本", value: counts.hardware || 0, icon: <DatabaseOutlined />, color: "#2f54eb" },
    { title: "负责人", value: counts.personnel || 0, icon: <TeamOutlined />, color: "#faad14" },
  ];

  return (
    <div>
      <Typography.Title level={3}>仪表盘</Typography.Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((s) => (
          <Col xs={12} sm={8} md={6} key={s.title}>
            <Card>
              <Statistic
                title={s.title}
                value={s.value}
                prefix={<span style={{ color: s.color }}>{s.icon}</span>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 最近项目和维修 */}
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card title="最近项目" style={{ marginBottom: 16 }}>
            <Table
              rowKey="id"
              dataSource={recentProjects}
              pagination={false}
              size="small"
              columns={[
                { title: "名称", dataIndex: "name", ellipsis: true },
                { title: "状态", dataIndex: "status", width: 90, render: (s: string) => { const c = projectStatusMap[s]; return c ? <Tag color={c.color}>{c.label}</Tag> : s; } },
                { title: "日期", dataIndex: "start_date", width: 100, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="最近维修" style={{ marginBottom: 16 }}>
            <Table
              rowKey="id"
              dataSource={recentRepairs}
              pagination={false}
              size="small"
              columns={[
                { title: "故障", dataIndex: "fault_description", ellipsis: true },
                { title: "状态", dataIndex: "repair_status", width: 90, render: (s: string) => { const c = repairStatusMap[s]; return c ? <Tag color={c.color}>{c.label}</Tag> : s; } },
                { title: "费用", dataIndex: "cost", width: 80, render: (c: number) => `¥${c}` },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
