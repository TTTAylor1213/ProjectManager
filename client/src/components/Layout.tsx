import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, theme } from "antd";
import {
  DashboardOutlined,
  ProjectOutlined,
  ToolOutlined,
  SendOutlined,
  SettingOutlined,
  ExperimentOutlined,
  CodeOutlined,
  DatabaseOutlined,
  TeamOutlined,
  FileTextOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: "/", icon: <DashboardOutlined />, label: "仪表盘" },
  { key: "/projects", icon: <ProjectOutlined />, label: "项目管理" },
  { key: "/devices", icon: <ToolOutlined />, label: "设备管理" },
  { key: "/shipments", icon: <SendOutlined />, label: "发货管理" },
  { key: "/repairs", icon: <SettingOutlined />, label: "维修管理" },
  { key: "/rd-devices", icon: <ExperimentOutlined />, label: "在研设备" },
  { key: "/software", icon: <CodeOutlined />, label: "软件管理" },
  { key: "/hardware", icon: <DatabaseOutlined />, label: "硬件管理" },
  { key: "/personnel", icon: <TeamOutlined />, label: "负责人" },
  { key: "/notes", icon: <FileTextOutlined />, label: "备注日志" },
];

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div
          style={{
            height: 48,
            margin: 16,
            color: "#fff",
            fontWeight: "bold",
            fontSize: collapsed ? 14 : 16,
            textAlign: "center",
            lineHeight: "48px",
            overflow: "hidden",
            whiteSpace: "nowrap",
          }}
        >
          {collapsed ? "研管" : "设备研发项目管理系统"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: "0 24px",
            background: colorBgContainer,
            fontSize: 18,
            fontWeight: 500,
          }}
        >
          设备研发项目管理系统
        </Header>
        <Content style={{ margin: 16, padding: 24, background: colorBgContainer }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
