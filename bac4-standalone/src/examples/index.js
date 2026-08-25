// ─────────────────────────────────────────────────────────────────────────
// 内置示例：中小规模系统的微服务拆分（C4 四层：系统 → 容器 → 组件 → 代码）
// 加载后自动下钻到系统的"容器层"，双击容器/组件可继续下钻。
// ─────────────────────────────────────────────────────────────────────────

// 元素：E(id, type, name, x, y, extra)
const E = (id, type, name, x, y, extra = {}) => ({ id, type, name, position: { x, y }, ...extra });
// 关系：R(from, to, description, extra)
const R = (from, to, description, extra = {}) => ({
  id: `rel-${from}-${to}`, from, to, description,
  arrowDirection: 'right', lineStyle: extra.lineStyle || 'solid',
  technology: extra.technology || '', meta: extra.meta || {},
  cardinality: extra.cardinality || '',
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

export const EXAMPLES = [bookstore, delivery, education];
export const getExample = (id) => EXAMPLES.find((e) => e.id === id);
