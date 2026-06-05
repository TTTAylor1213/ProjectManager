import { useState, useEffect, useCallback } from "react";
import { Table, Button, Space, Input, Modal, Form, App, Popconfirm, Typography } from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import dayjs from "dayjs";

interface Personnel {
  id: number; name: string; department: string; phone: string; email: string; role: string; remark: string; created_at: string;
}

export default function PersonnelList() {
  const [data, setData] = useState<Personnel[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Personnel | null>(null);
  const [form] = Form.useForm();
  const { message } = App.useApp();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get("/personnel", { params: search ? { search } : {} }); setData(res.data.data); } catch { message.error("加载失败"); } finally { setLoading(false); }
  }, [search, message]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => { setEditing(null); form.resetFields(); setModalOpen(true); };
  const handleEdit = (r: Personnel) => { setEditing(r); form.setFieldsValue(r); setModalOpen(true); };
  const handleDelete = async (id: number) => { await api.delete(`/personnel/${id}`); message.success("删除成功"); fetchData(); };
  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (editing) { await api.put(`/personnel/${editing.id}`, values); message.success("更新成功"); }
    else { await api.post("/personnel", values); message.success("添加成功"); }
    setModalOpen(false); fetchData();
  };

  const columns: ColumnsType<Personnel> = [
    { title: "ID", dataIndex: "id", width: 50 },
    { title: "姓名", dataIndex: "name", width: 100 },
    { title: "部门", dataIndex: "department", width: 100 },
    { title: "角色", dataIndex: "role", width: 100 },
    { title: "电话", dataIndex: "phone", width: 130 },
    { title: "邮箱", dataIndex: "email", width: 180 },
    { title: "备注", dataIndex: "remark", ellipsis: true },
    { title: "创建时间", dataIndex: "created_at", width: 110, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
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
      <Typography.Title level={3}>人员管理</Typography.Title>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索..." prefix={<SearchOutlined />} value={search} onChange={(e) => setSearch(e.target.value)} allowClear style={{ width: 250 }} />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加人员</Button>
        <Button icon={<ExportOutlined />} onClick={async () => { const blob = await exportExcel("/export/personnel"); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `personnel.xlsx`; a.click(); URL.revokeObjectURL(url); }}>导出</Button>
      </Space>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} scroll={{ x: 1000 }} pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }} />
      <Modal title={editing ? "编辑人员" : "添加人员"} open={modalOpen} onOk={handleSubmit} onCancel={() => setModalOpen(false)} width={500} destroyOnClose>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="姓名" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department" label="部门"><Input /></Form.Item>
          <Form.Item name="role" label="角色"><Input /></Form.Item>
          <Form.Item name="phone" label="电话"><Input /></Form.Item>
          <Form.Item name="email" label="邮箱"><Input /></Form.Item>
          <Form.Item name="remark" label="备注"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
