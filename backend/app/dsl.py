"""模型工具：扁平化、结构校验、导出为可读 DSL 文本（供 AI 评审）。

前端导出的 model 为分组结构：{metadata, systems:[], containers:[], ..., relationships:[]}，
也兼容扁平结构：{metadata, elements:[], relationships:[]}。
"""
from typing import Any

from .vocab import KNOWN_TYPES, STORE_KEYS


def flatten_elements(model: dict) -> list[dict]:
    """把分组或扁平结构统一成元素列表。"""
    if isinstance(model.get("elements"), list):
        return model["elements"]
    elements: list[dict] = []
    for key in STORE_KEYS:
        arr = model.get(key)
        if isinstance(arr, list):
            elements.extend(arr)
    return elements


def validate_model(model: dict) -> list[dict]:
    """结构校验（非语义/非 AI）：重复 id、非法类型、孤儿关系。"""
    issues: list[dict] = []
    elements = flatten_elements(model)
    ids: set[str] = set()
    for el in elements:
        eid = el.get("id")
        if eid in ids:
            issues.append({"level": "error", "message": f"重复元素 id：{eid}"})
        ids.add(eid)
        if el.get("type") not in KNOWN_TYPES:
            issues.append({"level": "warning", "message": f"未知元素类型：{el.get('type')}（{eid}）"})
        if not el.get("name"):
            issues.append({"level": "warning", "message": f"元素缺少名称：{eid}"})

    for rel in model.get("relationships", []) or []:
        if rel.get("from") not in ids:
            issues.append({"level": "error", "message": f"关系源不存在：{rel.get('from')}（{rel.get('id')}）"})
        if rel.get("to") not in ids:
            issues.append({"level": "error", "message": f"关系目标不存在：{rel.get('to')}（{rel.get('id')}）"})
    return issues


def _fmt_meta(meta: dict[str, Any]) -> list[str]:
    lines = []
    for k, v in (meta or {}).items():
        if v not in (None, "", []):
            lines.append(f"    {k} {v}")
    return lines


def to_dsl(model: dict) -> str:
    """导出为可读 DSL 文本。结构化、稳定，便于 AI 评审消费。"""
    name = (model.get("metadata") or {}).get("name", "未命名模型")
    out: list[str] = [f'model "{name}" {{', "  elements {"]

    for el in flatten_elements(model):
        out.append(f'    {el.get("id")} : {el.get("type")} "{el.get("name", "")}" {{')
        if el.get("technology"):
            out.append(f'      technology "{el["technology"]}"')
        if el.get("description"):
            out.append(f'      description "{el["description"]}"')
        for line in _fmt_meta(el.get("meta", {})):
            out.append("  " + line)
        for a in el.get("attributes", []) or []:
            out.append(f'      attribute "{a}"')
        for m in el.get("methods", []) or []:
            out.append(f'      operation "{m}"')
        if el.get("tags"):
            out.append(f'      tags [ {", ".join(el["tags"])} ]')
        out.append("    }")
    out.append("  }")

    out.append("  relationships {")
    for rel in model.get("relationships", []) or []:
        desc = rel.get("description", "")
        out.append(f'    {rel.get("from")} -> {rel.get("to")} "{desc}" {{')
        if rel.get("technology"):
            out.append(f'      protocol "{rel["technology"]}"')
        if rel.get("cardinality"):
            out.append(f'      cardinality {rel["cardinality"]}')
        for line in _fmt_meta(rel.get("meta", {})):
            out.append("  " + line)
        out.append("    }")
    out.append("  }")
    out.append("}")
    return "\n".join(out)
