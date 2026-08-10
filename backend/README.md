# 后端 —— 微服务拆分设计工具 API（FastAPI）

## 功能
- 项目 CRUD（模型以 JSON 存于 SQLite）
- 模型结构校验（重复 id / 未知类型 / 孤儿关系）
- 导出：JSON、DSL 文本（供 AI 评审）
- 设计词表 `/api/vocab`（元素类型、元数据字段、受控标签）
- AI 评审接口 `/review`：**占位，返回 501**，评审逻辑留给选手

## 运行
```bash
cd backend
python3 -m venv .venv
./.venv/bin/pip install -r requirements.txt
./.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000
```
启动后：
- 交互式文档：http://127.0.0.1:8000/docs
- 健康检查：http://127.0.0.1:8000/api/health

数据库文件 `data.db` 首次启动自动创建（空库）。

## 接口一览
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/vocab` | 设计标准词表 |
| GET | `/api/projects` | 项目列表 |
| POST | `/api/projects` | 新建项目 `{name, model}` |
| GET | `/api/projects/{id}` | 项目详情（含 model） |
| PUT | `/api/projects/{id}` | 覆盖保存（自动存历史快照） |
| DELETE | `/api/projects/{id}` | 删除 |
| POST | `/api/projects/{id}/validate` | 结构校验 |
| POST | `/api/validate` | 对传入 model 校验（不落库） |
| GET | `/api/projects/{id}/export?format=json\|dsl` | 导出 |
| POST | `/api/export?format=json\|dsl` | 对传入 model 导出 |
| POST | `/api/projects/{id}/review` | AI 评审（**501 占位**） |
