import { Plus, Trash2 } from 'lucide-react';
import { UML_VISIBILITY, ER_KEYS, COMMON_TYPES } from '../config/elementTypes';
import { parseColumn, fmtColumn, parseAttr, fmtAttr, parseOp, fmtOp } from '../utils/modelFormat';

const sel = 'px-1 py-1 border border-gray-300 rounded text-xs bg-white';
const inp = 'px-2 py-1 border border-gray-300 rounded text-xs';

// 类型选择：下拉列出全部常用类型；已有自定义类型保留为选项；“自定义…”可输入新类型
const TypeInput = ({ value, onChange, w = 'w-24' }) => {
  const known = COMMON_TYPES.includes(value);
  return (
    <select
      className={`${sel} ${w}`}
      value={known ? value : value ? '__cur__' : ''}
      onChange={(e) => {
        const v = e.target.value;
        if (v === '__custom__') {
          const t = window.prompt('输入自定义类型：', value || '');
          if (t !== null && t.trim()) onChange(t.trim());
        } else if (v !== '__cur__') {
          onChange(v);
        }
      }}
    >
      <option value="">（类型）</option>
      {COMMON_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
      {value && !known && <option value="__cur__">{value}</option>}
      <option value="__custom__">自定义…</option>
    </select>
  );
};

const AddBtn = ({ onClick, label }) => (
  <button onClick={onClick} className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
    <Plus className="w-3.5 h-3.5" /> {label}
  </button>
);
const DelBtn = ({ onClick }) => (
  <button onClick={onClick} className="text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
);

// ——— ER 列编辑器 ——— //
export const ColumnEditor = ({ value, onChange }) => {
  const rows = (value || []).map(parseColumn);
  const commit = (rs) => onChange(rs.map(fmtColumn));
  const update = (i, patch) => commit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1">
          <select className={`${sel} w-16`} value={r.key} onChange={(e) => update(i, { key: e.target.value })}>
            {ER_KEYS.map((k) => <option key={k.value} value={k.value}>{k.value || '—'}</option>)}
          </select>
          <input className={`${inp} flex-1 min-w-[70px]`} value={r.name} placeholder="列名"
            onChange={(e) => update(i, { name: e.target.value })} />
          <TypeInput value={r.type} onChange={(v) => update(i, { type: v })} />
          <label className="flex items-center gap-0.5 text-[10px] text-gray-500">
            <input type="checkbox" checked={r.nullable} onChange={(e) => update(i, { nullable: e.target.checked })} />可空
          </label>
          <DelBtn onClick={() => commit(rows.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <AddBtn onClick={() => onChange([...(value || []), fmtColumn({ key: '', name: 'newCol', type: 'String', nullable: false })])} label="添加列" />
    </div>
  );
};

// ——— UML 属性编辑器 ——— //
export const AttrEditor = ({ value, onChange }) => {
  const rows = (value || []).map(parseAttr);
  const commit = (rs) => onChange(rs.map(fmtAttr));
  const update = (i, patch) => commit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-1.5">
      {rows.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-1">
          <select className={`${sel} w-12`} value={r.vis} onChange={(e) => update(i, { vis: e.target.value })}>
            {UML_VISIBILITY.map((v) => <option key={v.value} value={v.value} title={v.label}>{v.value}</option>)}
          </select>
          <input className={`${inp} flex-1 min-w-[70px]`} value={r.name} placeholder="名称"
            onChange={(e) => update(i, { name: e.target.value })} />
          <TypeInput value={r.type} onChange={(v) => update(i, { type: v })} />
          <DelBtn onClick={() => commit(rows.filter((_, idx) => idx !== i))} />
        </div>
      ))}
      <AddBtn onClick={() => onChange([...(value || []), fmtAttr({ vis: '-', name: 'field', type: 'String' })])} label="添加属性" />
    </div>
  );
};

// ——— UML 操作编辑器 ——— //
export const OpEditor = ({ value, onChange }) => {
  const rows = (value || []).map(parseOp);
  const commit = (rs) => onChange(rs.map(fmtOp));
  const update = (i, patch) => commit(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={i} className="border border-gray-200 rounded p-1.5 space-y-1">
          <div className="flex items-center gap-1">
            <select className={`${sel} w-12`} value={r.vis} onChange={(e) => update(i, { vis: e.target.value })}>
              {UML_VISIBILITY.map((v) => <option key={v.value} value={v.value} title={v.label}>{v.value}</option>)}
            </select>
            <input className={`${inp} flex-1 min-w-[60px]`} value={r.name} placeholder="方法名"
              onChange={(e) => update(i, { name: e.target.value })} />
            <TypeInput value={r.ret} onChange={(v) => update(i, { ret: v })} />
            <DelBtn onClick={() => commit(rows.filter((_, idx) => idx !== i))} />
          </div>
          <input className={`${inp} w-full`} value={r.params} placeholder="参数：name: Type, name2: Type2"
            onChange={(e) => update(i, { params: e.target.value })} />
        </div>
      ))}
      <AddBtn onClick={() => onChange([...(value || []), fmtOp({ vis: '+', name: 'method', params: '', ret: 'void' })])} label="添加方法" />
    </div>
  );
};
