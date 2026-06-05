import { useState, useEffect, useCallback } from "react";
import {
  Table, Button, Space, Input, Select, Tag, Modal, Form,
  App, Popconfirm, DatePicker, Typography,
} from "antd";
import { PlusOutlined, SearchOutlined, ExportOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import api, { exportExcel } from "../api";
import { projectStatusMap } from "./statusLabels";
import dayjs from "dayjs";

interface Project {
  id: number;
  name: string;
  code: string;
  description: string;
  status: string;
  startDate: string;
  endDate: string | null;
  managerId: number | null;
  manager_name?: string;
  createdAt: string;
}

interface PersonnelOption {
  id: number;
  name: string;
}

export default function ProjectList() {
  const [data, setData] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [personnelList, setPersonnelList] = useState<PersonnelOption[]>([]);
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
    } catch {
      message.error("加载失败");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, message]);

  const fetchPersonnel = useCallback(async () => {
    try {
      const res = await api.get("/personnel");
      setPersonnelList(res.data.data || []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAdd = () => {
    setEditing(null);
    form.resetFields();
    fetchPersonnel();
    setModalOpen(true);
  };

  const handleEdit = (record: Project) => {
    setEditing(record);
    fetchPersonnel();
    form.setFieldsValue({
      ...record,
      startDate: record.startDate ? dayjs(record.startDate) : undefined,
      endDate: record.endDate ? dayjs(record.endDate) : undefined,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/projects/${id}`);
      message.success("删除成功");
      fetchData();
    } catch {
      message.error("删除失败");
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        ...values,
        startDate: values.startDate?.toISOString(),
        endDate: values.endDate?.toISOString() || null,
      };
      if (editing) {
        await api.put(`/projects/${editing.id}`, payload);
        message.success("更新成功");
      } else {
        await api.post("/projects", payload);
        message.success("添加成功");
      }
      setModalOpen(false);
      fetchData();
    } catch {
      /* validation error */
    }
  };

  const handleExport = async () => {
    try {
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      const blob = await exportExcel("/export/project", params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `projects_${Date.now()}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      message.success("导出成功");
    } catch {
      message.error("导出失败");
    }
  };

  const columns: ColumnsType<Project> = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "项目名称", dataIndex: "name", width: 180, ellipsis: true },
    { title: "项目编号", dataIndex: "code", width: 120 },
    {
      title: "状态", dataIndex: "status", width: 100,
      render: (s: string) => {
        const cfg = projectStatusMap[s];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : s;
      },
    },
    { title: "负责人", dataIndex: "manager_name", width: 100 },
    { title: "开始日期", dataIndex: "start_date", width: 110, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
    { title: "结束日期", dataIndex: "end_date", width: 110, render: (d: string) => d ? dayjs(d).format("YYYY-MM-DD") : "-" },
    { title: "描述", dataIndex: "description", ellipsis: true },
    {
      title: "操作", key: "action", width: 160, fixed: "right",
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={3}>项目管理</Typography.Title>

      {/* 工具栏 */}
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="搜索项目..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 250 }}
        />
        <Select
          placeholder="筛选状态"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 140 }}
          options={Object.entries(projectStatusMap).map(([k, v]) => ({ value: k, label: v.label }))}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加项目</Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>导出Excel</Button>
      </Space>

      {/* 数据表格 */}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={loading}
        scroll={{ x: 1000 }}
        pagination={{ pageSize: 15, showSizeChanger: true, showTotal: (t) => `共 ${t} 条` }}
      />

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editing ? "编辑项目" : "添加项目"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: "请输入项目名称" }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label="项目编号">
            <Input />
          </Form.Item>
          <Form.Item name="status" label="状态" initialValue="active">
            <Select options={Object.entries(projectStatusMap).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Form.Item>
          <Form.Item name="managerId" label="负责人">
            <Select
              allowClear
              placeholder="选择负责人"
              options={personnelList.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>
          <Form.Item name="startDate" label="开始日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="endDate" label="结束日期">
            <DatePicker style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
