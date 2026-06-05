# 设备研发项目管理系统

Windows 本地部署的极简设备研发状态看板。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite 6 + TypeScript + Ant Design 5 |
| 后端 | Express + TypeScript |
| 数据库 | SQLite (sql.js，纯 WASM，无需安装) |
| 运行 | npm workspaces + concurrently |

## 功能模块

- **状态看板** — 项目卡片墙，一眼看清所有项目 ARM/FPGA/PC/硬件状态
- **项目管理** — 项目 CRUD，含负责人、研发状态、优先级、风险等级
- **设备台账** — 设备 CRUD，含版本号、发货状态、维修状态、客户信息
- **发货记录** — 发货管理，联动更新设备发货状态
- **维修记录** — 维修管理，联动更新设备维修状态
- **软件版本** — 软件版本记录
- **硬件版本** — 硬件版本记录
- **人员管理** — 人员维护（仅存联系方式，不做权限）
- **备注记录** — 通用备注/日志
- **导出 Excel** — 所有模块数据可导出

## 快速开始

### 前提条件

- Node.js >= 18（推荐 v20 LTS）
- npm >= 9

### 一键启动

```bash
# 安装依赖
npm install

# 启动前后端
npm run dev
```

或双击 `start.bat`。

### 访问

- 前端页面：http://localhost:5173
- 后端 API：http://localhost:3001

## 数据库

- 文件位置：`data/project-manager.db`
- 引擎：sql.js（SQLite WASM 版本，零原生依赖）
- 首次启动自动建表 + 迁移 + 插入示例数据

### 备份方式

直接复制 `data/project-manager.db` 文件即可。

## 目录结构

```
ProjectManager/
├── client/               # React 前端
│   └── src/
│       ├── components/   # StatusTag, Layout, ProjectDetailModal
│       ├── pages/        # Dashboard + 9 张管理页面
│       └── api/          # API 调用封装
├── server/               # Express 后端
│   └── src/
│       ├── db/           # 数据库初始化、迁移、种子数据
│       └── routes/       # REST API 路由
├── shared/types.ts       # 共享类型定义
├── data/                 # SQLite 数据库文件（不提交 git）
├── start.bat             # 一键启动脚本
└── README.md
```

## 常见问题

**Q: 启动报错端口被占用？**
修改 `server/src/index.ts` 中的 `PORT` 和 `client/vite.config.ts` 中的 `server.port`。

**Q: 数据库损坏？**
删除 `data/project-manager.db`，重启后自动重建 + 种子数据。

**Q: 如何清除示例数据？**
删除 `data/project-manager.db` 文件，然后把 `server/src/db/seed.ts` 中的 `seedIfEmpty` 调用注释掉。

**Q: 能在其他机器上运行吗？**
可以。整个项目是纯 JS/WASM，无需安装任何数据库服务或编译工具。
