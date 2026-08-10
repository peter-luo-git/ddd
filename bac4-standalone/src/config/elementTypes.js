// ─────────────────────────────────────────────────────────────────────────
// 元素类型注册表（底座的单一事实源）
// 新增一种画布元素，只需在 ELEMENT_TYPES 里追加一项即可，
// 工具栏 / 节点渲染 / 缩略图 / 导入导出 会自动识别。
// ─────────────────────────────────────────────────────────────────────────
import {
  Server, Box, Component, User, ExternalLink,
  DoorOpen, Radio, Database, Archive, Zap, Workflow, Table, Code2,
  Terminal, Boxes, Shuffle, Eye, Flame, FileText, Hexagon,
  Users, MessageSquare, DollarSign, Package, ThumbsUp,
} from 'lucide-react';

// C4 抽象层级（下钻深度：context=0, container=1, component=2, code=3）
export const LEVELS = ['context', 'container', 'component', 'code'];

// 层级中文名
export const LEVEL_LABELS = {
  context: '上下文',
  container: '容器',
  component: '组件',
  code: '代码',
};

// 每层的子层（用于下钻）
export const CHILD_LEVEL = { context: 'container', container: 'component', component: 'code' };

// 每层新建元素时归属的父级字段
export const PARENT_FIELD_BY_LEVEL = { container: 'parentSystem', component: 'parentContainer', code: 'parentComponent' };

// 容器概念提示（避免与 Docker 容器混淆）
export const CONTAINER_HINT = 'C4 的"容器"= 应用 / 数据存储级：微服务、Web 应用、API 网关、数据库、消息中间件、缓存、对象存储等（不是 Docker 容器）。';

// 元素分类：c4 = 经典 C4 元素；infrastructure = 微服务基础设施；model = 数据模型/代码
// 字段：levels=可创建/显示的层级；parentField=归属父级字段；canContain=能否下钻查看子层；rich=富节点渲染类型
export const ELEMENT_TYPES = [
  // —— 上下文层 —— //
  { type: 'system', storeKey: 'systems', label: '软件系统', labelEn: 'Software System', category: 'c4',
    icon: Server, levels: ['context'], parentField: null, canContain: true,
    node: 'bg-blue-100 border-blue-500 hover:bg-blue-200', tool: 'bg-blue-100 hover:bg-blue-200 text-blue-700', mini: '#3b82f6' },
  { type: 'person', storeKey: 'people', label: '用户 / 角色', labelEn: 'Person', category: 'c4',
    icon: User, levels: ['context'], parentField: null, canContain: false,
    node: 'bg-purple-100 border-purple-500 hover:bg-purple-200', tool: 'bg-purple-100 hover:bg-purple-200 text-purple-700', mini: '#a855f7' },
  { type: 'externalSystem', storeKey: 'externalSystems', label: '外部系统', labelEn: 'External System', category: 'c4',
    icon: ExternalLink, levels: ['context'], parentField: null, canContain: false,
    node: 'bg-gray-100 border-gray-500 hover:bg-gray-200', tool: 'bg-gray-100 hover:bg-gray-200 text-gray-700', mini: '#6b7280' },

  // —— 容器层：微服务 —— //
  { type: 'container', storeKey: 'containers', label: '微服务 / 容器', labelEn: 'Microservice / Container', category: 'c4',
    icon: Box, levels: ['container'], parentField: 'parentSystem', canContain: true,
    node: 'bg-green-100 border-green-500 hover:bg-green-200', tool: 'bg-green-100 hover:bg-green-200 text-green-700', mini: '#22c55e' },

  // —— 容器层：微服务基础设施 —— //
  { type: 'apiGateway', storeKey: 'apiGateways', label: 'API 网关', labelEn: 'API Gateway', category: 'infrastructure',
    icon: DoorOpen, levels: ['container'], parentField: 'parentSystem', canContain: false,
    node: 'bg-rose-100 border-rose-500 hover:bg-rose-200', tool: 'bg-rose-100 hover:bg-rose-200 text-rose-700', mini: '#f43f5e' },
  { type: 'messageBroker', storeKey: 'messageBrokers', label: '消息中间件', labelEn: 'Message Broker', category: 'infrastructure',
    icon: Radio, levels: ['container'], parentField: 'parentSystem', canContain: false,
    node: 'bg-orange-100 border-orange-500 hover:bg-orange-200', tool: 'bg-orange-100 hover:bg-orange-200 text-orange-700', mini: '#f97316' },
  { type: 'database', storeKey: 'databases', label: '数据库', labelEn: 'Database', category: 'infrastructure',
    icon: Database, levels: ['container'], parentField: 'parentSystem', canContain: false,
    node: 'bg-teal-100 border-teal-500 hover:bg-teal-200', tool: 'bg-teal-100 hover:bg-teal-200 text-teal-700', mini: '#14b8a6' },
  { type: 'objectStorage', storeKey: 'objectStorages', label: '文件 / 对象存储', labelEn: 'File / Object Storage', category: 'infrastructure',
    icon: Archive, levels: ['container'], parentField: 'parentSystem', canContain: false,
    node: 'bg-cyan-100 border-cyan-500 hover:bg-cyan-200', tool: 'bg-cyan-100 hover:bg-cyan-200 text-cyan-700', mini: '#06b6d4' },
  { type: 'cache', storeKey: 'caches', label: '缓存', labelEn: 'Cache', category: 'infrastructure',
    icon: Zap, levels: ['container'], parentField: 'parentSystem', canContain: false,
    node: 'bg-amber-100 border-amber-500 hover:bg-amber-200', tool: 'bg-amber-100 hover:bg-amber-200 text-amber-700', mini: '#f59e0b' },
  { type: 'saga', storeKey: 'sagas', label: 'Saga 编排器', labelEn: 'Saga Orchestrator', category: 'infrastructure',
    icon: Workflow, levels: ['container'], parentField: 'parentSystem', canContain: false,
    node: 'bg-indigo-100 border-indigo-500 hover:bg-indigo-200', tool: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700', mini: '#6366f1' },

  // —— 组件层 —— //
  { type: 'component', storeKey: 'components', label: '组件', labelEn: 'Component', category: 'c4',
    icon: Component, levels: ['component'], parentField: 'parentContainer', canContain: true,
    node: 'bg-yellow-100 border-yellow-500 hover:bg-yellow-200', tool: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700', mini: '#eab308' },
  { type: 'entity', storeKey: 'entities', label: '数据实体', labelEn: 'Data Entity', category: 'model',
    icon: Table, levels: ['component'], parentField: 'parentContainer', canContain: false, rich: 'entity',
    node: 'bg-emerald-100 border-emerald-500 hover:bg-emerald-200', tool: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700', mini: '#10b981' },

  // —— 代码层 —— //
  { type: 'class', storeKey: 'classes', label: '类（UML）', labelEn: 'Class', category: 'model',
    icon: Code2, levels: ['code'], parentField: 'parentComponent', canContain: false, rich: 'class',
    node: 'bg-slate-100 border-slate-500 hover:bg-slate-200', tool: 'bg-slate-100 hover:bg-slate-200 text-slate-700', mini: '#64748b' },
];

export const CATEGORY_LABELS = {
  c4: 'C4 元素',
  infrastructure: '微服务基础设施',
  model: '数据模型 / 代码',
  es: '事件风暴元素',
  ds: '角色',
  dsw: '工作对象',
  ctx: '战略设计元素',
};

// 现有元素默认归属"架构设计（C4）"视图
ELEMENT_TYPES.forEach((t) => { if (!t.board) t.board = 'c4'; });

// —— 业务分析：事件风暴（Alberto Brandolini 标准配色） —— //
const flat = { levels: [], parentField: null, canContain: false };
ELEMENT_TYPES.push(
  { type: 'domainEvent', storeKey: 'domainEvents', label: '领域事件', category: 'es', board: 'event-storming', icon: Zap, ...flat,
    node: 'bg-orange-200 border-orange-500', tool: 'bg-orange-200 hover:bg-orange-300 text-orange-800', mini: '#f97316' },
  { type: 'command', storeKey: 'commands', label: '命令', category: 'es', board: 'event-storming', icon: Terminal, ...flat,
    node: 'bg-blue-200 border-blue-500', tool: 'bg-blue-200 hover:bg-blue-300 text-blue-800', mini: '#3b82f6' },
  { type: 'esActor', storeKey: 'esActors', label: '参与者', category: 'es', board: 'event-storming', icon: User, ...flat,
    node: 'bg-yellow-200 border-yellow-500', tool: 'bg-yellow-200 hover:bg-yellow-300 text-yellow-800', mini: '#eab308' },
  { type: 'aggregate', storeKey: 'aggregates', label: '聚合', category: 'es', board: 'event-storming', icon: Boxes, ...flat,
    node: 'bg-yellow-100 border-yellow-600', tool: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800', mini: '#ca8a04' },
  { type: 'policy', storeKey: 'policies', label: '策略', category: 'es', board: 'event-storming', icon: Shuffle, ...flat,
    node: 'bg-purple-200 border-purple-500', tool: 'bg-purple-200 hover:bg-purple-300 text-purple-800', mini: '#a855f7' },
  { type: 'readModel', storeKey: 'readModels', label: '读模型', category: 'es', board: 'event-storming', icon: Eye, ...flat,
    node: 'bg-green-200 border-green-500', tool: 'bg-green-200 hover:bg-green-300 text-green-800', mini: '#22c55e' },
  { type: 'esExternal', storeKey: 'esExternals', label: '外部系统', category: 'es', board: 'event-storming', icon: ExternalLink, ...flat,
    node: 'bg-pink-200 border-pink-500', tool: 'bg-pink-200 hover:bg-pink-300 text-pink-800', mini: '#ec4899' },
  { type: 'hotspot', storeKey: 'hotspots', label: '热点', category: 'es', board: 'event-storming', icon: Flame, ...flat,
    node: 'bg-red-200 border-red-500', tool: 'bg-red-200 hover:bg-red-300 text-red-800', mini: '#ef4444' },

  // —— 业务分析：领域故事 —— //
  { type: 'dsActor', storeKey: 'dsActors', label: '角色', category: 'ds', board: 'domain-story', icon: User, ...flat,
    node: '', tool: 'bg-gray-100 hover:bg-gray-200 text-gray-800', mini: '#334155' },
  { type: 'dsActorGroup', storeKey: 'dsActorGroups', label: '角色组', category: 'ds', board: 'domain-story', icon: Users, ...flat,
    node: '', tool: 'bg-gray-100 hover:bg-gray-200 text-gray-800', mini: '#334155' },
  { type: 'dsSystem', storeKey: 'dsSystems', label: '系统', category: 'ds', board: 'domain-story', icon: Server, ...flat,
    node: '', tool: 'bg-gray-100 hover:bg-gray-200 text-gray-800', mini: '#334155' },
  { type: 'woDocument', storeKey: 'woDocuments', label: '文档', category: 'dsw', board: 'domain-story', icon: FileText, ...flat,
    node: '', tool: 'bg-slate-100 hover:bg-slate-200 text-slate-800', mini: '#64748b' },
  { type: 'woData', storeKey: 'woDatas', label: '数据', category: 'dsw', board: 'domain-story', icon: Table, ...flat,
    node: '', tool: 'bg-slate-100 hover:bg-slate-200 text-slate-800', mini: '#64748b' },
  { type: 'woMessage', storeKey: 'woMessages', label: '消息', category: 'dsw', board: 'domain-story', icon: MessageSquare, ...flat,
    node: '', tool: 'bg-slate-100 hover:bg-slate-200 text-slate-800', mini: '#64748b' },
  { type: 'woMoney', storeKey: 'woMoneys', label: '金额', category: 'dsw', board: 'domain-story', icon: DollarSign, ...flat,
    node: '', tool: 'bg-slate-100 hover:bg-slate-200 text-slate-800', mini: '#64748b' },
  { type: 'woItem', storeKey: 'woItems', label: '物品', category: 'dsw', board: 'domain-story', icon: Package, ...flat,
    node: '', tool: 'bg-slate-100 hover:bg-slate-200 text-slate-800', mini: '#64748b' },
  { type: 'woResult', storeKey: 'woResults', label: '结果', category: 'dsw', board: 'domain-story', icon: ThumbsUp, ...flat,
    node: '', tool: 'bg-slate-100 hover:bg-slate-200 text-slate-800', mini: '#64748b' },

  // —— 战略设计：限界上下文 / 上下文映射 —— //
  { type: 'boundedContext', storeKey: 'boundedContexts', label: '限界上下文', category: 'ctx', board: 'context-map', icon: Hexagon, ...flat,
    node: 'bg-indigo-100 border-indigo-500', tool: 'bg-indigo-100 hover:bg-indigo-200 text-indigo-800', mini: '#6366f1' },
);

export const BY_TYPE = Object.fromEntries(ELEMENT_TYPES.map((t) => [t.type, t]));
export const STORE_KEYS = ELEMENT_TYPES.map((t) => t.storeKey);
export const getType = (type) => BY_TYPE[type] || null;
export const storeKeyOf = (type) => BY_TYPE[type]?.storeKey || `${type}s`;
export const typesForLevel = (level) => ELEMENT_TYPES.filter((t) => t.levels.includes(level));
// 按视图返回可添加的元素：C4 视图按层级；其它视图按 board 平铺
export const typesForView = (view, level) =>
  view === 'c4' ? typesForLevel(level) : ELEMENT_TYPES.filter((t) => t.board === view);

// ─────────────────────────────────────────────────────────────────────────
// AI 评审标准（MVP 只预留，不实现评审逻辑）
// 元素/关系上填写标准化元数据，便于后续 AI 稳定判断。
// ─────────────────────────────────────────────────────────────────────────

// 元素元数据字段（存于 element.meta）
export const ELEMENT_META_FIELDS = [
  {
    key: 'subdomainType', label: '子域类型', options: [
      { value: '', label: '（未指定）' },
      { value: 'core', label: '核心域 core' },
      { value: 'supporting', label: '支撑域 supporting' },
      { value: 'generic', label: '通用域 generic' },
    ],
  },
  {
    key: 'stateful', label: '状态性', options: [
      { value: '', label: '（未指定）' },
      { value: 'stateless', label: '无状态（状态外置，可自由扩展）' },
      { value: 'stateful', label: '有状态（状态绑定实例，如存储/会话）' },
    ],
  },
];

// 关系元数据字段（存于 relationship.meta）
export const RELATIONSHIP_META_FIELDS = [
  {
    key: 'kind', label: '通信方式', options: [
      { value: '', label: '（未指定）' },
      { value: 'sync', label: '同步 sync' },
      { value: 'async', label: '异步 async' },
      { value: 'pub-sub', label: '发布订阅 pub-sub' },
      { value: 'data', label: '数据依赖 data' },
      { value: 'orchestration', label: '编排 orchestration' },
    ],
  },
  {
    key: 'consistency', label: '一致性', options: [
      { value: '', label: '（未指定）' },
      { value: 'strong', label: '强一致 strong' },
      { value: 'eventual', label: '最终一致 eventual' },
    ],
  },
];

// 受控标签词表（AI 评审参考，可自由追加标签）
export const CONTROLLED_TAGS = {
  subdomain: ['core', 'supporting', 'generic'],
  communication: ['sync', 'async', 'pub-sub'],
  consistency: ['strong', 'eventual'],
  ddd: ['aggregate-root', 'anti-corruption-layer', 'open-host-service', 'published-language'],
  risk: ['shared-database', 'chatty', 'god-service', 'anemic-model'],
};

// ─────────────────────────────────────────────────────────────────────────
// 数据建模：ER 关系基数（Crow's Foot 乌鸦脚）
// start/end 为两端记法：one 一 / many 多 / zeroOne 零或一 / oneMany 一或多 / zeroMany 零或多
// ─────────────────────────────────────────────────────────────────────────
export const CARDINALITIES = [
  { value: '', label: '（未指定）', start: null, end: null },
  { value: '1-1', label: '一对一 (1:1)', start: 'one', end: 'one' },
  { value: '1-N', label: '一对多 (1:N)', start: 'one', end: 'many' },
  { value: 'N-1', label: '多对一 (N:1)', start: 'many', end: 'one' },
  { value: 'N-M', label: '多对多 (N:M)', start: 'many', end: 'many' },
  { value: '01-N', label: '零或一 对 多 (0..1:N)', start: 'zeroOne', end: 'many' },
  { value: '1-0N', label: '一 对 零或多 (1:0..N)', start: 'one', end: 'zeroMany' },
];
export const cardinalityById = (id) => CARDINALITIES.find((c) => c.value === id) || null;

// UML 可见性（下拉）
export const UML_VISIBILITY = [
  { value: '+', label: '+ public' },
  { value: '-', label: '- private' },
  { value: '#', label: '# protected' },
  { value: '~', label: '~ package' },
];

// ER 主外键（下拉）
export const ER_KEYS = [
  { value: '', label: '— 普通列' },
  { value: 'PK', label: 'PK 主键' },
  { value: 'FK', label: 'FK 外键' },
  { value: 'PK,FK', label: 'PK+FK' },
];

// 常用类型（下拉建议，可自由填写）
export const COMMON_TYPES = [
  'Long', 'Int', 'String', 'Boolean', 'Decimal', 'BigDecimal', 'Double',
  'Date', 'DateTime', 'Timestamp', 'UUID', 'Text', 'JSON', 'Money',
  'List<>', 'Map<,>', 'Set<>', 'void', 'Object',
];
