// ─────────────────────────────────────────────────────────────────────────
// 内置示例：
//   1-3. C4 架构设计（中小规模系统的微服务拆分，四层：系统→容器→组件→代码）
//   4-6. 业务分析 / 战略设计（事件风暴、领域故事、限界上下文画布）
//        —— 4/5/6 与示例 1「在线书店」同一业务场景，串联起从业务分析到微服务拆分的完整方法论链路。
// 每个示例可选 view 字段（'event-storming' | 'domain-story' | 'bounded-context'），
// 缺省视为 'c4'；Header.jsx 按 view 决定加载到哪个工作台视图（见 store.js 的 loadBoardExample）。
// ─────────────────────────────────────────────────────────────────────────

// 元素：E(id, type, name, x, y, extra)
const E = (id, type, name, x, y, extra = {}) => ({ id, type, name, position: { x, y }, ...extra });
// 关系：R(from, to, description, extra)
const R = (from, to, description, extra = {}) => ({
  id: `rel-${from}-${to}`, from, to, description,
  arrowDirection: 'right', lineStyle: extra.lineStyle || 'solid',
  technology: extra.technology || '', meta: extra.meta || {},
  cardinality: extra.cardinality || '', sequence: extra.sequence,
});

// meta 快捷构造
const core = (stateful) => ({ subdomainType: 'core', ...(stateful ? { stateful } : {}) });
const supporting = (stateful) => ({ subdomainType: 'supporting', ...(stateful ? { stateful } : {}) });
const generic = (stateful) => ({ subdomainType: 'generic', ...(stateful ? { stateful } : {}) });
const sync = { meta: { kind: 'sync', consistency: 'strong' } };
const asyncEvt = { meta: { kind: 'async', consistency: 'eventual' }, lineStyle: 'dashed' };
const pubsub = { meta: { kind: 'pub-sub', consistency: 'eventual' }, lineStyle: 'dashed' };
const dataRel = { meta: { kind: 'data' }, lineStyle: 'dotted' };

// ═══════════════════════════ 示例 1：在线书店（完整四层） ═══════════════════════════
const S1 = 'sys-bookstore';
const bookstore = {
  id: 'bookstore',
  name: '在线书店',
  description: '完整四层示例：系统→容器→组件→代码。含订单服务的组件、数据实体与 UML 类。',
  model: {
    metadata: { name: '在线书店 - 微服务拆分', version: '1.0', author: '示例' },
    elements: [
      // 上下文层
      E(S1, 'system', '在线书店', 420, 180, { description: '面向顾客的图书电商系统' }),
      E('customer', 'person', '顾客', 120, 120, { description: '浏览并购买图书的用户' }),
      E('paygw', 'externalSystem', '第三方支付平台', 780, 120, { technology: 'OpenAPI', description: '微信 / 支付宝' }),

      // 容器层（parentSystem = 在线书店）
      E('gw', 'apiGateway', 'API 网关', 400, 40, { parentSystem: S1, technology: 'Spring Cloud Gateway', meta: generic('stateless') }),
      E('svc-user', 'container', '用户服务', 60, 220, { parentSystem: S1, technology: 'Spring Boot', meta: supporting('stateless'), description: '账号、地址、登录' }),
      E('svc-product', 'container', '商品服务', 340, 220, { parentSystem: S1, technology: 'Spring Boot', meta: supporting('stateless'), description: '图书目录与详情' }),
      E('svc-order', 'container', '订单服务', 640, 220, { parentSystem: S1, technology: 'Spring Boot', meta: core('stateless'), description: '下单、订单状态机（双击可下钻）' }),
      E('svc-payment', 'container', '支付服务', 940, 220, { parentSystem: S1, technology: 'Spring Boot', meta: core('stateless') }),
      E('svc-inventory', 'container', '库存服务', 640, 380, { parentSystem: S1, technology: 'Spring Boot', meta: supporting('stateful'), description: '库存扣减，强一致' }),
      E('svc-notify', 'container', '通知服务', 340, 380, { parentSystem: S1, technology: 'Spring Boot', meta: generic('stateless') }),
      E('mq', 'messageBroker', '消息中间件', 340, 540, { parentSystem: S1, technology: 'RocketMQ', tags: ['async'] }),
      E('db-order', 'database', '订单库', 640, 540, { parentSystem: S1, technology: 'MySQL', meta: { stateful: 'stateful' } }),
      E('db-product', 'database', '商品库', 60, 540, { parentSystem: S1, technology: 'MySQL', meta: { stateful: 'stateful' } }),
      E('cache', 'cache', '缓存', 60, 380, { parentSystem: S1, technology: 'Redis' }),

      // 组件层（parentContainer = 订单服务）
      E('cmp-order-api', 'component', '订单API控制器', 300, 60, { parentContainer: 'svc-order', technology: 'Spring MVC' }),
      E('cmp-order-app', 'component', '订单应用服务', 300, 220, { parentContainer: 'svc-order', technology: 'Application Service' }),
      E('cmp-order-domain', 'component', '订单领域模型', 300, 380, { parentContainer: 'svc-order', technology: 'DDD Aggregate', description: '订单聚合（双击可下钻看类）' }),
      E('cmp-order-repo', 'component', '订单仓储', 600, 240, { parentContainer: 'svc-order', technology: 'Repository' }),
      E('ent-order', 'entity', '订单 Order', 940, 140, { parentContainer: 'svc-order',
        attributes: ['PK id: Long', 'FK userId: Long', 'amount: Decimal', 'status: String', 'createdAt: DateTime'] }),
      E('ent-orderitem', 'entity', '订单项 OrderItem', 940, 620, { parentContainer: 'svc-order',
        attributes: ['PK id: Long', 'FK orderId: Long', 'FK skuId: Long', 'qty: Int', 'price: Decimal'] }),

      // 代码层（parentComponent = 订单领域模型）
      E('cls-order', 'class', 'Order', 260, 100, { parentComponent: 'cmp-order-domain',
        attributes: ['- orderId: Long', '- items: List<OrderItem>', '- status: OrderStatus'],
        methods: ['+ addItem(item: OrderItem): void', '+ pay(amount: Money): Boolean', '+ cancel(): void', '+ totalAmount(): BigDecimal'] }),
      E('cls-orderitem', 'class', 'OrderItem', 260, 380, { parentComponent: 'cmp-order-domain',
        attributes: ['- skuId: Long', '- qty: int', '- price: BigDecimal'],
        methods: ['+ subtotal(): BigDecimal'] }),
    ],
    relationships: [
      // 上下文层
      R('customer', S1, '浏览下单', { technology: 'REST/HTTPS', ...sync }),
      R(S1, 'paygw', '调用支付', { technology: 'REST/HTTPS', ...sync }),
      // 容器层
      R('customer', 'gw', '使用', { technology: 'REST/HTTPS', ...sync }),
      R('gw', 'svc-user', '路由', sync),
      R('gw', 'svc-product', '路由', sync),
      R('gw', 'svc-order', '路由', sync),
      R('svc-order', 'svc-inventory', '扣减库存', { technology: 'gRPC', ...sync }),
      R('svc-order', 'svc-payment', '发起支付', { technology: 'REST', ...sync }),
      R('svc-payment', 'paygw', '调用第三方支付', { technology: 'REST/HTTPS', ...sync }),
      R('svc-order', 'mq', '发布“订单已创建”事件', pubsub),
      R('mq', 'svc-notify', '消费事件并通知', asyncEvt),
      R('svc-order', 'db-order', '读写', dataRel),
      R('svc-product', 'db-product', '读写', dataRel),
      R('svc-product', 'cache', '缓存商品详情', dataRel),
      R('svc-user', 'cache', '缓存会话', dataRel),
      // 组件层（订单服务内部）
      R('cmp-order-api', 'cmp-order-app', '调用', sync),
      R('cmp-order-app', 'cmp-order-domain', '使用', sync),
      R('cmp-order-app', 'cmp-order-repo', '调用', sync),
      R('cmp-order-repo', 'ent-order', '持久化', dataRel),
      R('ent-order', 'ent-orderitem', '包含', { cardinality: '1-N', lineStyle: 'solid' }),
      // 代码层（订单领域模型内部）
      R('cls-order', 'cls-orderitem', '包含 1..*', dataRel),
    ],
  },
};

// ═══════════════════════════ 示例 2：外卖订餐平台 ═══════════════════════════
const S2 = 'sys-delivery';
const delivery = {
  id: 'delivery',
  name: '外卖订餐平台',
  description: '多角色（用户/商家/骑手）场景：下单、接单、配送、支付、评价（系统+容器两层）。',
  model: {
    metadata: { name: '外卖订餐平台 - 微服务拆分', version: '1.0', author: '示例' },
    elements: [
      E(S2, 'system', '外卖订餐平台', 420, 180),
      E('u-user', 'person', '用户', 80, 60),
      E('u-merchant', 'person', '商家', 80, 180),
      E('u-rider', 'person', '骑手', 80, 300),
      E('ext-map', 'externalSystem', '地图 / 定位服务', 820, 100, { technology: '高德/腾讯地图 API' }),
      E('ext-pay', 'externalSystem', '第三方支付平台', 820, 240, { technology: 'OpenAPI' }),

      E('gw', 'apiGateway', 'API 网关', 400, 40, { parentSystem: S2, technology: 'Kong', meta: generic('stateless') }),
      E('svc-user', 'container', '用户服务', 60, 220, { parentSystem: S2, technology: 'Go', meta: supporting('stateless') }),
      E('svc-merchant', 'container', '商家服务', 320, 220, { parentSystem: S2, technology: 'Go', meta: supporting('stateless') }),
      E('svc-dish', 'container', '菜品服务', 580, 220, { parentSystem: S2, technology: 'Go', meta: supporting('stateless') }),
      E('svc-order', 'container', '订单服务', 840, 220, { parentSystem: S2, technology: 'Go', meta: core('stateless') }),
      E('svc-delivery', 'container', '配送服务', 580, 380, { parentSystem: S2, technology: 'Go', meta: core('stateful'), description: '派单、轨迹跟踪' }),
      E('svc-payment', 'container', '支付服务', 840, 380, { parentSystem: S2, technology: 'Go', meta: core('stateless') }),
      E('svc-review', 'container', '评价服务', 320, 380, { parentSystem: S2, technology: 'Go', meta: generic('stateless') }),
      E('mq', 'messageBroker', '消息中间件', 580, 540, { parentSystem: S2, technology: 'Kafka', tags: ['async'] }),
      E('db-order', 'database', '订单库', 840, 540, { parentSystem: S2, technology: 'PostgreSQL', meta: { stateful: 'stateful' } }),
      E('cache', 'cache', '缓存', 60, 380, { parentSystem: S2, technology: 'Redis' }),
    ],
    relationships: [
      R('u-user', S2, '点餐下单', { technology: 'REST/HTTPS', ...sync }),
      R('u-merchant', S2, '接单/管理菜品', { technology: 'REST/HTTPS', ...sync }),
      R('u-rider', S2, '接单/上报位置', { technology: 'REST/HTTPS', ...sync }),
      R(S2, 'ext-map', '路径规划/定位', { technology: 'REST', ...sync }),
      R(S2, 'ext-pay', '在线支付', { technology: 'REST/HTTPS', ...sync }),

      R('u-user', 'gw', '点餐下单', { technology: 'REST/HTTPS', ...sync }),
      R('gw', 'svc-user', '路由', sync),
      R('gw', 'svc-merchant', '路由', sync),
      R('gw', 'svc-dish', '路由', sync),
      R('gw', 'svc-order', '路由', sync),
      R('svc-order', 'svc-payment', '发起支付', { technology: 'gRPC', ...sync }),
      R('svc-payment', 'ext-pay', '调用第三方支付', { technology: 'REST/HTTPS', ...sync }),
      R('svc-order', 'mq', '发布“订单已支付”事件', pubsub),
      R('mq', 'svc-delivery', '消费并派单', asyncEvt),
      R('svc-delivery', 'ext-map', '路径规划/定位', { technology: 'REST', ...sync }),
      R('mq', 'svc-review', '订单完成后触发评价', asyncEvt),
      R('svc-order', 'db-order', '读写', dataRel),
      R('svc-dish', 'cache', '缓存菜品', dataRel),
    ],
  },
};

// ═══════════════════════════ 示例 3：在线教育课程平台 ═══════════════════════════
const S3 = 'sys-education';
const education = {
  id: 'education',
  name: '在线教育课程平台',
  description: '含大文件（视频）场景：选课购买、视频点播、学习进度、评论（系统+容器两层）。',
  model: {
    metadata: { name: '在线教育平台 - 微服务拆分', version: '1.0', author: '示例' },
    elements: [
      E(S3, 'system', '在线教育平台', 420, 180),
      E('u-student', 'person', '学员', 100, 100),
      E('u-teacher', 'person', '讲师', 100, 240),
      E('ext-cdn', 'externalSystem', 'CDN', 820, 100, { technology: '内容分发网络' }),
      E('ext-pay', 'externalSystem', '第三方支付平台', 820, 240, { technology: 'OpenAPI' }),

      E('gw', 'apiGateway', 'API 网关', 400, 40, { parentSystem: S3, technology: 'APISIX', meta: generic('stateless') }),
      E('svc-user', 'container', '用户服务', 60, 220, { parentSystem: S3, technology: 'Java', meta: supporting('stateless') }),
      E('svc-course', 'container', '课程服务', 320, 220, { parentSystem: S3, technology: 'Java', meta: core('stateless'), description: '课程目录、章节' }),
      E('svc-video', 'container', '视频服务', 580, 220, { parentSystem: S3, technology: 'Java', meta: core('stateless'), description: '转码、播放鉴权' }),
      E('svc-order', 'container', '订单服务', 840, 220, { parentSystem: S3, technology: 'Java', meta: core('stateless') }),
      E('svc-progress', 'container', '学习进度服务', 580, 380, { parentSystem: S3, technology: 'Java', meta: supporting('stateful') }),
      E('svc-comment', 'container', '评论服务', 320, 380, { parentSystem: S3, technology: 'Java', meta: generic('stateless') }),
      E('oss', 'objectStorage', '对象存储（视频）', 580, 540, { parentSystem: S3, technology: 'MinIO / OSS', tags: ['storage'] }),
      E('mq', 'messageBroker', '消息中间件', 320, 540, { parentSystem: S3, technology: 'RabbitMQ', tags: ['async'] }),
      E('db-course', 'database', '课程库', 60, 540, { parentSystem: S3, technology: 'MySQL', meta: { stateful: 'stateful' } }),
      E('cache', 'cache', '缓存', 60, 380, { parentSystem: S3, technology: 'Redis' }),
    ],
    relationships: [
      R('u-student', S3, '选课/学习', { technology: 'REST/HTTPS', ...sync }),
      R('u-teacher', S3, '上传课程', { technology: 'REST/HTTPS', ...sync }),
      R(S3, 'ext-cdn', '视频分发', { technology: 'HTTPS', ...sync }),
      R(S3, 'ext-pay', '在线支付', { technology: 'REST/HTTPS', ...sync }),

      R('u-student', 'gw', '选课/学习', { technology: 'REST/HTTPS', ...sync }),
      R('gw', 'svc-user', '路由', sync),
      R('gw', 'svc-course', '路由', sync),
      R('gw', 'svc-video', '路由', sync),
      R('gw', 'svc-order', '路由', sync),
      R('svc-video', 'oss', '存取视频文件', dataRel),
      R('svc-video', 'ext-cdn', '分发播放', { technology: 'HTTPS', ...sync }),
      R('svc-order', 'ext-pay', '支付', { technology: 'REST/HTTPS', ...sync }),
      R('svc-order', 'mq', '发布“购买成功”事件', pubsub),
      R('mq', 'svc-progress', '开通课程权限', asyncEvt),
      R('svc-course', 'db-course', '读写', dataRel),
      R('svc-course', 'cache', '缓存课程详情', dataRel),
      R('svc-progress', 'svc-course', '查询章节', { technology: 'gRPC', ...sync }),
    ],
  },
};

// ═══════════════════════════ 示例 4：事件风暴（在线书店 · 下单全流程） ═══════════════════════════
// 与「在线书店」C4 示例同一业务场景：先用事件风暴梳理业务流程，再落到微服务拆分，体现方法论的层层递进。
const eventStorming = {
  id: 'es-bookstore',
  name: '事件风暴：在线书店下单流程',
  description: '业务分析阶段：从下单到收货的领域事件、命令、策略与热点，含"事件→策略→命令"的流程级建模。',
  view: 'event-storming',
  model: {
    elements: [
      E('es-actor-1', 'esActor', '顾客', 40, 80),
      E('es-cmd-submit', 'command', '提交订单', 240, 80),
      E('es-agg-order-1', 'aggregate', '订单', 440, 80, { description: '订单聚合：管理下单/支付/发货/完成状态机' }),
      E('es-evt-created', 'domainEvent', '订单已创建', 440, 220),
      E('es-rm-orders', 'readModel', '我的订单列表', 440, 360, { description: '顾客端"我的订单"页面数据来源' }),
      E('es-policy-deduct', 'policy', '库存自动扣减策略', 640, 220, { description: '监听「订单已创建」，自动触发库存扣减' }),
      E('es-cmd-deduct', 'command', '扣减库存', 840, 220),
      E('es-agg-inventory', 'aggregate', '库存', 1040, 220, { description: '库存聚合：SKU 可用量与预占' }),
      E('es-evt-deducted', 'domainEvent', '库存已扣减', 1040, 360),
      E('es-hotspot-oversell', 'hotspot', '库存超卖风险', 1040, 80, { description: '高并发下单时库存扣减可能晚于下单确认，需要乐观锁/预占机制' }),
      E('es-actor-2', 'esActor', '顾客', 240, 500),
      E('es-cmd-pay', 'command', '支付订单', 440, 500),
      E('es-agg-payment', 'aggregate', '支付单', 640, 500),
      E('es-ext-paygw', 'esExternal', '第三方支付网关', 840, 500),
      E('es-evt-paid', 'domainEvent', '支付已完成', 1040, 500),
      E('es-policy-ship', 'policy', '支付成功后自动发货策略', 1240, 500, { description: '监听「支付已完成」，触发生成发货单' }),
      E('es-cmd-ship', 'command', '生成发货单', 1440, 500),
      E('es-agg-order-2', 'aggregate', '订单', 1640, 500, { description: '同一订单聚合，在发货节点再次出现' }),
      E('es-evt-shipped', 'domainEvent', '订单已发货', 1840, 500),
      E('es-rm-detail', 'readModel', '订单详情页', 1840, 360, { description: '展示订单物流状态' }),
      E('es-actor-3', 'esActor', '顾客', 2040, 80),
      E('es-cmd-confirm', 'command', '确认收货', 2240, 80),
      E('es-agg-order-3', 'aggregate', '订单', 2440, 80, { description: '同一订单聚合，在完成节点再次出现' }),
      E('es-evt-completed', 'domainEvent', '订单已完成', 2640, 80),
    ],
    relationships: [
      R('es-actor-1', 'es-cmd-submit', '发起'),
      R('es-cmd-submit', 'es-agg-order-1', '提交给'),
      R('es-agg-order-1', 'es-evt-created', '产生'),
      R('es-evt-created', 'es-rm-orders', '投影到'),
      R('es-evt-created', 'es-policy-deduct', '触发'),
      R('es-policy-deduct', 'es-cmd-deduct', '派发'),
      R('es-cmd-deduct', 'es-agg-inventory', '作用于'),
      R('es-agg-inventory', 'es-evt-deducted', '产生'),
      R('es-actor-2', 'es-cmd-pay', '发起'),
      R('es-cmd-pay', 'es-agg-payment', '提交给'),
      R('es-agg-payment', 'es-ext-paygw', '调用'),
      R('es-agg-payment', 'es-evt-paid', '产生'),
      R('es-evt-paid', 'es-policy-ship', '触发'),
      R('es-policy-ship', 'es-cmd-ship', '派发'),
      R('es-cmd-ship', 'es-agg-order-2', '作用于'),
      R('es-agg-order-2', 'es-evt-shipped', '产生'),
      R('es-evt-shipped', 'es-rm-detail', '投影到'),
      R('es-actor-3', 'es-cmd-confirm', '发起'),
      R('es-cmd-confirm', 'es-agg-order-3', '提交给'),
      R('es-agg-order-3', 'es-evt-completed', '产生'),
    ],
  },
};

// ═══════════════════════════ 示例 5：领域故事（在线书店 · 顾客下单到签收） ═══════════════════════════
const domainStory = {
  id: 'ds-bookstore',
  name: '领域故事：顾客下单到签收',
  description: '业务分析阶段：用"角色 + 工作对象 + 编号活动箭头"讲述一次完整下单-支付-发货-签收的业务故事。',
  view: 'domain-story',
  model: {
    elements: [
      E('ds-customer', 'dsActor', '顾客', 40, 80),
      E('ds-cart', 'woItem', '购物车', 230, 260),
      E('ds-shop', 'dsSystem', '网店系统', 420, 440),
      E('ds-order', 'woDocument', '订单', 610, 80),
      E('ds-paygw', 'dsSystem', '支付网关', 800, 260),
      E('ds-receipt', 'woMoney', '支付凭证', 990, 440),
      E('ds-shipment', 'woDocument', '发货单', 1180, 80),
      E('ds-warehouse', 'dsActor', '仓库管理员', 1370, 260),
      E('ds-parcel', 'woItem', '包裹', 1560, 440),
      E('ds-courier', 'dsActor', '快递员', 1750, 80),
      E('ds-signoff', 'woResult', '签收确认', 1940, 260),
    ],
    relationships: [
      R('ds-customer', 'ds-cart', '添加商品', { sequence: 1 }),
      R('ds-cart', 'ds-shop', '提交结算', { sequence: 2 }),
      R('ds-shop', 'ds-order', '生成', { sequence: 3 }),
      R('ds-shop', 'ds-paygw', '请求扣款', { sequence: 4 }),
      R('ds-paygw', 'ds-receipt', '返回', { sequence: 5 }),
      R('ds-receipt', 'ds-shop', '确认到账', { sequence: 6 }),
      R('ds-shop', 'ds-shipment', '生成', { sequence: 7 }),
      R('ds-shipment', 'ds-warehouse', '通知拣货', { sequence: 8 }),
      R('ds-warehouse', 'ds-parcel', '打包', { sequence: 9 }),
      R('ds-parcel', 'ds-courier', '移交配送', { sequence: 10 }),
      R('ds-courier', 'ds-signoff', '完成签收', { sequence: 11 }),
      R('ds-signoff', 'ds-customer', '通知已签收', { sequence: 12 }),
    ],
  },
};

// ═══════════════════════════ 示例 6：限界上下文画布（在线书店 · 三个核心上下文） ═══════════════════════════
const BC = (id, name, fields) => ({
  id, name,
  purpose: '', domain: '', businessModel: '', evolution: '', roles: [],
  ubiquitousLanguage: '', businessDecisions: '', inbound: '', outbound: '',
  assumptions: '', verificationMetrics: '', openQuestions: '',
  ...fields,
});

const boundedContext = {
  id: 'bc-bookstore',
  name: '限界上下文画布：在线书店三个核心上下文',
  description: '战略设计阶段：订单履约 / 库存 / 支付三个限界上下文，作为下游微服务拆分（C4）的业务依据。',
  view: 'bounded-context',
  model: {
    bcCanvases: [
      BC('bc-order', '订单履约', {
        purpose: '负责顾客下单后的订单生命周期管理：创建、状态流转、发货跟踪，是顾客体验的核心链路。',
        domain: '核心域 Core', businessModel: '营收 Revenue', evolution: '产品 Product',
        roles: ['执行模型 Execution'],
        ubiquitousLanguage: '订单 Order\n订单项 OrderItem\n订单状态机 OrderStateMachine\n发货单 Shipment',
        businessDecisions: '订单支付超时 30 分钟自动取消\n发货前允许修改收货地址，发货后不允许',
        inbound: '顾客下单请求（来自 API 网关）\n支付结果回调（来自 支付上下文）',
        outbound: '订单已创建事件（发布给 库存上下文 / 推荐服务）\n发货请求（发送给 物流上下文）',
        assumptions: '假设支付上下文能在 5 秒内返回同步支付结果',
        verificationMetrics: '订单创建成功率 > 99.9%\n订单状态无跨服务漂移',
        openQuestions: '订单和购物车是否应该拆分为两个独立上下文？',
      }),
      BC('bc-inventory', '库存管理', {
        purpose: '管理商品库存的准确性，支持订单履约的库存预占与扣减，防止超卖。',
        domain: '支撑域 Supporting', businessModel: '降本 Cost Reduction', evolution: '商品化 Commodity',
        roles: ['规格模型 Specification'],
        ubiquitousLanguage: 'SKU\n可用库存 Available Stock\n预占 Reservation\n安全库存 Safety Stock',
        businessDecisions: '库存预占 15 分钟未支付自动释放',
        inbound: '订单已创建事件（来自 订单履约上下文）',
        outbound: '库存已扣减事件（发布给 订单履约上下文 / 推荐服务）',
        assumptions: '假设同一 SKU 的库存扣减可以接受最终一致',
        verificationMetrics: '超卖率 = 0\n库存扣减平均延迟 < 200ms',
        openQuestions: '多仓库场景下库存如何分配？',
      }),
      BC('bc-payment', '支付', {
        purpose: '统一封装与第三方支付渠道的对接，提供支付、退款、对账能力，隔离支付合规风险。',
        domain: '通用域 Generic', businessModel: '合规 Compliance', evolution: '定制 Custom Built',
        roles: ['执行模型 Execution', '审批者 Approver'],
        ubiquitousLanguage: '支付单 PaymentOrder\n支付渠道 Channel\n对账 Reconciliation',
        businessDecisions: '所有退款需要走人工审批',
        inbound: '发起支付请求（来自 订单履约上下文）',
        outbound: '支付已完成事件（发布给 订单履约上下文）',
        assumptions: '假设第三方支付网关 SLA 保证 99.95% 可用性',
        verificationMetrics: '支付成功率\n对账差异数',
        openQuestions: '是否需要自建资金账户体系应对多渠道合规？',
      }),
    ],
  },
};

export const EXAMPLES = [bookstore, delivery, education, eventStorming, domainStory, boundedContext];
export const getExample = (id) => EXAMPLES.find((e) => e.id === id);
