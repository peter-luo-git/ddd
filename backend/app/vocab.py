"""设计标准（与前端注册表保持一致）：元素类型、受控标签、元数据字段。
供前端属性面板 / 外部工具 / 未来 AI 评审读取。"""

# type -> (storeKey, 中文名, 分类)
ELEMENT_TYPES = [
    {"type": "system", "storeKey": "systems", "label": "软件系统", "category": "c4"},
    {"type": "container", "storeKey": "containers", "label": "微服务 / 容器", "category": "c4"},
    {"type": "component", "storeKey": "components", "label": "组件", "category": "c4"},
    {"type": "person", "storeKey": "people", "label": "用户 / 角色", "category": "c4"},
    {"type": "externalSystem", "storeKey": "externalSystems", "label": "外部系统", "category": "c4"},
    {"type": "apiGateway", "storeKey": "apiGateways", "label": "API 网关", "category": "infrastructure"},
    {"type": "messageBroker", "storeKey": "messageBrokers", "label": "消息中间件", "category": "infrastructure"},
    {"type": "database", "storeKey": "databases", "label": "数据库", "category": "infrastructure"},
    {"type": "objectStorage", "storeKey": "objectStorages", "label": "文件 / 对象存储", "category": "infrastructure"},
    {"type": "cache", "storeKey": "caches", "label": "缓存", "category": "infrastructure"},
    {"type": "saga", "storeKey": "sagas", "label": "Saga 编排器", "category": "infrastructure"},
    {"type": "entity", "storeKey": "entities", "label": "数据实体", "category": "model"},
    {"type": "class", "storeKey": "classes", "label": "类（UML）", "category": "model"},
]

KNOWN_TYPES = {t["type"] for t in ELEMENT_TYPES}
STORE_KEYS = [t["storeKey"] for t in ELEMENT_TYPES]

ELEMENT_META_FIELDS = [
    {"key": "subdomainType", "label": "子域类型", "values": ["core", "supporting", "generic"]},
    {"key": "stateful", "label": "是否有状态", "values": ["stateful", "stateless"]},
]

RELATIONSHIP_META_FIELDS = [
    {"key": "kind", "label": "通信方式", "values": ["sync", "async", "pub-sub", "data", "orchestration"]},
    {"key": "consistency", "label": "一致性", "values": ["strong", "eventual"]},
]

CONTROLLED_TAGS = {
    "subdomain": ["core", "supporting", "generic"],
    "communication": ["sync", "async", "pub-sub"],
    "consistency": ["strong", "eventual"],
    "ddd": ["aggregate-root", "anti-corruption-layer", "open-host-service", "published-language"],
    "risk": ["shared-database", "chatty", "god-service", "anemic-model"],
}


def vocab() -> dict:
    return {
        "elementTypes": ELEMENT_TYPES,
        "elementMetaFields": ELEMENT_META_FIELDS,
        "relationshipMetaFields": RELATIONSHIP_META_FIELDS,
        "controlledTags": CONTROLLED_TAGS,
    }
