"""微服务拆分设计工具 —— 后端 API（FastAPI）。

提供：健康检查、项目 CRUD、模型校验、导出（JSON/DSL）、设计词表、AI 评审占位。
AI 评审逻辑按约定不实现（返回 501），留给比赛选手。
"""
from datetime import datetime
from typing import Any, Optional

from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from . import models
from .database import Base, engine, get_db
from .dsl import to_dsl, validate_model
from .vocab import vocab

Base.metadata.create_all(bind=engine)

app = FastAPI(title="微服务拆分设计工具 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────── Schemas ─────────────── #
class ProjectIn(BaseModel):
    name: str
    description: Optional[str] = ""
    model: dict[str, Any] = {}


class ExportIn(BaseModel):
    model: dict[str, Any] = {}


def summary(p: models.Project) -> dict:
    return {
        "id": p.id,
        "name": p.name,
        "description": p.description or "",
        "created_at": p.created_at,
        "updated_at": p.updated_at,
    }


def detail(p: models.Project) -> dict:
    return {**summary(p), "model": p.model_json or {}}


# ─────────────── 基础 ─────────────── #
@app.get("/api/health")
def health():
    return {"status": "ok", "time": datetime.utcnow().isoformat()}


@app.get("/api/vocab")
def get_vocab():
    """设计标准词表：元素类型、元数据字段、受控标签。"""
    return vocab()


# ─────────────── 项目 CRUD ─────────────── #
@app.get("/api/projects")
def list_projects(db: Session = Depends(get_db)):
    rows = db.query(models.Project).order_by(models.Project.updated_at.desc()).all()
    return [summary(p) for p in rows]


@app.post("/api/projects", status_code=201)
def create_project(payload: ProjectIn, db: Session = Depends(get_db)):
    p = models.Project(name=payload.name, description=payload.description or "", model_json=payload.model)
    db.add(p)
    db.commit()
    db.refresh(p)
    return detail(p)


@app.get("/api/projects/{project_id}")
def get_project(project_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Project, project_id)
    if not p:
        raise HTTPException(404, "项目不存在")
    return detail(p)


@app.put("/api/projects/{project_id}")
def update_project(project_id: int, payload: ProjectIn, db: Session = Depends(get_db)):
    p = db.get(models.Project, project_id)
    if not p:
        raise HTTPException(404, "项目不存在")
    # 覆盖保存前，先存一份历史快照
    db.add(models.ProjectVersion(project_id=p.id, model_json=p.model_json))
    p.name = payload.name
    p.description = payload.description or ""
    p.model_json = payload.model
    db.commit()
    db.refresh(p)
    return detail(p)


@app.delete("/api/projects/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Project, project_id)
    if not p:
        raise HTTPException(404, "项目不存在")
    db.delete(p)
    db.commit()
    return Response(status_code=204)


# ─────────────── 校验 / 导出 ─────────────── #
@app.post("/api/projects/{project_id}/validate")
def validate_project(project_id: int, db: Session = Depends(get_db)):
    p = db.get(models.Project, project_id)
    if not p:
        raise HTTPException(404, "项目不存在")
    issues = validate_model(p.model_json or {})
    return {"ok": len([i for i in issues if i["level"] == "error"]) == 0, "issues": issues}


@app.post("/api/validate")
def validate_any(payload: ExportIn):
    issues = validate_model(payload.model or {})
    return {"ok": len([i for i in issues if i["level"] == "error"]) == 0, "issues": issues}


@app.get("/api/projects/{project_id}/export")
def export_project(project_id: int, format: str = "json", db: Session = Depends(get_db)):
    p = db.get(models.Project, project_id)
    if not p:
        raise HTTPException(404, "项目不存在")
    model = p.model_json or {}
    if format == "dsl":
        return PlainTextResponse(to_dsl(model))
    return model


@app.post("/api/export")
def export_any(payload: ExportIn, format: str = "json"):
    model = payload.model or {}
    if format == "dsl":
        return PlainTextResponse(to_dsl(model))
    return model


# ─────────────── AI 评审（占位，不实现） ─────────────── #
@app.post("/api/projects/{project_id}/review", status_code=501)
def review_project(project_id: int):
    """AI 智能评审接口占位。

    约定：输入 = 模型 JSON；输出 = { issues: [{dimension, level, elementId, message, suggestion}] }。
    评审维度参考：边界合理性、耦合/内聚、DDD 反模式、一致性/事务、命名一致性、通信/中间件合理性。
    具体实现留给比赛选手。
    """
    raise HTTPException(
        status_code=501,
        detail="AI 评审接口为占位，未实现。评审逻辑留给选手实现（见 notes 设计方案第 5 节）。",
    )
