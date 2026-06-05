import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Modal, Form, App, Popconfirm, Typography, DatePicker } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import StatusTag from "../components/StatusTag";
import { deviceStatusMap, shipStatusMap, deviceRepairStatusMap } from "./statusLabels";
import dayjs from "dayjs";

interface Device { id: number; name: string; model: string; serial_number: string; device_no: string; device_type: string; status: string; location: string; customer: string; hardware_version: string; software_version: string; fpga_version: string; arm_version: string; ship_status: string; ship_date: string | null; return_date: string | null; repair_status: string; projectId: number | null; responsibleId: number | null; project_name?: string; responsible_name?: string; remark: string; }

export default function DeviceList() {
  const [data, setData] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [shipFilter, setShipFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Device | null>(null);
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
      if (shipFilter) params.ship_status = shipFilter;
      const res = await api.get("/devices", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, statusFilter, shipFilter, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchOpts = async () => {
    const [p, pe] = await Promise.all([api.get("/projects"), api.get("/personnel")]);
    setProjects(p.data.data || []); setPersonnel(pe.data.data || []);
  };
  const handleAdd = () => { setEditing(null); form.resetFields(); fetchOpts(); setModalOpen(true); };
  const handleEdit = (r: Device) => { setEditing(r); fetchOpts(); form.setFieldsValue({ ...r, shipDate: r.ship_date ? dayjs(r.ship_date) : undefined, returnDate: r.return_date ? dayjs(r.return_date) : undefined }); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/devices/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const v = await form.validateFields();
    const payload = { ...v, shipDate: v.shipDate?.toISOString() || null, returnDate: v.returnDate?.toISOString() || null };
    if (editing) { await api.put(`/devices/${editing.id}`, payload); message.success("更新成功"); }
    else { await api.post("/devices", payload); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<Device> = [
    { title: "ID", dataIndex: "id", width: 45 },
    { title: "设备编号", dataIndex: "device_no", width: 110 },
    { title: "设备名称", dataIndex: "name", width: 140 },
    { title: "型号", dataIndex: "model", width: 100 },
    { title: "所属项目", dataIndex: "project_name", width: 120 },
    { title: "状态", dataIndex: "status", width: 90, render: (s: string) => <StatusTag status={s} map={deviceStatusMap} /> },
    { title: "发货", dataIndex: "ship_status", width: 90, render: (s: string) => <StatusTag status={s} map={shipStatusMap} /> },
    { title: "维修", dataIndex: "repair_status", width: 80, render: (s: string) => <StatusTag status={s} map={deviceRepairStatusMap} /> },
    { title: "位置", dataIndex: "location", width: 100 },
    { title: "客户", dataIndex: "customer", width: 100 },
    { title: "硬件版本", dataIndex: "hardware_version", width: 90 },
    { title: "软件版本", dataIndex: "software_version", width: 90 },
    { title: "负责人", dataIndex: "responsible_name", width: 80 },
    { title: "备注", dataIndex: "remark", width: 150, ellipsis: true },
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
      <Typography.Title level={3}>设备台账</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 200 }} />
        <Select placeholder="设备状态" value={statusFilter} onChange={setStatusFilter} allowClear style={{ width: 120 }} options={Object.entries(deviceStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Select placeholder="发货状态" value={shipFilter} onChange={setShipFilter} allowClear style={{ width: 120 }} options={Object.entries(shipStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加设备</Button>
        <Button icon={<ExportOutlined />} onClick={async () => { const blob = await exportExcel("/export/device"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `devices.xlsx`; a.click(); URL.revokeObjectURL(url); }}>导出</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1600 }} pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑设备" : "添加设备"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={700} destroyOnClose>
        <Form form={form} layout="vertical">
          <Typography.Title level={5} style={{ marginTop: 0 }}>基本信息</Typography.Title>
          <Space wrap style={{ width: "100%" }}>
            <Form.Item name="name" label="设备名称" rules={[{ required: true }]}><Input style={{ width: 180 }} /></Form.Item>
            <Form.Item name="model" label="型号"><Input style={{ width: 140 }} /></Form.Item>
            <Form.Item name="deviceNo" label="设备编号"><Input style={{ width: 150 }} /></Form.Item>
            <Form.Item name="serialNumber" label="序列号"><Input style={{ width: 150 }} /></Form.Item>
            <Form.Item name="deviceType" label="设备类型"><Input style={{ width: 120 }} /></Form.Item>
          </Space>
          <Typography.Title level={5}>版本信息</Typography.Title>
          <Space wrap>
            <Form.Item name="hardwareVersion" label="硬件版本"><Input style={{ width: 130 }} /></Form.Item>
            <Form.Item name="softwareVersion" label="软件版本"><Input style={{ width: 130 }} /></Form.Item>
            <Form.Item name="fpgaVersion" label="FPGA版本"><Input style={{ width: 130 }} /></Form.Item>
            <Form.Item name="armVersion" label="ARM版本"><Input style={{ width: 130 }} /></Form.Item>
          </Space>
          <Typography.Title level={5}>状态与位置</Typography.Title>
          <Space wrap>
            <Form.Item name="status" label="设备状态" initialValue="normal"><Select style={{ width: 120 }} options={Object.entries(deviceStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="shipStatus" label="发货状态" initialValue="not_shipped"><Select style={{ width: 120 }} options={Object.entries(shipStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="repairStatus" label="维修状态" initialValue="normal"><Select style={{ width: 120 }} options={Object.entries(deviceRepairStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} /></Form.Item>
            <Form.Item name="location" label="位置"><Input style={{ width: 150 }} /></Form.Item>
            <Form.Item name="customer" label="客户"><Input style={{ width: 150 }} /></Form.Item>
          </Space>
          <Space wrap>
            <Form.Item name="shipDate" label="发货日期"><DatePicker /></Form.Item>
            <Form.Item name="returnDate" label="返厂日期"><DatePicker /></Form.Item>
            <Form.Item name="projectId" label="所属项目"><Select allowClear style={{ width: 160 }} options={projects.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
            <Form.Item name="responsibleId" label="负责人"><Select allowClear style={{ width: 120 }} options={personnel.map((p) => ({ value: p.id, label: p.name }))} /></Form.Item>
          </Space>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
