# Docker 部署设计

## 1. 部署结构

```text
浏览器
  │ :8080
  ▼
Nginx（web 容器）
  ├── /            React 静态文件（Vite build）
  ├── /assets/     带长期缓存
  ├── /api/       反向代理到 backend:8000
  ├── /docs       FastAPI Swagger UI
  └── /openapi.json
        │
        ▼
FastAPI（backend 容器）
  ├── SQLite  /data/talentlink.db
  ├── 上传    /data/uploads
  └── 日志    /data/logs
        │
        ▼
named volume: talentlink-data
```

后端不直接暴露到宿主机，前端通过同源 `/api` 访问，Cookie 不涉及跨域。

## 2. 服务

| 服务 | 镜像 | 端口 | 说明 |
|---|---|---|---|
| backend | python:3.12-slim + requirements | 容器内 8000 | FastAPI、OCR、SQLite |
| web | node:22-alpine 构建 + nginx:1.27-alpine | 8080:80 | 静态前端与反代 |

两个服务都配置了 healthcheck：

- backend：请求 `/api/health`
- web：请求 `/`

web 使用 `depends_on: service_healthy` 等 backend 就绪后再启动。

## 3. 快速启动

```bash
copy .env.docker.example .env
# 修改 JWT_SECRET 和 ADMIN_PASSWORD
docker compose up -d --build
```

访问：

- 应用：http://localhost:8080
- API 文档：http://localhost:8080/docs

查看状态：

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f web
```

停止：

```bash
docker compose down
```

停止并删除数据库、上传和日志：

```bash
docker compose down -v
```

## 4. 环境变量

| 变量 | 默认 | 说明 |
|---|---|---|
| `WEB_PORT` | 8080 | 宿主机访问端口 |
| `SEED_DEMO` | true | 首次启动写入演示账号、岗位、投递 |
| `JWT_SECRET` | dev 值 | 生产必须修改 |
| `ADMIN_USERNAME` | yawu1122345 | 初始管理员账号 |
| `ADMIN_PASSWORD` | dev123123 | 生产必须修改 |
| `COOKIE_SECURE` | false | HTTPS 部署时改 true |
| `COOKIE_SAMESITE` | lax | Cookie SameSite |
| `RECOGNITION_PROVIDER` | local | 本地 OCR 或 mock |

容器内固定配置：

```text
DATABASE_URL=sqlite:////data/talentlink.db
UPLOAD_DIR=/data/uploads
LOG_DIR=/data/logs
```

## 5. 数据持久化

`talentlink-data` 是 named volume：

- 容器重建不会丢数据
- `docker compose down` 不删除 volume
- `docker compose down -v` 会删除数据库、上传文件和日志
- 备份时可复制 volume 中的 `talentlink.db` 和 `uploads/`

```bash
docker compose exec backend sh -c 'ls -l /data'
```

## 6. OCR 运行环境

后端镜像安装了：

- `libgl1`
- `libglib2.0-0`
- `libgomp1`

用于 RapidOCR / OpenCV / onnxruntime。简历识别在容器内实测可用，DOCX 可识别 19 个字段。

## 7. 生产注意

- 修改 `JWT_SECRET` 和 `ADMIN_PASSWORD`
- `SEED_DEMO=false` 可避免演示数据
- HTTPS 时设置 `COOKIE_SECURE=true` 并在 Nginx/网关终止 TLS
- SQLite 适合课程演示和单实例；多用户并发生产建议切换 MySQL
- 不要把 `.env` 提交到 Git
- 定期备份 `talentlink-data` volume
- Nginx 已限制上传请求体 12MB，后端自身限制 10MB

## 8. 常见问题

**构建后端很慢**
OCR/onnxruntime 体积较大，首次构建需要下载数百 MB；后续会命中 Docker 分层缓存。

**8080 被占用**
在 `.env` 中改 `WEB_PORT=18080` 后重新 `docker compose up -d`。

**修改了代码但页面没变**
重新构建并启动：

```bash
docker compose up -d --build
```

**要恢复演示数据**
删除 volume 后重新启动：

```bash
docker compose down -v
docker compose up -d
```
