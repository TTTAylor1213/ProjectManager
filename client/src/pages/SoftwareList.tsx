import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Modal, Form, App, Popconfirm, Typography, DatePicker } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import StatusTag from "../components/StatusTag";
import { softwareStatusMap } from "./statusLabels";
import dayjs from "dayjs";

interface Software {
  id: number; name: string; version: string; status: string; update_date: string; note: string;
  developer_id: number | null; device_id: number | null; project_id: number | null;
  device_name?: string; project_name?: string; developer_name?: string;
}

export default function SoftwareList() {
  const [data, setData] = useState<Software[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Software | null>(null);
  const [devices, setDevices] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [personnel, setPersonnel] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/software", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, statusFilter, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOpts = async () => {
    const [d, p, pe] = await Promise.all([api.get("/devices"), api.get("/projects"), api.get("/personnel")]);
    setDevices(d.data.data || []); setProjects(p.data.data || []); setPersonnel(pe.data.data || []);
  };

  const handleAdd = () => { setEditing(null); form.resetFields(); fetchOpts(); setModalOpen(true); };
  const handleEdit = (r: Software) => { setEditing(r); fetchOpts(); form.setFieldsValue({ ...r, updateDate: r.update_date ? dayjs(r.update_date) : undefined, developerId: r.developer_id, deviceId: r.device_id, projectId: r.project_id }); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/software/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const v = await form.validateFields();
    const payload = { ...v, updateDate: v.updateDate?.toISOString() };
    if (editing) { await api.put(`/software/${editing.id}`, payload); message.success("更新成功"); }
    else { await api.post("/software", payload); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<Software> = [
    { title: "ID", dataIndex: "id", width: 50 },
    { title: "软件名称", dataIndex: "name", width: 140 },
    { title: "版本", dataIndex: "version", width: 100 },
    { title: "状态", dataIndex: "status", width: 100, render: (s: string) => <StatusTag status={s} map={softwareStatusMap} /> },
    { title: "更新日期", dataIndex: "update_date", width: 110, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
    { title: "开发者", dataIndex: "developer_name", width: 100 },
    { title: "关联设备", dataIndex: "device_name", width: 120 },
    { title: "关联项目", dataIndex: "project_name", width: 120 },
    { title: "备注", dataIndex: "note", width: 150, ellipsis: true },
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
      <Typography.Title level={3}>软件管理</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
        <Select placeholder="筛选状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 140 }}
          options={Object.entries(softwareStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加软件</Button>
        <Button icon={<ExportOutlined />} onClick={async () => { const blob = await exportExcel("/export/software"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `software.xlsx`; a.click(); URL.revokeObjectURL(url); }}>导出Excel</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1200 }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑软件" : "添加软件"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="软件名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="version" label="版本"><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue="developing">
            <Select options={Object.entries(softwareStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="updateDate" label="更新日期"><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="developerId" label="开发者"><Select allowClear placeholder="选择开发者" options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
          <Form.Item name="deviceId" label="关联设备"><Select allowClear placeholder="选择设备" options={devices.map((d) => ({ value: d.id, label: d.name }))} /></Form.Item>
          <Form.Item name="projectId" label="关联项目"><Select allowClear placeholder="选择项目" options={projects.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
          <Form.Item name="note" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
