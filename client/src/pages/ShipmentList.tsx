import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Tag, Modal, Form, App, Popconfirm, Typography, DatePicker } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import { shipmentStatusMap } from "./statusLabels";
import dayjs from "dayjs";

interface Shipment {
  id: number; recipient: string; recipient_phone: string; address: string; tracking_number: string;
  ship_date: string; status: string; note: string; deviceId: number | null; projectId: number | null;
  device_name?: string; project_name?: string;
}

export default function ShipmentList() {
  const [data, setData] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Shipment | null>(null);
  const [devices, setDevices] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get("/shipments", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, statusFilter, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOpts = async () => {
    const [d, p] = await Promise.all([api.get("/devices"), api.get("/projects")]);
    setDevices(d.data.data || []); setProjects(p.data.data || []);
  };

  const handleAdd = () => { setEditing(null); form.resetFields(); fetchOpts(); setModalOpen(true); };
  const handleEdit = (r: Shipment) => { setEditing(r); fetchOpts(); form.setFieldsValue({ ...r, shipDate: r.ship_date ? dayjs(r.ship_date) : undefined }); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/shipments/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const v = await form.validateFields();
    const payload = { ...v, shipDate: v.shipDate?.toISOString() };
    if (editing) { await api.put(`/shipments/${editing.id}`, payload); message.success("更新成功"); }
    else { await api.post("/shipments", payload); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<Shipment> = [
    { title: "ID", dataIndex: "id", width: 50 },
    { title: "收货人", dataIndex: "recipient", width: 100 },
    { title: "电话", dataIndex: "recipient_phone", width: 120 },
    { title: "地址", dataIndex: "address", width: 180, ellipsis: true },
    { title: "快递单号", dataIndex: "tracking_number", width: 130 },
    { title: "发货日期", dataIndex: "ship_date", width: 110, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
    { title: "状态", dataIndex: "status", width: 100, render: (s: string) => { const c = shipmentStatusMap[s]; return c ? <Tag color={c.color}>{c.label}</Tag> : s; } },
    { title: "关联设备", dataIndex: "device_name", width: 120 },
    { title: "关联项目", dataIndex: "project_name", width: 120 },
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
      <Typography.Title level={3}>发货管理</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
        <Select placeholder="筛选状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 140 }}
          options={Object.entries(shipmentStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加发货</Button>
        <Button icon={<ExportOutlined />} onClick={async () => {
          const blob = await exportExcel("/export/shipment"); const url = URL.createObjectURL(blob);
          const a = document.createElement("a"); a.href = url; a.download = `shipments.xlsx`; a.click(); URL.revokeObjectURL(url);
        }}>导出Excel</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1300 }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑发货" : "添加发货"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="recipient" label="收货人" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="recipientPhone" label="联系电话"><Input /></Form.Item>
          <Form.Item name="address" label="收货地址"><Input /></Form.Item>
          <Form.Item name="trackingNumber" label="快递单号"><Input /></Form.Item>
          <Form.Item name="shipDate" label="发货日期"><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="status" label="状态" initialValue="in_transit">
            <Select options={Object.entries(shipmentStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="deviceId" label="关联设备">
            <Select allowClear placeholder="选择设备" options={devices.map((d) => ({ value: d.id, label: d.name }))} />
          </Form.Item>
          <Form.Item name="projectId" label="关联项目">
            <Select allowClear placeholder="选择项目" options={projects.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
          <Form.Item name="note" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
