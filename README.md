# TalentLink · 网上招聘系统

软件工程课程设计（编号 020）：网上招聘系统的设计与实现。

- 前端：Vue 3 + Vite + Vue Router + Pinia + Element Plus + Axios
- 后端：FastAPI + SQLAlchemy 2.x + SQLite（可切换 MySQL）
- 目录：`frontend/` 前端工程，`backend/` 后端工程

## 启动后端

```bash
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload --port 8000
```

接口文档：http://127.0.0.1:8000/docs

## 启动前端

```bash
cd frontend
npm run dev
```

访问：http://localhost:5173 ，开发期 `/api` 由 Vite 代理到 8000 端口。

## 演示账号

| 角色 | 账号 | 密码 |
|---|---|---|
| 系统管理员 | `yawu1122345` | `dev123123` |
| 企业 | `hr_xinghe` / `hr_lanwan` | `demo123` |
| 求职者 | `seeker_liming` / `seeker_wangfang` | `demo123` |

账号由 `backend/app/db/seed.py` 在后端启动时幂等写入（已存在则跳过）。

## 数据库

默认 SQLite（`backend/talentlink.db`），切换 MySQL 只需修改 `.env` 中的 `DATABASE_URL`。
表结构与设计说明见 [数据库设计](D:\TalentLink\docs\数据库设计.md)。

## 目录约定

```
backend/app/
  api/        路由层（按业务域拆分 router）
  core/       配置、安全等基础设施
  db/         会话、模型基类
frontend/src/
  api/        请求封装
  views/      页面
  components/ 可复用组件
  router/     路由
  stores/     全局状态
  styles/     全局样式
```
