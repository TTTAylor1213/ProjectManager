import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Tag, Modal, Form, App, Popconfirm, Typography, DatePicker, InputNumber } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import StatusTag from "../components/StatusTag";
import { repairStatusMap, faultTypeMap } from "./statusLabels";
import dayjs from "dayjs";

interface Repair { id: number; fault_description: string; fault_type: string; repair_status: string; sent_date: string; returned_date: string | null; repair_provider: string; cost: number; result: string; handler_id: number | null; device_id: number | null; project_id: number | null; device_name?: string; project_name?: string; handler_name?: string; }

export default function RepairList() {
  const [data, setData] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Repair | null>(null);
  const [devices, setDevices] = useState<{ id: number; name: string }[]>([]);
  const [personnel, setPersonnel] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.repair_status = statusFilter;
      const res = await api.get("/repairs", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, statusFilter, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOpts = async () => {
    const [d, p] = await Promise.all([api.get("/devices"), api.get("/personnel")]);
    setDevices(d.data.data || []); setPersonnel(p.data.data || []);
  };
  const handleAdd = () => { setEditing(null); form.resetFields(); fetchOpts(); setModalOpen(true); };
  const handleEdit = (r: Repair) => { setEditing(r); fetchOpts(); form.setFieldsValue({ ...r, sentDate: r.sent_date ? dayjs(r.sent_date) : undefined, returnedDate: r.returned_date ? dayjs(r.returned_date) : undefined, deviceId: r.device_id, handlerId: r.handler_id, faultDescription: r.fault_description, faultType: r.fault_type, repairStatus: r.repair_status, repairProvider: r.repair_provider }); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/repairs/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const v = await form.validateFields();
    const payload = { ...v, sentDate: v.sentDate?.toISOString(), returnedDate: v.returnedDate?.toISOString() || null };
    if (editing) { await api.put(`/repairs/${editing.id}`, payload); message.success("更新成功"); }
    else { await api.post("/repairs", payload); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<Repair> = [
    { title: "ID", dataIndex: "id", width: 50 },
    { title: "设备", dataIndex: "device_name", width: 120 },
    { title: "故障描述", dataIndex: "fault_description", width: 200, ellipsis: true },
    { title: "故障类型", dataIndex: "fault_type", width: 100, render: (s: string) => <StatusTag status={s} map={faultTypeMap} /> },
    { title: "状态", dataIndex: "repair_status", width: 100, render: (s: string) => <StatusTag status={s} map={repairStatusMap} /> },
    { title: "维修方", dataIndex: "repair_provider", width: 100 },
    { title: "费用", dataIndex: "cost", width: 80, render: (c: number) => `¥${c}` },
    { title: "处理人", dataIndex: "handler_name", width: 100 },
    { title: "送修日期", dataIndex: "sent_date", width: 110, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
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
      <Typography.Title level={3}>维修管理</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
        <Select placeholder="筛选状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 140 }} options={Object.entries(repairStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加维修</Button>
        <Button icon={<ExportOutlined />} onClick={async () => { const blob = await exportExcel("/export/repair"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `repairs.xlsx`; a.click(); URL.revokeObjectURL(url); }}>导出</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1200 }} pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑维修" : "添加维修"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={600} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="deviceId" label="关联设备"><Select allowClear placeholder="选择设备" options={devices.map((d) => ({ value: d.id, label: d.name }))} /></Form.Item>
          <Form.Item name="faultDescription" label="故障描述" rules={[{ required: true }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="faultType" label="故障类型"><Select allowClear options={Object.entries(faultTypeMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
          <Form.Item name="repairStatus" label="状态" initialValue="pending"><Select options={Object.entries(repairStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
          <Form.Item name="sentDate" label="送修日期"><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="returnedDate" label="返回日期"><DatePicker style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="repairProvider" label="维修方"><Input /></Form.Item>
          <Form.Item name="cost" label="费用" initialValue={0}><InputNumber style={{ width: "100%" }} min={0} /></Form.Item>
          <Form.Item name="result" label="维修结果"><Input /></Form.Item>
          <Form.Item name="handlerId" label="处理人"><Select allowClear placeholder="选择处理人" options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
