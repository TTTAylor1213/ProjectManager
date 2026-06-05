import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Select, Modal, Form, App, Popconfirm, Typography } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import dayjs from "dayjs";

interface Note {
  id: number; target_type: string; target_id: number; content: string; authorId: number | null;
  author_name?: string; created_at: string;
}

const targetTypeMap: Record<string, string> = {
  project: "项目", device: "设备", shipment: "发货", repair: "维修",
  rd_device: "在研设备", software: "软件", hardware: "硬件",
};

export default function NoteList() {
  const [data, setData] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [personnel, setPersonnel] = useState<{ id: number; name: string }[]>([]);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.target_type = typeFilter;
      const res = await api.get("/notes", { params });
      setData(res.data.data);
    } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, typeFilter, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => { form.resetFields(); api.get("/personnel").then(r => setPersonnel(r.data.data || [])).catch(() => {}); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/notes/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    await api.post("/notes", values);
    message.success("添加成功"); setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<Note> = [
    { title: "ID", dataIndex: "id", width: 50 },
    { title: "关联类型", dataIndex: "target_type", width: 100, render: (t: string) => targetTypeMap[t] || t },
    { title: "关联ID", dataIndex: "target_id", width: 80 },
    { title: "内容", dataIndex: "content", width: 350, ellipsis: true },
    { title: "作者", dataIndex: "author_name", width: 100 },
    { title: "时间", dataIndex: "created_at", width: 160, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "-" },
    { title: "操作", key: "act", width: 100, fixed: "right", render: (_, r) => (
        <Popconfirm title="确认删除？" onConfirm={() => handleDelete(r.id)}>
          <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
        </Popconfirm>
    )},
  ];

  return (
    <div>
      <Typography.Title level={3}>备注日志</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索备注..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
        <Select placeholder="筛选类型" value={typeFilter} onChange={setTypeFilter} allowClear style={{ width: 140 }}
          options={Object.entries(targetTypeMap).map(([k, v]) => ({ value: k, label: v }))} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加备注</Button>
        <Button icon={<ExportOutlined />} onClick={async () => { const blob = await exportExcel("/export/note"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `notes.xlsx`; a.click(); URL.revokeObjectURL(url); }}>导出Excel</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 900 }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title="添加备注" open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={500} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="targetType" label="关联类型" rules={[{ required: true }]}>
            <Select options={Object.entries(targetTypeMap).map(([k, v]) => ({ value: k, label: v }))} />
          </Form.Item>
          <Form.Item name="targetId" label="关联ID" rules={[{ required: true }]}>
            <Input type="number" />
          </Form.Item>
          <Form.Item name="content" label="内容" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item name="authorId" label="作者">
            <Select allowClear placeholder="选择作者" options={personnel.map((p) => ({ value: p.id, label: p.name }))} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
