import useStore from '../store';
import { getType } from '../config/elementTypes';
import { ColumnEditor, AttrEditor, OpEditor } from './FieldEditors';

// 画布下方的"建模"面板：仅在选中数据实体 / UML 类时出现，单独突出字段编辑。
const STYLE = {
  entity: { border: 'border-emerald-400', bar: 'bg-emerald-50', icon: 'text-emerald-600' },
  class: { border: 'border-slate-400', bar: 'bg-slate-100', icon: 'text-slate-600' },
};

const FieldEditorPanel = () => {
  const selectedElement = useStore((s) => s.selectedElement);
  const updateElement = useStore((s) => s.updateElement);

  const def = selectedElement ? getType(selectedElement.type) : null;
  if (!def?.rich) return null;

  const el = selectedElement;
  const Icon = def.icon;
  const st = STYLE[def.rich] || STYLE.entity;
  const set = (patch) => updateElement(el.type, el.id, patch);

  return (
    <div className={`border-t-2 ${st.border} bg-white flex flex-col`} style={{ height: 280 }}>
      <div className={`flex items-center gap-2 px-4 py-2 ${st.bar} border-b border-gray-200 shrink-0`}>
        <Icon className={`w-4 h-4 ${st.icon}`} />
        <span className="font-semibold text-sm text-gray-800">{el.name}</span>
        <span className="text-xs text-gray-500">· {def.label} 建模</span>
        <span className="ml-auto text-xs text-gray-400">下拉选关键字，无需记语法</span>
      </div>

      <div className="p-4 overflow-y-auto flex-1">
        {def.rich === 'entity' ? (
          <div className="max-w-3xl">
            <div className="text-xs font-semibold text-gray-600 mb-2">ER 列（主外键 / 类型用下拉，勾选可空）</div>
            <ColumnEditor value={el.attributes || []} onChange={(v) => set({ attributes: v })} />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-8 max-w-5xl">
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">属性</div>
              <AttrEditor value={el.attributes || []} onChange={(v) => set({ attributes: v })} />
            </div>
            <div>
              <div className="text-xs font-semibold text-gray-600 mb-2">操作 / 方法</div>
              <OpEditor value={el.methods || []} onChange={(v) => set({ methods: v })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FieldEditorPanel;
