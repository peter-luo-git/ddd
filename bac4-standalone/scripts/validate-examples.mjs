// 校验内置示例结构：id 唯一、关系端点存在、类型合法、必填字段齐全。
import { EXAMPLES } from '../src/examples/index.js';

const TYPES = new Set([
  'system', 'container', 'component', 'person', 'externalSystem',
  'apiGateway', 'messageBroker', 'database', 'objectStorage', 'cache', 'saga',
  'entity', 'class',
]);
const PARENT_FIELDS = ['parentSystem', 'parentContainer', 'parentComponent'];

let errors = 0;
const fail = (msg) => { console.error('  ✗ ' + msg); errors++; };

for (const ex of EXAMPLES) {
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
