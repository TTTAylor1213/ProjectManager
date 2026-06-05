import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Modal, Form, App, Popconfirm, Typography, DatePicker } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import StatusTag from "../components/StatusTag";
import { projectStatusMap, subStatusMap, priorityMap, riskLevelMap } from "./statusLabels";
import dayjs from "dayjs";

interface Project {
  id: number; name: string; code: string; description: string; status: string;
  start_date: string; end_date: string | null; target_date: string; actual_finish_date: string | null;
  manager_id: number | null; software_owner_id: number | null; hardware_owner_id: number | null;
  fpga_owner_id: number | null; arm_owner_id: number | null;
  arm_status: string; fpga_status: string; pc_status: string; hardware_status: string;
  priority: string; risk_level: string; remark: string;
  manager_name?: string; software_owner_name?: string; hardware_owner_name?: string;
  fpga_owner_name?: string; arm_owner_name?: string;
}

export default function ProjectList() {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [personnel, setPersonnel] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/projects", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, statusFilter, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchPersonnel = async () => {
    try { const res = await api.get("/personnel"); setPersonnel(res.data.data || []); } catch { /* ignore */ }
  };
  const handleAdd = () => { setEditing(null); form.resetFields(); fetchPersonnel(); setModalOpen(true); };
  const handleEdit = (r: Project) => { setEditing(r); fetchPersonnel(); form.setFieldsValue({ ...r, startDate: r.start_date ? dayjs(r.start_date) : undefined, endDate: r.end_date ? dayjs(r.end_date) : undefined, targetDate: r.target_date ? dayjs(r.target_date) : undefined, actualFinishDate: r.actual_finish_date ? dayjs(r.actual_finish_date) : undefined, managerId: r.manager_id, softwareOwnerId: r.software_owner_id, hardwareOwnerId: r.hardware_owner_id, fpgaOwnerId: r.fpga_owner_id, armOwnerId: r.arm_owner_id, armStatus: r.arm_status, fpgaStatus: r.fpga_status, pcStatus: r.pc_status, hardwareStatus: r.hardware_status, riskLevel: r.risk_level }); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/projects/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    const payload = { ...values, startDate: values.startDate?.toISOString(), endDate: values.endDate?.toISOString() || null, targetDate: values.targetDate?.toISOString() || "", actualFinishDate: values.actualFinishDate?.toISOString() || null };
    if (editing) { await api.put(`/projects/${editing.id}`, payload); message.success("更新成功"); }
    else { await api.post("/projects", payload); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<Project> = [
    { title: "ID", dataIndex: "id", width: 45 },
    { title: "项目名称", dataIndex: "name", width: 150, ellipsis: true },
    { title: "编号", dataIndex: "code", width: 100 },
    { title: "状态", dataIndex: "status", width: 80, render: (s: string) => <StatusTag status={s} map={projectStatusMap} /> },
    { title: "优先级", dataIndex: "priority", width: 70, render: (s: string) => <StatusTag status={s} map={priorityMap} /> },
    { title: "风险", dataIndex: "risk_level", width: 80, render: (s: string) => <StatusTag status={s} map={riskLevelMap} /> },
    { title: "负责人", dataIndex: "manager_name", width: 80 },
    { title: "ARM", dataIndex: "arm_status", width: 80, render: (s: string) => <StatusTag status={s} map={subStatusMap} /> },
    { title: "FPGA", dataIndex: "fpga_status", width: 80, render: (s: string) => <StatusTag status={s} map={subStatusMap} /> },
    { title: "PC", dataIndex: "pc_status", width: 80, render: (s: string) => <StatusTag status={s} map={subStatusMap} /> },
    { title: "硬件", dataIndex: "hardware_status", width: 80, render: (s: string) => <StatusTag status={s} map={subStatusMap} /> },
    { title: "目标日期", dataIndex: "target_date", width: 100, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
    { title: "操作", key: "act", width: 150, fixed: "right", render: (_, r) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
    )},
  ];

  return (
    <div>
      <Typography.Title level={3}>项目管理</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 200 }} />
        <Select placeholder="筛选状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 120 }} options={Object.entries(projectStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加项目</Button>
        <Button icon={<ExportOutlined />} onClick={async () => { const blob = await exportExcel("/export/project"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `projects.xlsx`; a.click(); URL.revokeObjectURL(url); }}>导出</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1400 }} pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑项目" : "添加项目"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={750} destroyOnClose>
        <Form form={form} layout="vertical">
          <Typography.Title level={5} style={{ marginTop: 0 }}>基本信息</Typography.Title>
          <Space wrap>
            <Form.Item name="name" label="项目名称" rules={[{ required: true }]}><Input style={{ width: 200 }} /></Form.Item>
            <Form.Item name="code" label="项目编号"><Input style={{ width: 150 }} /></Form.Item>
            <Form.Item name="status" label="状态" initialValue="active"><Select style={{ width: 110 }} options={Object.entries(projectStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="priority" label="优先级" initialValue="normal"><Select style={{ width: 90 }} options={Object.entries(priorityMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="riskLevel" label="风险等级" initialValue="low"><Select style={{ width: 100 }} options={Object.entries(riskLevelMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="startDate" label="开始日期"><DatePicker /></Form.Item>
            <Form.Item name="targetDate" label="目标日期"><DatePicker /></Form.Item>
            <Form.Item name="endDate" label="结束日期"><DatePicker /></Form.Item>
            <Form.Item name="actualFinishDate" label="实际完成"><DatePicker /></Form.Item>
          </Space>
          <Typography.Title level={5}>负责人</Typography.Title>
          <Space wrap>
            <Form.Item name="managerId" label="项目负责人"><Select allowClear style={{ width: 130 }} options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
            <Form.Item name="softwareOwnerId" label="软件负责人"><Select allowClear style={{ width: 130 }} options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
            <Form.Item name="hardwareOwnerId" label="硬件负责人"><Select allowClear style={{ width: 130 }} options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
            <Form.Item name="fpgaOwnerId" label="FPGA负责人"><Select allowClear style={{ width: 130 }} options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
            <Form.Item name="armOwnerId" label="ARM负责人"><Select allowClear style={{ width: 130 }} options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
          </Space>
          <Typography.Title level={5}>研发状态</Typography.Title>
          <Space wrap>
            <Form.Item name="armStatus" label="ARM状态" initialValue="not_started"><Select style={{ width: 130 }} options={Object.entries(subStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="fpgaStatus" label="FPGA状态" initialValue="not_started"><Select style={{ width: 130 }} options={Object.entries(subStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="pcStatus" label="PC软件状态" initialValue="not_started"><Select style={{ width: 150 }} options={Object.entries(subStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="hardwareStatus" label="硬件状态" initialValue="not_started"><Select style={{ width: 130 }} options={Object.entries(subStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
          </Space>
          <Form.Item name="description" label="项目描述"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
