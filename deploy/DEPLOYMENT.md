# 部署记录

记录本项目（DDD 微服务拆分设计工具，FastAPI + SQLAlchemy 后端 / Vite + React 前端）从本地环境搭建到远程服务器正式对外部署的完整过程，方便以后维护、排障或迁移。

最后更新：2026-08-11

---

## 1. 目标服务器

| 项目 | 值 |
|---|---|
| 地址 | `root@139.198.39.227` |
| 工作目录 | `/root/ddd` |
| 登录方式 | SSH key（已配置好，免密） |
| 操作系统 | Ubuntu 18.04（glibc 2.27，较老） |
| 对外端口 | **7233**（用户指定） |

### 为什么用 Docker，而不是直接跑 host 环境

远程服务器的系统环境太老，直接装依赖会失败：

- **Node 18 / Node 22** 都要求 glibc ≥ 2.28，但 Ubuntu 18.04 只有 glibc 2.27 → `GLIBC_2.28' not found`，装不了，也跑不动 Vite。
- **系统自带 Python 3.6.9** 太老，FastAPI（依赖 Pydantic v2）要求 Python ≥ 3.8。

如果手动升级系统 glibc / Python，风险高（可能搞坏其它跑在这台机器上的服务），也慢。用 Docker 容器自带用户态（自己的 glibc、自己的 Python/Node），可以完全绕开宿主机的老环境限制，构建产物也和本地开发环境解耦，之后再迁移到别的机器也更省心。

---

## 2. 整体架构

```
公网浏览器
   │  http://139.198.39.227:7233
   ▼
┌─────────────────────────────────────────┐
│ nginx（host 上装的系统服务，非容器）        │
│  监听 0.0.0.0:7233                       │
│  HTTP Basic Auth 登录墙                   │
│                                          │
│  /api/*  ──▶ proxy_pass 127.0.0.1:8010  │──▶ backend 容器 (uvicorn, FastAPI)
│  /*      ──▶ proxy_pass 127.0.0.1:5173  │──▶ frontend 容器 (vite dev server)
└─────────────────────────────────────────┘
        ▲ 两个容器都只 bind 127.0.0.1，不直接对外暴露
        │
   docker compose（backend + frontend 两个服务）
```

设计要点：

- **前后端走同一个对外端口**：前端页面里的 API 请求也打到 `http://139.198.39.227:7233/api/...`，由 nginx 按路径转发到后端容器。这样浏览器端不用处理跨域（CORS），也只需要一套 Basic Auth 登录即可同时保护前端页面和后端接口。
- **容器只监听 127.0.0.1**：`docker-compose.yml` 里端口映射写的是 `127.0.0.1:8010:8000` / `127.0.0.1:5173:5173`，容器本身不直接对公网开放，所有外部流量必须经过 nginx 的登录验证。
- **nginx 装在宿主机而不是容器里**：作为登录墙，故障排查、改配置、加 Basic Auth 用户都更直接，且它是唯一暴露的入口，出问题时最容易单独重启修复。

---

## 3. 容器镜像

### 3.1 backend/Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -i https://mirrors.aliyun.com/pypi/simple/ -r requirements.txt

COPY app ./app

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 3.2 bac4-standalone/Dockerfile

```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .

# 用哪个后端地址由 docker-compose 里的 VITE_API_BASE 环境变量注入
EXPOSE 5173
CMD ["npx", "vite", "--host", "0.0.0.0", "--port", "5173"]
```

`bac4-standalone/.dockerignore`：排除 `node_modules`、`dist`、`.git`，避免把本地构建产物或历史记录打进镜像。

### 3.3 为什么 Dockerfile 里指定了国内镜像源

远程服务器在国内，直连 PyPI / npm 官方源实测只有 **~12–15 kB/s**，一次构建要等到天荒地老；直连 Docker Hub（`registry-1.docker.io`）经常直接超时连不上。

处理方式：

1. **pip**：`-i https://mirrors.aliyun.com/pypi/simple/`（阿里云 PyPI 镜像）
2. **npm**：`--registry=https://registry.npmmirror.com`（npmmirror）
3. **Docker 拉基础镜像**：配置宿主机 `/etc/docker/daemon.json` 走镜像加速站（见第 4 节）

实测切换后下载速度提升到 **~1–3 MB/s**，快了大约 100–250 倍，构建从"卡住不知道要多久"变成几分钟内完成。

（曾经考虑过"本地构建镜像 + tar 包传过去"的方案，但换镜像源改动更小、更快，且以后改代码重新构建也不需要再手动传输镜像，所以最终选择了镜像源方案。）

---

## 4. Docker 环境准备（远程服务器一次性操作）

### 4.1 安装 Docker

```bash
apt-get update
apt-get install -y docker.io docker-compose-plugin
```

（此过程中一度以为命令被拒绝/中断，实际上后台仍在继续安装，导致后续命令撞上 `dpkg lock-frontend` 锁 —— 等它跑完即可，不是真正的失败。）

### 4.2 配置 Docker Registry 镜像加速（解决 Docker Hub 连不上的问题）

`/etc/docker/daemon.json`：

```json
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://dockerproxy.com",
    "https://hub.rat.dev"
  ]
}
```

改完执行 `systemctl restart docker` 生效。验证：`docker pull python:3.11-slim` 能正常拉取。

---

## 5. docker-compose.yml

```yaml
services:
  backend:
    build: ./backend
    container_name: ddd-backend
    restart: unless-stopped
    volumes:
      - ddd-backend-data:/data
    environment:
      # database.py 支持这个 env var 覆盖默认路径，固定到卷里以便容器重建后数据不丢
      - DDD_DB_PATH=/data/data.db
    # 只绑本机回环，对外暴露交给 nginx
    ports:
      - "127.0.0.1:8010:8000"

  frontend:
    build: ./bac4-standalone
    container_name: ddd-frontend
    restart: unless-stopped
    environment:
      # 对外通过 nginx (Basic Auth) 代理到 7233，浏览器实际请求走这个源
      - VITE_API_BASE=http://139.198.39.227:7233
    ports:
      - "127.0.0.1:5173:5173"
    depends_on:
      - backend

volumes:
  ddd-backend-data:
```

要点：

- **`restart: unless-stopped`**：宿主机重启后容器自动拉起。
- **`ddd-backend-data` 具名卷**：SQLite 数据库文件放在卷里，`docker compose up --force-recreate` / 重新构建镜像都不会丢数据。
- **`VITE_API_BASE`**：前端读取 `import.meta.env.VITE_API_BASE`（见 `bac4-standalone/src/utils/api.js`）决定 API 请求打到哪。**必须给完整 URL，不能给空字符串** —— 代码里是 `import.meta.env?.VITE_API_BASE || 'http://localhost:8000'`，空字符串是 falsy，会被兜底成 localhost，导致部署到远程后前端还在打本地地址。

### 5.1 后端为支持数据卷持久化做的改动

`backend/app/database.py`：

```python
# 改动前：写死路径
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data.db")

# 改动后：允许用环境变量覆盖，兼容旧行为（不设置时路径不变）
DB_PATH = os.environ.get(
    "DDD_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(__file__)), "data.db"),
)
```

### 5.2 构建与启动

```bash
cd /root/ddd
docker compose build
docker compose up -d
docker compose ps          # 确认两个容器都是 Up
curl -s 127.0.0.1:8010/api/health   # {"status":"ok",...}
```

---

## 6. nginx 反向代理 + 登录墙

### 6.1 安装

```bash
apt-get install -y nginx apache2-utils
```

### 6.2 生成 Basic Auth 账号密码

```bash
htpasswd -bc /etc/nginx/.htpasswd ddd '<密码>'
```

当前账号：`ddd` / `VcI3hCWuVo3wP9Pb`（存于远程服务器 `/etc/nginx/.htpasswd`，未纳入 git）。

改密码：
```bash
htpasswd -b /etc/nginx/.htpasswd ddd '<新密码>' && systemctl reload nginx
```

### 6.3 nginx 站点配置

本地路径：`deploy/nginx-ddd-app.conf`，同步到远程 `/etc/nginx/sites-available/ddd-app`（并 `ln -s` 到 `sites-enabled`）：

```nginx
server {
    listen 0.0.0.0:7233;
    server_name _;

    auth_basic "DDD 微服务拆分设计工具";
    auth_basic_user_file /etc/nginx/.htpasswd;

    # 后端 API（Docker 容器，仅监听 127.0.0.1:8010）
    location /api/ {
        proxy_pass http://127.0.0.1:8010/api/;
        proxy_set_header Host 127.0.0.1;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # 前端（Vite dev server，Docker 容器，仅监听 127.0.0.1:5173，含 HMR websocket）
    location / {
        proxy_pass http://127.0.0.1:5173/;
        proxy_set_header Host 127.0.0.1;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

`Upgrade`/`Connection: upgrade` 两行是为了让 Vite 的 HMR（热更新）websocket 能穿过代理。

改完配置执行 `systemctl restart nginx`（不是 `start` —— nginx 若已在跑，`start` 是空操作，不会加载新配置）。

### 6.4 开机自启

```bash
systemctl enable nginx docker
```

已确认两者 `enabled`，服务器重启后 nginx、docker、以及 `restart: unless-stopped` 的两个容器都会自动恢复。

---

## 7. 部署 / 更新代码的流程

代码通过 rsync 从本地开发环境同步到远程 `/root/ddd`：

```bash
rsync -avz --delete \
  --exclude node_modules --exclude .venv --exclude dist \
  --exclude data.db --exclude .git \
  /root/ws-claude/ddd/  root@139.198.39.227:/root/ddd/
```

同步后如果依赖或 Dockerfile 有变化：

```bash
ssh root@139.198.39.227 'cd /root/ddd && docker compose build && docker compose up -d'
```

如果只是前端/后端源码变化、依赖没变，也可以只重建对应服务，例如：
```bash
docker compose up -d --force-recreate --build frontend
```

---

## 8. 验证结果

```bash
curl -i http://139.198.39.227:7233/                                    # 无认证 → 401
curl -u ddd:'VcI3hCWuVo3wP9Pb' -i http://139.198.39.227:7233/          # → 200
curl -u ddd:'VcI3hCWuVo3wP9Pb' http://139.198.39.227:7233/api/health   # → {"status":"ok","time":"..."}
curl -u ddd:'VcI3hCWuVo3wP9Pb' http://139.198.39.227:7233/api/vocab    # → 200
```

全部通过。最终访问方式：

- **URL**：`http://139.198.39.227:7233`
- **账号**：`ddd`
- **密码**：`VcI3hCWuVo3wP9Pb`

---

## 9. 已知问题 / 待办

- **`bac4-standalone/src/examples/index.js` 目前是占位空文件**（`export const EXAMPLES = []`）。原因：`Header.jsx` 依赖这个文件，但 README.md / 验收说明.md 里描述的 3 个内置示例系统（在线书店 / 外卖订餐平台 / 在线教育课程平台）的数据从未提交到 git 仓库（`git log` 无记录），导致前端本来就编译不过。目前只是放了空数组让应用能跑起来，"示例"菜单是空的，真实数据需要重新编写或从其它渠道恢复。
- 早期在本地沙箱（`69.12.73.136:5173`）也搭过一套几乎一样的 nginx + Basic Auth 部署，用于本地联调验证，目前功能上已被远程服务器的正式部署（`139.198.39.227:7233`）取代。是否保留/下线未定，需要用户确认后再处理。
- 若外部访问 `139.198.39.227:7233` 连不上，需检查云厂商控制台的安全组规则是否放通该端口（服务器本机防火墙已确认未拦截）。

---

## 10. 踩过的坑（速查）

| 问题 | 原因 | 解决 |
|---|---|---|
| Node 18/22 装不上 / 跑不动 | Ubuntu 18.04 glibc 2.27 < Node 要求的 2.28 | 改用 Docker 容器 |
| 系统 Python 3.6.9 装不了 FastAPI | Pydantic v2 要求 Python ≥ 3.8 | Docker 里用 `python:3.11-slim` |
| `docker compose build` 卡住 / 超时 | Docker Hub、PyPI、npm 官方源在国内访问极慢或不通 | 配置 registry 镜像 + pip/npm 国内镜像源 |
| `dpkg lock-frontend` 拿不到锁 | 之前"看似被中断"的 apt install 实际仍在后台跑 | 等后台任务跑完再重试 |
| rsync 把 Dockerfile 放错目录 | 一条 rsync 命令里源文件列表和目标目录没对齐 | 拆成多条命令分别同步，删掉误放的文件 |
| nginx 改了配置不生效 | 用了 `systemctl start`（nginx 已在跑，是空操作） | 改用 `systemctl restart` |
| `VITE_API_BASE` 设置了但前端还是打 localhost | 代码用 `xxx || 'http://localhost:8000'`，空字符串会 falsy 兜底 | 必须给完整非空 URL |
| SSH 偶发 `Connection closed`（exit 255） | 网络瞬时抖动，非持续性故障 | 直接重试，必要时加 `-o ConnectTimeout=15` |
