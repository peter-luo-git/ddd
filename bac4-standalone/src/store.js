import { create } from 'zustand';
import { ELEMENT_TYPES, getType, storeKeyOf, LEVELS, PARENT_FIELD_BY_LEVEL } from './config/elementTypes';

// 单一 elements 数组存放所有画布元素。
// 层级 = 下钻视图：drillPath 记录 系统→容器→组件 的父级 id 路径，
// 深度决定当前层级（0 上下文 / 1 容器 / 2 组件 / 3 代码）。
const useStore = create((set, get) => ({
  debugMode: false,

  metadata: { name: 'New C4 Model', version: '1.0', author: 'Solution Architect' },

  // 下钻路径（父级元素 id 数组）与当前层级
  drillPath: [],
  currentLevel: 'context',

  // 多视图工作台：当前视图 + 各视图的数据快照（顶层 elements/relationships 为当前视图的镜像）
  currentView: 'c4',
  boards: {},

  // 限界上下文画布（战略设计，结构化表单，可多个）
  bcCanvases: [],
  selectedBcId: null,

  selectedElement: null,
  selectedEdge: null,

  elements: [],
  relationships: [],
  warnings: [],

  setMetadata: (metadata) => set({ metadata }),
  setSelectedElement: (element) => set({ selectedElement: element, selectedEdge: null }),
  setSelectedEdge: (edge) => set({ selectedEdge: edge, selectedElement: null }),

  // —— 下钻导航 —— //
  drillInto: (id) => {
    const el = get().getElementById(id);
    if (!el) return;
    const t = getType(el.type);
    if (!t || !t.canContain) return; // 该元素不可下钻
    const path = [...get().drillPath, id];
    set({ drillPath: path, currentLevel: LEVELS[path.length], selectedElement: null, selectedEdge: null });
  },
  drillTo: (index) => {
    const path = get().drillPath.slice(0, index);
    set({ drillPath: path, currentLevel: LEVELS[path.length], selectedElement: null, selectedEdge: null });
  },
  resetDrill: () => set({ drillPath: [], currentLevel: 'context', selectedElement: null, selectedEdge: null }),

  // 新增元素：C4 视图下按当前层级自动归属父级
  addElement: (type, element) => {
    const { drillPath, currentLevel, currentView } = get();
    const extra = {};
    if (currentView === 'c4') {
      const pf = PARENT_FIELD_BY_LEVEL[currentLevel];
      if (pf && drillPath.length > 0) extra[pf] = drillPath[drillPath.length - 1];
    }
    const newElement = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      ...extra,
      ...element,
    };
    set((state) => ({ elements: [...state.elements, newElement] }));
    return newElement;
  },

  updateElement: (type, id, updates) => set((state) => {
    const elements = state.elements.map((el) => (el.id === id ? { ...el, ...updates } : el));
    const updated = elements.find((el) => el.id === id);
    return { elements, selectedElement: state.selectedElement?.id === id ? updated : state.selectedElement };
  }),

  // 删除元素（连带删除其关系；及以其为父的子元素）
  deleteElement: (type, id) => set((state) => ({
    elements: state.elements.filter((el) => el.id !== id
      && el.parentSystem !== id && el.parentContainer !== id && el.parentComponent !== id),
    relationships: state.relationships.filter((rel) => rel.from !== id && rel.to !== id),
  })),

  addRelationship: (relationship) => {
    const s = get();
    const extra = {};
    // 领域故事：活动箭头自动编号（1,2,3…）
    if (s.currentView === 'domain-story' && relationship.sequence == null) {
      const maxSeq = s.relationships.reduce((m, r) => Math.max(m, r.sequence || 0), 0);
      extra.sequence = maxSeq + 1;
    }
    const newRel = { id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, ...extra, ...relationship };
    set((state) => ({ relationships: [...state.relationships, newRel] }));
    return newRel;
  },

  updateRelationship: (id, updates) => set((state) => {
    const relationships = state.relationships.map((rel) => (rel.id === id ? { ...rel, ...updates } : rel));
    const updated = relationships.find((rel) => rel.id === id);
    return { relationships, selectedEdge: state.selectedEdge?.id === id ? updated : state.selectedEdge };
  }),

  deleteRelationship: (id) => set((state) => ({
    relationships: state.relationships.filter((rel) => rel.id !== id),
  })),

  getAllElements: () => get().elements,
  getElementById: (id) => get().elements.find((el) => el.id === id),

  clearAll: () => set({
    elements: [], relationships: [], selectedElement: null, selectedEdge: null,
    warnings: [], drillPath: [], currentLevel: 'context',
  }),

  importModel: (model) => {
    let elements = [];
    if (Array.isArray(model.elements)) {
      elements = model.elements;
    } else {
      for (const t of ELEMENT_TYPES) {
        const arr = model[t.storeKey];
        if (Array.isArray(arr)) elements.push(...arr.map((e) => ({ ...e, type: e.type || t.type })));
      }
    }
    const relationships = model.relationships || [];
    set({
      metadata: model.metadata || get().metadata,
      elements, relationships,
      drillPath: [], currentLevel: 'context', selectedElement: null, selectedEdge: null,
      currentView: 'c4',
      boards: { ...get().boards, c4: { elements, relationships, drillPath: [] } },
    });
  },

  // —— 多视图切换 —— //
  snapshotBoards: () => {
    const s = get();
    return { ...s.boards, [s.currentView]: { elements: s.elements, relationships: s.relationships, drillPath: s.drillPath } };
  },
  switchView: (viewId) => {
    const s = get();
    if (viewId === s.currentView) return;
    const boards = s.snapshotBoards();
    const next = boards[viewId] || { elements: [], relationships: [], drillPath: [] };
    set({
      boards, currentView: viewId,
      elements: next.elements || [], relationships: next.relationships || [],
      drillPath: next.drillPath || [], currentLevel: LEVELS[(next.drillPath || []).length],
      selectedElement: null, selectedEdge: null,
    });
  },
  // 加载非 C4 视图（事件风暴/领域故事按 board 存放；限界上下文画布走独立的 bcCanvases）的内置示例
  loadBoardExample: (viewId, data) => {
    if (viewId === 'bounded-context') {
      const bcCanvases = data.bcCanvases || [];
      set({ bcCanvases, selectedBcId: bcCanvases[0]?.id || null, currentView: 'bounded-context' });
      return;
    }
    const elements = data.elements || [];
    const relationships = data.relationships || [];
    const boards = { ...get().snapshotBoards(), [viewId]: { elements, relationships, drillPath: [] } };
    set({
      boards, currentView: viewId,
      elements, relationships, drillPath: [], currentLevel: LEVELS[0],
      selectedElement: null, selectedEdge: null,
    });
  },

  getFullState: () => ({ metadata: get().metadata, currentView: get().currentView, boards: get().snapshotBoards(), bcCanvases: get().bcCanvases }),
  loadFullState: (data) => {
    const boards = data.boards || {};
    const cv = data.currentView || 'c4';
    const active = boards[cv] || { elements: [], relationships: [], drillPath: [] };
    const bcCanvases = data.bcCanvases || [];
    set({
      metadata: data.metadata || get().metadata,
      boards, currentView: cv,
      elements: active.elements || [], relationships: active.relationships || [],
      drillPath: active.drillPath || [], currentLevel: LEVELS[(active.drillPath || []).length],
      bcCanvases, selectedBcId: bcCanvases[0]?.id || null,
      selectedElement: null, selectedEdge: null,
    });
  },

  // —— 限界上下文画布 —— //
  addBcCanvas: () => {
    const c = {
      id: `bc-${Date.now()}`, name: '新限界上下文', purpose: '',
      domain: '', businessModel: '', evolution: '', roles: [],
      ubiquitousLanguage: '', businessDecisions: '', inbound: '', outbound: '',
      assumptions: '', verificationMetrics: '', openQuestions: '',
    };
    set((s) => ({ bcCanvases: [...s.bcCanvases, c], selectedBcId: c.id }));
    return c;
  },
  updateBcCanvas: (id, patch) => set((s) => ({ bcCanvases: s.bcCanvases.map((c) => (c.id === id ? { ...c, ...patch } : c)) })),
  deleteBcCanvas: (id) => set((s) => {
    const list = s.bcCanvases.filter((c) => c.id !== id);
    return { bcCanvases: list, selectedBcId: s.selectedBcId === id ? (list[0]?.id || null) : s.selectedBcId };
  }),
  setSelectedBc: (id) => set({ selectedBcId: id }),

  exportModel: () => {
    const state = get();
    const grouped = {};
    for (const t of ELEMENT_TYPES) grouped[t.storeKey] = [];
    for (const el of state.elements) {
      const key = storeKeyOf(el.type);
      (grouped[key] = grouped[key] || []).push(el);
    }
    return { metadata: state.metadata, ...grouped, relationships: state.relationships };
  },

  validateModel: () => {
    const state = get();
    const warnings = [];
    const elementIds = new Set(state.elements.map((el) => el.id));
    state.relationships.forEach((rel) => {
      if (!elementIds.has(rel.from)) warnings.push({ type: 'error', message: `关系源不存在：${rel.from}`, elementId: rel.id });
      if (!elementIds.has(rel.to)) warnings.push({ type: 'error', message: `关系目标不存在：${rel.to}`, elementId: rel.id });
    });
    set({ warnings });
    return warnings;
  },

  // 按下钻路径过滤当前层可见元素（非 C4 视图为平铺，显示全部）
  getVisibleElements: () => {
    const { elements, drillPath, currentView } = get();
    if (currentView !== 'c4') return elements;
    const depth = drillPath.length;
    if (depth === 0) {
      return elements.filter((el) => ['system', 'person', 'externalSystem'].includes(el.type));
    }
    const level = LEVELS[depth];              // container / component / code
    const parentField = PARENT_FIELD_BY_LEVEL[level];
    const focusId = drillPath[depth - 1];
    const children = elements.filter((el) => {
      const t = getType(el.type);
      return t && t.levels.includes(level) && el[parentField] === focusId;
    });
    if (depth === 1) {
      // 容器层附带展示边界参与者（用户/外部系统），以呈现跨边界关系
      const actors = elements.filter((el) => el.type === 'person' || el.type === 'externalSystem');
      return [...children, ...actors];
    }
    return children;
  },
}));

if (typeof window !== 'undefined') {
  window.__ZUSTAND_STORE__ = useStore;
}

export default useStore;
