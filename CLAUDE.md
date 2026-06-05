# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## 项目概述

设备研发项目管理系统 — Windows 本地部署的极简设备研发状态看板。

- **远程仓库**: `https://github.com/TTTAylor1213/ProjectManager.git`
- **默认分支**: `main`

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + Vite 6 + TypeScript + Ant Design 5 + react-router-dom |
| 后端 | Express + TypeScript |
| 数据库 | SQLite (sql.js — 纯 WASM，零原生依赖) |
| 导出 | ExcelJS |
| 构建 | npm workspaces + concurrently |

## 目录结构

```
ProjectManager/
├── client/src/
│   ├── components/   # StatusTag.tsx, Layout.tsx, ProjectDetailModal.tsx
│   ├── pages/        # Dashboard.tsx + 9 个管理页面
│   │   └── statusLabels.ts  # 所有状态标签映射
│   └── api/index.ts  # Axios 封装
├── server/src/
│   ├── db/           # index.ts(连接), migrate.ts(迁移), seed.ts(种子数据)
│   ├── routes/       # 11 组 REST API 路由
│   └── utils.ts      # now(), buildWhere()
├── shared/types.ts   # 共享类型定义（供参考）
├── data/             # SQLite 数据库文件
└── start.bat         # 一键启动
```

## 启动方式

```bash
npm install
npm run dev          # 同时启动前后端
# 后端 → http://localhost:3001
# 前端 → http://localhost:5173
```

## 数据库

- 引擎：sql.js（SQLite WASM）
- 文件：`data/project-manager.db`（.gitignore 忽略）
- 迁移：`server/src/db/migrate.ts`（PRAGMA table_info + ALTER TABLE）
- 种子数据：`server/src/db/seed.ts`（空库时自动插入示例项目 NM9100-8 / EX10XXA）

## 核心 API

| 路径 | 描述 |
|---|---|
| GET /api/dashboard/summary | 统计概览 |
| GET /api/dashboard/cards?status= | 项目卡片聚合数据 |
| CRUD /api/projects | 项目管理 |
| CRUD /api/devices | 设备台账 |
| CRUD /api/personnel | 人员管理 |
| CRUD /api/shipments | 发货记录 |
| CRUD /api/repairs | 维修记录 |
| CRUD /api/software | 软件版本 |
| CRUD /api/hardware | 硬件版本 |
| CRUD /api/notes | 备注记录 |
| GET /api/export/:table | Excel 导出 |

路由模式：所有 CRUD 使用 raw SQL（`query()`, `insert()`, `run()`, `queryOne()`），camelCase 请求体 → snake_case 数据库列。

## 开发约束

- **不要引入 native 编译依赖**（如 better-sqlite3, sqlite3）
- **不要引入登录/权限/角色系统**（第一版不需要）
- **不要做 Docker / 云部署**
- **Dashboard 是最高优先级页面**（卡片式状态墙，不是统计后台）
- **保持 sql.js 方案**（不换成 MySQL/PostgreSQL/Redis）
- **页面用 Modal 弹窗做增改**（不跳转多页）
- 所有状态标签使用统一组件 `StatusTag` + `statusLabels.ts` 中的映射

## 前端页面模式

每个列表页复用同一模式：
- `useState` 管理 data, loading, search, filter, modalOpen, editing
- `useCallback` + `useEffect` 触发 fetchData
- `handleAdd/Edit/Delete/Submit/Export` 处理 CRUD
- Ant Design Table + Modal Form
- 状态标签通过 `<StatusTag status={s} map={xxxMap} />` 渲染

## 数据库表（9 张）

personnel, project, device, shipment, repair, rd_device, software, hardware, note

project 表含 ARM/FPGA/PC/硬件子状态字段、4 个负责人外键。
device 表含版本号、发货状态、维修状态、客户字段。
