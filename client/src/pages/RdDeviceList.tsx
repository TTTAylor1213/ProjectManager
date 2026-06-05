import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Modal, Form, App, Popconfirm, Typography, DatePicker } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import StatusTag from "../components/StatusTag";
import { rdPhaseMap } from "./statusLabels";
import dayjs from "dayjs";

interface RdDevice {
  id: number; name: string; model: string; research_phase: string; current_status: string;
  target_date: string; specs: string; responsible_id: number | null; project_id: number | null;
  project_name?: string; responsible_name?: string;
}

export default function RdDeviceList() {
  const [data, setData] = useState<RdDevice[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RdDevice | null>(null);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [personnel, setPersonnel] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (phaseFilter) params.research_phase = phaseFilter;
      const res = await api.get("/rd-devices", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, phaseFilter, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOpts = async () => {
    const [p, pe] = await Promise.all([api.get("/projects"), api.get("/personnel")]);
    setProjects(p.data.data || []); setPersonnel(pe.data.data || []);
  };

  const handleAdd = () => { setEditing(null); form.resetFields(); fetchOpts(); setModalOpen(true); };
  const handleEdit = (r: RdDevice) => { setEditing(r); fetchOpts(); form.setFieldsValue({ ...r, targetDate: r.target_date ? dayjs(r.target_date) : undefined, projectId: r.project_id, responsibleId: r.responsible_id, researchPhase: r.research_phase, currentStatus: r.current_status }); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/rd-devices/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const v = await form.validateFields();
    const payload = { ...v, targetDate: v.targetDate?.toISOString() || "" };
    if (editing) { await api.put(`/rd-devices/${editing.id}`, payload); message.success("更新成功"); }
    else { await api.post("/rd-devices", payload); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<RdDevice> = [
    { title: "ID", dataIndex: "id", width: 50 },
    { title: "设备名称", dataIndex: "name", width: 150 },
    { title: "型号", dataIndex: "model", width: 100 },
    { title: "研发阶段", dataIndex: "research_phase", width: 100, render: (s: string) => <StatusTag status={s} map={rdPhaseMap} /> },
    { title: "当前状态", dataIndex: "current_status", width: 150, ellipsis: true },
    { title: "目标日期", dataIndex: "target_date", width: 110, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
    { title: "规格参数", dataIndex: "specs", width: 180, ellipsis: true },
    { title: "所属项目", dataIndex: "project_name", width: 130 },
    { title: "负责人", dataIndex: "responsible_name", width: 100 },
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
      <Typography.Title level={3}>在研设备</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
        <Select placeholder="筛选阶段" value={phaseFilter} onChange={setPhaseFilter} allowClear style={{ width: 140 }}
          options={Object.entries(rdPhaseMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加设备</Button>
        <Button icon={<ExportOutlined />} onClick={async () => { const blob = await exportExcel("/export/rd_device"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `rd_devices.xlsx`; a.click(); URL.revokeObjectURL(url); }}>导出Excel</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1200 }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑在研设备" : "添加在研设备"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="model" label="型号"><Input /></Form.Item>
          <Form.Item name="researchPhase" label="研发阶段" initialValue="requirement">
            <Select options={Object.entries(rdPhaseMap).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="currentStatus" label="当前状态"><Input /></Form.Item>
          <Form.Item name="targetDate" label="目标日期"><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="specs" label="规格参数"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="projectId" label="所属项目"><Select allowClear placeholder="选择项目" options={projects.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
          <Form.Item name="responsibleId" label="负责人"><Select allowClear placeholder="选择负责人" options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
