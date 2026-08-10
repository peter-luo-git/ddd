import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Box, ChevronDown, KeyRound } from 'lucide-react';
import { getType } from '../config/elementTypes';
import { parseColumn } from '../utils/modelFormat';

const asList = (v) => (Array.isArray(v) ? v : typeof v === 'string' && v ? v.split('\n') : []).map((s) => s.trim()).filter(Boolean);

const handles = (
  <>
    <Handle type="target" position={Position.Top} id="top" className="w-3 h-3" />
    <Handle type="source" position={Position.Bottom} id="bottom" className="w-3 h-3" />
    <Handle type="source" position={Position.Right} id="right" className="w-3 h-3" />
    <Handle type="target" position={Position.Left} id="left" className="w-3 h-3" />
  </>
);

const C4Node = ({ data, selected }) => {
  const def = getType(data.type);
  const rich = def?.rich; // 'entity' | 'class'
  const Icon = def?.icon || Box;
  const ring = selected ? 'ring-4 ring-blue-400' : '';

  // —— 领域故事：图符 + 标签（黑色图标，无边框） —— //
  if (def?.board === 'domain-story') {
    return (
      <div className={`flex flex-col items-center gap-1 px-2 py-1 rounded ${selected ? 'ring-2 ring-blue-400' : ''}`}>
        {handles}
        <Icon className="w-9 h-9 text-gray-800" strokeWidth={1.5} />
        <div className="text-sm text-gray-800 font-medium text-center max-w-[120px]">{data.label || data.name || ''}</div>
      </div>
    );
  }

  // —— ER 数据表 —— //
  if (rich === 'entity') {
    const cols = asList(data.attributes).map(parseColumn);
    return (
      <div className={`rounded-lg border-2 bg-white border-emerald-500 shadow-lg min-w-[220px] ${ring}`}>
        {handles}
        <div className="px-3 py-2 bg-emerald-500 text-white rounded-t-md flex items-center gap-2 font-bold text-sm">
          <Icon className="w-4 h-4" /> {data.label || data.name || 'Entity'}
        </div>
        <div className="divide-y divide-gray-100">
          {cols.length === 0 && <div className="px-3 py-2 text-xs text-gray-400">（在属性面板添加列）</div>}
          {cols.map((c, i) => (
            <div key={i} className="px-3 py-1.5 flex items-center gap-2 text-xs">
              <span className="w-8 shrink-0 text-[10px] font-semibold text-gray-400">
                {c.key.includes('PK') && <KeyRound className="inline w-3 h-3 text-amber-500" />}
                {c.key === 'FK' && 'FK'}
              </span>
              <span className={`flex-1 ${c.key.includes('PK') ? 'font-bold underline' : c.key === 'FK' ? 'italic' : ''}`}>
                {c.name}{c.nullable && <span className="text-gray-400"> ?</span>}
              </span>
              <span className="text-gray-500 font-mono">{c.type}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // —— UML 类（三分栏：类名 / 属性 / 操作） —— //
  if (rich === 'class') {
    const attrs = asList(data.attributes);
    const ops = asList(data.methods);
    return (
      <div className={`rounded-md border-2 bg-white border-slate-500 shadow-lg min-w-[200px] ${ring}`}>
        {handles}
        <div className="px-3 py-2 bg-slate-100 rounded-t-sm text-center border-b-2 border-slate-500">
          <div className="text-[10px] text-gray-500">«class»</div>
          <div className="font-bold text-gray-900">{data.label || data.name || 'Class'}</div>
        </div>
        <div className="px-3 py-1.5 text-xs font-mono text-gray-800 space-y-0.5 border-b border-slate-300 min-h-[8px]">
          {attrs.map((a, i) => <div key={i}>{a}</div>)}
        </div>
        <div className="px-3 py-1.5 text-xs font-mono text-gray-800 space-y-0.5 min-h-[8px]">
          {ops.map((m, i) => <div key={i}>{m}</div>)}
        </div>
      </div>
    );
  }

  // —— 普通 C4 / 基础设施节点 —— //
  const baseStyle = 'px-4 py-3 rounded-lg border-2 min-w-[200px] shadow-lg transition-all';
  const nodeStyle = def ? `${baseStyle} ${def.node}` : `${baseStyle} bg-white border-gray-300`;
  return (
    <div className={`${nodeStyle} ${ring}`}>
      {handles}
      <div className="flex items-start gap-2">
        <div className="mt-1"><Icon className="w-5 h-5" /></div>
        <div className="flex-1">
          <div className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">{def?.label || data.type}</div>
          <div className="font-bold text-gray-900 mb-1">{data.label || data.name || 'Unnamed'}</div>
          {data.technology && <div className="text-xs text-gray-600 italic mb-1">[{data.technology}]</div>}
          {data.description && <div className="text-xs text-gray-700 mt-2">{data.description}</div>}
        </div>
      </div>
      {def?.canContain && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-gray-500">
          <ChevronDown className="w-3 h-3" /> 双击进入内部
        </div>
      )}
    </div>
  );
};

export default memo(C4Node);
