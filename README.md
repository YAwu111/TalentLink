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
