// 多视图工作台：三大阶段（业务分析 / 战略设计 / 架构设计），每阶段下展开子视图。
export const VIEWS = {
  'event-storming': { label: '事件风暴', kind: 'flat' },
  'domain-story': { label: '领域故事', kind: 'flat' },
  'bounded-context': { label: '限界上下文画布', kind: 'form' },
  c4: { label: 'C4 架构设计', kind: 'c4' },
};

export const PHASES = [
  { id: 'business', label: '业务分析', views: ['event-storming', 'domain-story'] },
  { id: 'strategic', label: '战略设计', views: ['bounded-context'] },
  { id: 'architecture', label: '架构设计', views: ['c4'] },
];

export const viewLabel = (id) => VIEWS[id]?.label || id;
