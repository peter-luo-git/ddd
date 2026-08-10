import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import useStore from '../store';
import { getType, ELEMENT_META_FIELDS, RELATIONSHIP_META_FIELDS, CARDINALITIES } from '../config/elementTypes';

const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-semibold text-gray-600 mb-1';

// 通信方式 → 线型 的自动联动映射
const KIND_LINE = { sync: 'solid', async: 'dashed', 'pub-sub': 'dashed', data: 'dotted', orchestration: 'solid' };

const PropertiesPanel = () => {
  const {
    selectedElement,
    selectedEdge,
    setSelectedElement,
    setSelectedEdge,
    updateElement,
    deleteElement,
    updateRelationship,
    deleteRelationship,
  } = useStore();

  const [formData, setFormData] = useState({ name: '', description: '', technology: '', tags: '' });
  const [metaData, setMetaData] = useState({});

  const [edgeFormData, setEdgeFormData] = useState({ description: '', technology: '', arrowDirection: 'right', lineStyle: 'solid' });
  const [edgeMeta, setEdgeMeta] = useState({});

  useEffect(() => {
    if (selectedElement && selectedElement.id) {
      setFormData({
        name: selectedElement.name || '',
        description: selectedElement.description || '',
        technology: selectedElement.technology || '',
        tags: Array.isArray(selectedElement.tags) ? selectedElement.tags.join(', ') : '',
      });
      setMetaData(selectedElement.meta && typeof selectedElement.meta === 'object' ? selectedElement.meta : {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedElement?.id]);

  useEffect(() => {
    if (selectedEdge && selectedEdge.id) {
      setEdgeFormData({
        description: selectedEdge.description || '',
        technology: selectedEdge.technology || '',
        arrowDirection: selectedEdge.arrowDirection || 'right',
        lineStyle: selectedEdge.lineStyle || 'solid',
        cardinality: selectedEdge.cardinality || '',
        sequence: selectedEdge.sequence ?? '',
      });
      setEdgeMeta(selectedEdge.meta && typeof selectedEdge.meta === 'object' ? selectedEdge.meta : {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEdge?.id]);

  // —— 元素 —— //
  const handleInputChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = () => {
    if (!selectedElement) return;
    updateElement(selectedElement.type, selectedElement.id, {
      name: formData.name,
      description: formData.description,
      technology: formData.technology,
      tags: formData.tags.split(',').map((t) => t.trim()).filter(Boolean),
    });
  };

  const handleMetaChange = (key, value) => {
    if (!selectedElement) return;
    const newMeta = { ...metaData, [key]: value };
    setMetaData(newMeta);
    updateElement(selectedElement.type, selectedElement.id, { meta: newMeta });
  };

  const handleDelete = () => {
    if (selectedElement && window.confirm('确定删除该元素吗？')) {
      deleteElement(selectedElement.type, selectedElement.id);
      setSelectedElement(null);
    }
  };

  // —— 关系 —— //
  const handleEdgeInputChange = (field, value) => setEdgeFormData((prev) => ({ ...prev, [field]: value }));

  const handleEdgeSave = () => {
    if (!selectedEdge) return;
    const { sequence, ...rest } = edgeFormData;
    updateRelationship(selectedEdge.id, { ...rest, sequence: sequence === '' ? undefined : Number(sequence) });
  };

  const handleEdgeSelectChange = (field, value) => {
    const next = { ...edgeFormData, [field]: value };
    setEdgeFormData(next);
    if (selectedEdge) updateRelationship(selectedEdge.id, next);
  };

  const handleEdgeMetaChange = (key, value) => {
    if (!selectedEdge) return;
    const newMeta = { ...edgeMeta, [key]: value };
    setEdgeMeta(newMeta);
    const updates = { meta: newMeta };
    // 选「通信方式」时自动联动线型（之后仍可手动改线型覆盖）
    if (key === 'kind' && KIND_LINE[value]) {
      updates.lineStyle = KIND_LINE[value];
      setEdgeFormData((prev) => ({ ...prev, lineStyle: KIND_LINE[value] }));
    }
    updateRelationship(selectedEdge.id, updates);
  };

  const handleEdgeDelete = () => {
    if (selectedEdge && window.confirm('确定删除该关系吗？')) {
      deleteRelationship(selectedEdge.id);
      setSelectedEdge(null);
    }
  };

  // ================= 关系属性面板 =================
  if (selectedEdge && !selectedElement) {
    return (
      <aside className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">关系属性</h2>
          <button onClick={() => setSelectedEdge(null)} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>ID</label>
            <div className="px-3 py-2 bg-gray-100 rounded text-xs text-gray-600 font-mono break-all">{selectedEdge.id}</div>
          </div>

          <div>
            <label htmlFor="edge-description" className={labelCls}>描述</label>
            <input id="edge-description" type="text" value={edgeFormData.description}
              onChange={(e) => handleEdgeInputChange('description', e.target.value)} onBlur={handleEdgeSave}
              className={inputCls} placeholder="例如：调用、发布订单事件；领域故事填动词如 chooses" />
          </div>

          <div>
            <label htmlFor="edge-seq" className={labelCls}>序号（领域故事活动编号）</label>
            <input id="edge-seq" type="number" value={edgeFormData.sequence}
              onChange={(e) => handleEdgeInputChange('sequence', e.target.value)} onBlur={handleEdgeSave}
              className={inputCls} placeholder="1, 2, 3…（新建时自动编号）" />
          </div>

          <div>
            <label htmlFor="edge-technology" className={labelCls}>技术 / 协议</label>
            <input id="edge-technology" type="text" value={edgeFormData.technology}
              onChange={(e) => handleEdgeInputChange('technology', e.target.value)} onBlur={handleEdgeSave}
              className={inputCls} placeholder="例如：REST/HTTPS、gRPC、Kafka" />
          </div>

          {/* 关系元数据（AI 评审用） */}
          {RELATIONSHIP_META_FIELDS.map((f) => (
            <div key={f.key}>
              <label htmlFor={`edge-meta-${f.key}`} className={labelCls}>{f.label}</label>
              <select id={`edge-meta-${f.key}`} value={edgeMeta[f.key] || ''}
                onChange={(e) => handleEdgeMetaChange(f.key, e.target.value)} className={inputCls}>
                {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          ))}

          {/* 数据建模：关系基数（Crow's Foot 乌鸦脚） */}
          <div>
            <label htmlFor="edge-cardinality" className={labelCls}>关系基数（数据建模 · 乌鸦脚）</label>
            <select id="edge-cardinality" value={edgeFormData.cardinality}
              onChange={(e) => handleEdgeSelectChange('cardinality', e.target.value)} className={inputCls}>
              {CARDINALITIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">设置后两端显示乌鸦脚符号（覆盖普通箭头）。</p>
          </div>

          <div>
            <label htmlFor="arrow-direction" className={labelCls}>箭头方向</label>
            <select id="arrow-direction" value={edgeFormData.arrowDirection}
              onChange={(e) => handleEdgeSelectChange('arrowDirection', e.target.value)} className={inputCls}>
              <option value="right">指向右 →</option>
              <option value="left">指向左 ←</option>
              <option value="both">双向 ↔</option>
              <option value="none">无 —</option>
            </select>
          </div>

          <div>
            <label htmlFor="line-style" className={labelCls}>线型</label>
            <select id="line-style" value={edgeFormData.lineStyle}
              onChange={(e) => handleEdgeSelectChange('lineStyle', e.target.value)} className={inputCls}>
              <option value="solid">实线 ————</option>
              <option value="dashed">虚线 — — —</option>
              <option value="dotted">点线 · · · ·</option>
            </select>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button onClick={handleEdgeDelete}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
              <Trash2 className="w-4 h-4" /> 删除关系
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // ================= 空态 =================
  if (!selectedElement) {
    return (
      <aside className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-gray-500 mt-8">
          <p className="text-sm">选择一个元素以查看和编辑其属性</p>
        </div>
      </aside>
    );
  }

  if (!selectedElement.id || !selectedElement.type) {
    return (
      <aside className="w-80 bg-white border-l border-gray-200 p-4">
        <div className="text-center text-red-500 mt-8">
          <p className="text-sm">错误：元素数据无效</p>
          <button onClick={() => setSelectedElement(null)} className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
            清除选择
          </button>
        </div>
      </aside>
    );
  }

  const typeDef = getType(selectedElement.type);

  // ================= 元素属性面板 =================
  return (
    <aside className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-gray-700">元素属性</h2>
        <button onClick={() => setSelectedElement(null)} className="p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelCls}>类型</label>
          <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">
            {typeDef ? typeDef.label : selectedElement.type}
          </div>
        </div>

        <div>
          <label className={labelCls}>ID</label>
          <div className="px-3 py-2 bg-gray-100 rounded text-xs text-gray-600 font-mono break-all">{selectedElement.id}</div>
        </div>

        <div>
          <label htmlFor="name" className={labelCls}>名称</label>
          <input id="name" type="text" value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)} onBlur={handleSave}
            className={inputCls} placeholder="输入元素名称" />
        </div>

        <div>
          <label htmlFor="technology" className={labelCls}>技术栈</label>
          <input id="technology" type="text" value={formData.technology}
            onChange={(e) => handleInputChange('technology', e.target.value)} onBlur={handleSave}
            className={inputCls} placeholder="例如：Spring Boot、React、PostgreSQL" />
        </div>

        <div>
          <label htmlFor="description" className={labelCls}>描述</label>
          <textarea id="description" value={formData.description} rows={4}
            onChange={(e) => handleInputChange('description', e.target.value)} onBlur={handleSave}
            className={inputCls} placeholder="描述该元素的职责与用途" />
        </div>

        {/* 富节点的字段编辑已移到画布下方的「建模」面板 */}
        {typeDef?.rich && (
          <div className="pt-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {typeDef.rich === 'entity' ? 'ER 列' : '属性 / 操作'}编辑在下方「建模」面板 ↓
            </p>
          </div>
        )}

        {/* 元素元数据（AI 评审用） */}
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-2">设计元数据</p>
          <div className="space-y-4">
            {ELEMENT_META_FIELDS.map((f) => (
              <div key={f.key}>
                <label htmlFor={`meta-${f.key}`} className={labelCls}>{f.label}</label>
                <select id={`meta-${f.key}`} value={metaData[f.key] || ''}
                  onChange={(e) => handleMetaChange(f.key, e.target.value)} className={inputCls}>
                  {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="tags" className={labelCls}>标签</label>
          <input id="tags" type="text" value={formData.tags}
            onChange={(e) => handleInputChange('tags', e.target.value)} onBlur={handleSave}
            className={inputCls} placeholder="tag1, tag2, tag3" />
          <p className="text-xs text-gray-500 mt-1">英文逗号分隔；可用受控标签如 core / async / shared-database</p>
        </div>

        <div>
          <label className={labelCls}>位置</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-gray-500">X：</span>
              <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">{Math.round(selectedElement.position?.x || 0)}</div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Y：</span>
              <div className="px-3 py-2 bg-gray-100 rounded text-sm text-gray-700">{Math.round(selectedElement.position?.y || 0)}</div>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button onClick={handleDelete}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            <Trash2 className="w-4 h-4" /> 删除元素
          </button>
        </div>
      </div>
    </aside>
  );
};

export default PropertiesPanel;
