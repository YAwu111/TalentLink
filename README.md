# TalentLink · 网上招聘系统

软件工程课程设计（编号 020）：网上招聘系统的设计与实现。

- 前端：React 19 + TypeScript + Vite + React Router + Zustand + Tailwind CSS 4 + shadcn/ui + Motion + Axios
- 后端：FastAPI + SQLAlchemy 2.x + SQLite（可切换 MySQL）
- 认证：JWT 访问令牌（1 分钟）+ 数据库刷新令牌（7 天，轮换 + 盗用检测），全部走 httpOnly Cookie
- 目录：`frontend/` 前端工程，`backend/` 后端工程，`docs/` 设计文档

> 当前进度：认证与权限模块；前端已由 Vue 迁移至 React + shadcn/ui + Tailwind CSS + Motion，岗位、投递等后续模块保持原计划。

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
npm install
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

首次运行先复制配置：`copy backend\.env.example backend\.env`（默认连 SQLite，零配置即可跑）。

演示与本地开发用 SQLite（`backend/talentlink.db`），**正式演示切 MySQL**，只改 `.env` 一行：

```ini
DATABASE_URL=mysql+pymysql://root:your_password@127.0.0.1:3306/talentlink?charset=utf8mb4
```

切换前先建库（`CREATE DATABASE talentlink DEFAULT CHARSET utf8mb4;`），驱动 `PyMySQL` 已在
`requirements.txt` 中，启动时 `create_all` 会自动建表并写入种子数据。

表结构与设计说明见 [数据库设计](docs/数据库设计.md)。

## 认证

访问令牌 1 分钟、刷新令牌 7 天，都放在 httpOnly Cookie 里；刷新采用轮换 + 盗用检测。
设计说明见 [认证设计](docs/认证设计.md)。

## 运行日志

控制台 + `backend/logs/app.log`（INFO 及以上）+ `backend/logs/error.log`（仅 ERROR），按天轮转保留 14 天。
每个请求生成 12 位 `request_id`，通过响应头 `X-Request-ID` 回传，排查时 `grep <id> logs/app.log`
即可还原该请求的完整链路。设计说明见 [运行日志](docs/运行日志.md)。

## 目录约定

```
backend/app/
  api/        路由层（按业务域拆分 router）
  core/       配置、安全等基础设施
  db/         会话、模型基类、种子数据
  models/     ORM 模型
  schemas/    Pydantic 出入参
  services/   业务逻辑
frontend/src/
  api/        请求封装（含 401 单飞刷新）
  components/ 可复用组件
    ui/       shadcn/ui 基础组件
    motion/   Motion 动效封装
    auth/     认证业务组件
  pages/      页面（登录、注册、工作台）
  router/     路由与导航守卫
  stores/     Zustand 认证状态
  hooks/      通用 Hook
  lib/        工具函数
  index.css   Tailwind 主题与 shadcn 设计变量
docs/         课程设计文档
```
