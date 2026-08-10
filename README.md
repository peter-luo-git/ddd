# DDD 微服务拆分设计工具 —— 比赛底座

本工程从另一处讨论（见 `context.txt`）独立出来，目标是**为一场编程比赛打造底座**：
一个**微服务拆分设计工具**，选手在其上开发增强功能——核心方向是**用 AI 对设计合理性做智能评审**。

## 最终方向（已定）

**自研一个前端画布 + DSL、后端 Python 的完整程序**，融合三源之长：

- **BAC4**（前端骨架）→ C4 模型（系统/容器/组件）+ 关系 + 多格式导入导出。fork 它开发。
- **DDD Toolbox**（分析工具参照）→ 用户故事、事件风暴、限界上下文画布。
- **普元 EOS DDD / 微服务模式**（元素参照）→ 补齐 API 网关、消息中间件、Saga、CQRS 等微服务专属元素。

关键要求：聚焦"拆分设计"不做大而全建模（华为 CodeArts Model 太重是反例）；难易适中、避免复杂 UML；画布 + DSL 双模；**内置标准化元数据/标签供 AI 评审**。

> 📎 完整设计蓝本见 **[`notes/微服务拆分设计工具-能力研究与底座设计方案.md`](notes/微服务拆分设计工具-能力研究与底座设计方案.md)**
> ——含能力模型、元素目录、元数据 Schema、AI 评审维度、架构方案、MVP 范围。

## 选型历程（结论：自研，以 BAC4 为骨架）

| 候选 | 结论 |
|------|------|
| Context Mapper | 能力最强含拆分，但 IDE/DSL、非网页，弃 |
| DDD Toolbox | 网页零安装、分析工具好，但**缺微服务及关系**，仅作参照 |
| Structurizr Lite / IcePanel | 有服务+关系，但**不开源/闭源**，弃 |
| **BAC4 Standalone** ⭐ | 网页拖拽、C4+关系、导入导出、MIT、React 现代栈 → **作前端骨架 fork** |
| AaC | Python 栈，作后端能力参照 |

## 目标与进度

1. 选定底座（BAC4 为骨架）— ✅ 完成
2. 能力研究 + 底座设计方案 — ✅ 完成（见 notes/）
3. 搭建 MVP（中文化 + 扩展微服务元素 + 元数据/标签标准 + 3 示例 + Python 后端 + AI 评审接口占位）— ✅ 完成
4. 起草赛题与评分方案 — 待办

> ▶️ **如何运行 + 验收清单见 [`验收说明.md`](验收说明.md)**

## 目录结构

```
ddd/
├── README.md
├── 验收说明.md                      # ⭐ 如何启动前后端 + 验收清单
├── context.txt                     # 上一轮调研的原始记录
├── notes/
│   └── 微服务拆分设计工具-能力研究与底座设计方案.md   # 设计蓝本
├── bac4-standalone/                # 前端（fork BAC4，已中文化+扩展）
│   ├── src/config/elementTypes.js  # 元素类型注册表（单一事实源）
│   ├── src/examples/               # 3 个示例系统
│   └── scripts/validate-examples.mjs
├── backend/                        # 后端（FastAPI + SQLite）
├── ddd-toolbox/                    # 已 clone，分析工具参照（不作骨架）
└── examples/                       # 早期 Context Mapper 示例（已弃）
```

## 参考链接

- BAC4 https://github.com/DavidROliverBA/bac4-standalone
- DDD Toolbox https://github.com/poulainpi/ddd-toolbox
- 普元 EOS DDD https://www.primeton.com/products/eosms/
- 华为 CodeArts Modeling https://www.huaweicloud.com/product/codearts/modeling.html
- Context Mapper https://contextmapper.org
