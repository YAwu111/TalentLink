# TalentLink · 网上招聘系统

软件工程课程设计（编号 020）：网上招聘系统的设计与实现。

- 前端：React 19 + TypeScript + Vite + React Router + Zustand + Tailwind CSS 4 + shadcn/ui + Motion + Axios
- 后端：FastAPI + SQLAlchemy 2.x + SQLite（可切换 MySQL）
- 识别：PyMuPDF + python-docx + RapidOCR（本地 OCR）+ 规则抽取 + 字段级置信度
- 认证：JWT 访问令牌（1 分钟）+ 数据库刷新令牌（7 天，轮换 + 盗用检测），全部走 httpOnly Cookie
- 目录：`frontend/` 前端工程，`backend/` 后端工程，`docs/` 设计文档

> 当前进度：认证与权限、企业资料与上传、文档/身份认证 B1/B2、管理员审核 B3、本地 OCR/规则识别与 B4 企业认证状态、求职者资料/工作经历/工作台/简历、真实岗位浏览与投递、企业岗位创建/编辑/发布/关闭、企业查看投递简历与状态流转、录取通知发送/接受/拒绝与单录取约束。Offer 状态机已实现；管理员信息管理待接入。

## Docker 一键启动

需要 Docker 与 Docker Compose。

```bash
copy .env.docker.example .env
docker compose up -d --build
```

访问：http://localhost:8080

- 接口文档：http://localhost:8080/docs
- 前端由 Nginx 托管，`/api` 反向代理到后端
- SQLite、上传文件、日志统一保存在 named volume `talentlink-data`
- 首次启动会执行 seed；`SEED_DEMO=false` 可关闭演示数据
- `.env` 中的 `JWT_SECRET` 和 `ADMIN_PASSWORD` 必须修改后再用于正式演示

常用命令：

```bash
docker compose ps
docker compose logs -f backend
docker compose down
docker compose down -v   # 同时删除数据库、上传文件和日志
```

生产环境需要 HTTPS 时，把 `COOKIE_SECURE=true` 并配置 TLS 终止。详细部署说明见 [Docker 部署设计](docs/Docker部署.md)。

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

资料上传默认连接后端本地 OCR/规则识别；如需离线演示，复制 `frontend/.env.example`
为 `frontend/.env.local` 并设置 `VITE_RECOGNITION_PROVIDER=mock`。

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

## 企业资料

企业资料支持字段级自动保存与资料完整度计算；完整度作为后续投递/推送的闸门。
设计说明见 [企业资料与文档识别设计](docs/企业资料设计.md)。

## 求职者

求职者资料支持 13 项必填字段、可选工作经历、字段级自动保存、简历 OCR 识别、自动生成简历与打印。
岗位浏览、投递和我的投递已接真实后端；资料不完整或重复投递会被拦截。
求职者可接收多家企业的录用通知，但只能接受一个。
设计说明见 [求职者模块设计](docs/求职者模块设计.md)。

## 企业招聘

企业可创建、编辑、发布和关闭岗位；发布前校验企业资料完整度，关闭后岗位从求职者列表下架。
企业可查看投递简历并标记已查看/面试中/未通过，也可以发放/修改/撤回录用通知。
企业查看投递与状态流转已实现。设计说明见 [岗位与投递设计](docs/岗位与投递设计.md) 与 [录用通知设计](docs/录用通知设计.md)。

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
    company/  企业资料业务组件
    upload/   上传、识别结果与身份材料组件
    admin/    管理员认证审核组件
    seeker/   求职者资料、岗位、投递、简历组件
  layouts/    登录后的通用布局与顶栏
  pages/      页面（认证、企业、管理员、求职者）  router/     路由与导航守卫
  stores/     Zustand 认证状态
  hooks/      通用与业务 Hook
  lib/        工具函数
  index.css   Tailwind 主题与 shadcn 设计变量
docs/         课程设计文档
```
