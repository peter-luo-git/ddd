// UML / ER 字段的解析与格式化（结构 ⇄ 标准文本），供编辑器与节点渲染共用。
const VIS = ['+', '-', '#', '~'];

// ER 列：[PK|FK] name: type [?]
export const parseColumn = (line) => {
  let s = String(line).trim();
  let key = '';
  const m = s.match(/^(PK,FK|FK,PK|PK|FK)\s+/i);
  if (m) { key = m[1].toUpperCase().replace('FK,PK', 'PK,FK'); s = s.slice(m[0].length); }
  let nullable = false;
  if (s.endsWith('?')) { nullable = true; s = s.slice(0, -1).trim(); }
  const i = s.indexOf(':');
  return { key, name: (i >= 0 ? s.slice(0, i) : s).trim(), type: (i >= 0 ? s.slice(i + 1) : '').trim(), nullable };
};
export const fmtColumn = (c) => `${c.key ? c.key + ' ' : ''}${c.name}: ${c.type}${c.nullable ? '?' : ''}`;

// UML 属性：visibility name: type
export const parseAttr = (line) => {
  let s = String(line).trim();
  let vis = '';
  if (VIS.includes(s[0])) { vis = s[0]; s = s.slice(1).trim(); }
  const i = s.indexOf(':');
  return { vis: vis || '-', name: (i >= 0 ? s.slice(0, i) : s).trim(), type: (i >= 0 ? s.slice(i + 1) : '').trim() };
};
export const fmtAttr = (a) => `${a.vis} ${a.name}: ${a.type}`;

// UML 操作：visibility name(params): return
export const parseOp = (line) => {
  let s = String(line).trim();
  let vis = '';
  if (VIS.includes(s[0])) { vis = s[0]; s = s.slice(1).trim(); }
  const m = s.match(/^([^(]*)\(([^)]*)\)\s*:?\s*(.*)$/);
  if (m) return { vis: vis || '+', name: m[1].trim(), params: m[2].trim(), ret: m[3].trim() };
  return { vis: vis || '+', name: s, params: '', ret: '' };
};
export const fmtOp = (o) => `${o.vis} ${o.name}(${o.params})${o.ret ? ': ' + o.ret : ''}`;
