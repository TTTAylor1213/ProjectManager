import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Tag, Modal, Form, App, Popconfirm, Typography } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import { deviceStatusMap } from "./statusLabels";
import dayjs from "dayjs";

interface Device {
  id: number; name: string; model: string; serial_number: string; device_type: string;
  status: string; location: string; projectId: number | null; responsibleId: number | null;
  project_name?: string; responsible_name?: string;
}

interface Option { id: number; name: string; }

export default function DeviceList() {
  const [data, setData] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
  const [projects, setProjects] = useState<Option[]>([]);
  const [personnel, setPersonnel] = useState<Option[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/devices", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); }
    finally { setLoading(false); }
  }, [search, statusFilter, message]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOptions = async () => {
    const [pr, pe] = await Promise.all([api.get("/projects"), api.get("/personnel")]);
    setProjects(pr.data.data || []);
    setPersonnel(pe.data.data || []);
  };

  const handleAdd = () => { setEditing(null); form.resetFields(); fetchOptions(); setModalOpen(true); };
  const handleEdit = (r: Device) => { setEditing(r); fetchOptions(); form.setFieldsValue(r); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/devices/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) { await api.put(`/devices/${editing.id}`, values); message.success("更新成功"); }
    else { await api.post("/devices", values); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };
  const handleExport = async () => {
    const params: Record<string, string> = {};
    if (statusFilter) params.status = statusFilter;
    const blob = await exportExcel("/export/device", params);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `devices_${Date.now()}.xlsx`; a.click();
    URL.revokeObjectURL(url); message.success("导出成功");
  };

  const columns: ColumnsType<Device> = [
    { title: "ID", dataIndex: "id", width: 50 },
    { title: "设备名称", dataIndex: "name", width: 150 },
    { title: "型号", dataIndex: "model", width: 100 },
    { title: "序列号", dataIndex: "serial_number", width: 120 },
    { title: "类型", dataIndex: "device_type", width: 100 },
    { title: "状态", dataIndex: "status", width: 100, render: (s: string) => { const c = deviceStatusMap[s]; return c ? <Tag color={c.color}>{c.label}</Tag> : s; } },
    { title: "位置", dataIndex: "location", width: 120 },
    { title: "所属项目", dataIndex: "project_name", width: 140 },
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
      <Typography.Title level={3}>设备管理</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
        <Select placeholder="筛选状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 140 }}
          options={Object.entries(deviceStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加设备</Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>导出Excel</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1200 }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑设备" : "添加设备"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="设备名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="model" label="型号"><Input /></Form.Item>
          <Form.Item name="serialNumber" label="序列号"><Input /></Form.Item>
          <Form.Item name="deviceType" label="设备类型"><Input /></Form.Item>
          <Form.Item name="status" label="状态" initialValue="normal">
            <Select options={Object.entries(deviceStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="location" label="位置"><Input /></Form.Item>
          <Form.Item name="projectId" label="所属项目">
            <Select allowClear placeholder="选择项目" options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item name="responsibleId" label="负责人">
            <Select allowClear placeholder="选择负责人" options={personnel.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
