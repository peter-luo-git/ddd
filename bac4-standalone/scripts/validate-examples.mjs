// 校验内置示例结构：id 唯一、关系端点存在、类型合法、必填字段齐全。
// 类型集合直接从元素类型注册表派生，覆盖 C4 / 微服务基础设施 / 事件风暴 / 领域故事 / 战略设计等全部类别。
import { EXAMPLES } from '../src/examples/index.js';
import { BY_TYPE } from '../src/config/elementTypes.js';

const TYPES = new Set(Object.keys(BY_TYPE));
const PARENT_FIELDS = ['parentSystem', 'parentContainer', 'parentComponent'];
const BC_REQUIRED_FIELDS = ['id', 'name'];

let errors = 0;
const fail = (msg) => { console.error('  ✗ ' + msg); errors++; };

for (const ex of EXAMPLES) {
  if (!ex.id) fail(`缺少 id：${ex.name}`);
  if (!ex.name) fail(`[${ex.id}] 缺少 name`);
  if (!ex.description) fail(`[${ex.id}] 缺少 description`);

  // 限界上下文画布：数据存于 bcCanvases，不走 elements/relationships
  if (ex.view === 'bounded-context') {
    const canvases = ex.model.bcCanvases || [];
    if (canvases.length === 0) fail(`[${ex.id}] bcCanvases 为空`);
    const bcIds = new Set();
    for (const c of canvases) {
      for (const f of BC_REQUIRED_FIELDS) {
        if (!c[f]) fail(`[${ex.id}] 限界上下文画布缺少 ${f}`);
      }
      if (bcIds.has(c.id)) fail(`[${ex.id}] 重复限界上下文 id：${c.id}`);
      bcIds.add(c.id);
    }
    console.log(`✓ [${ex.id}] ${ex.name}：${canvases.length} 个限界上下文画布`);
    continue;
  }

  const ids = new Set();
  for (const e of ex.model.elements) {
    if (ids.has(e.id)) fail(`[${ex.id}] 重复 id：${e.id}`);
    ids.add(e.id);
    if (!TYPES.has(e.type)) fail(`[${ex.id}] 非法类型：${e.type}（${e.id}）`);
    if (!e.name) fail(`[${ex.id}] 缺少 name：${e.id}`);
    if (!e.position || typeof e.position.x !== 'number') fail(`[${ex.id}] 缺少 position：${e.id}`);
  }
  // 父级引用必须指向存在的元素
  for (const e of ex.model.elements) {
    for (const pf of PARENT_FIELDS) {
      if (e[pf] && !ids.has(e[pf])) fail(`[${ex.id}] ${pf} 指向不存在的元素：${e[pf]}（${e.id}）`);
    }
  }
  for (const r of ex.model.relationships) {
    if (!ids.has(r.from)) fail(`[${ex.id}] 关系 from 不存在：${r.from} (${r.id})`);
    if (!ids.has(r.to)) fail(`[${ex.id}] 关系 to 不存在：${r.to} (${r.id})`);
  }
  const byLevel = (t) => ex.model.elements.filter((e) => e.type === t).length;
  console.log(`✓ [${ex.id}] ${ex.name}：${ex.model.elements.length} 元素，${ex.model.relationships.length} 关系` +
    `（系统${byLevel('system')} 组件${byLevel('component')} 实体${byLevel('entity')} 类${byLevel('class')}）`);
}

console.log(errors ? `\nFAIL：共 ${errors} 处错误` : '\nOK：全部示例结构有效');
process.exit(errors ? 1 : 0);
