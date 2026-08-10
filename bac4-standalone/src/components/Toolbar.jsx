import useStore from '../store';
import { typesForView, LEVEL_LABELS, CATEGORY_LABELS, CONTAINER_HINT } from '../config/elementTypes';
import { VIEWS } from '../config/views';

const Toolbar = () => {
  const currentLevel = useStore((s) => s.currentLevel);
  const currentView = useStore((s) => s.currentView);

  // 由注册表按当前视图/层级筛选可添加的元素
  const visibleTools = typesForView(currentView, currentLevel);

  const onDragStart = (event, type) => {
    event.dataTransfer.setData('application/c4-element-type', type);
    event.dataTransfer.effectAllowed = 'move';
  };

  const headerLabel = currentView === 'c4'
    ? `当前层级：${LEVEL_LABELS[currentLevel] || currentLevel}`
    : `当前视图：${VIEWS[currentView]?.label || currentView}`;

  // 按分类分组展示，动态渲染所有分类
  const CATEGORY_ORDER = ['c4', 'infrastructure', 'model', 'es', 'ds', 'dsw', 'ctx'];
  const groups = CATEGORY_ORDER
    .map((cat) => ({ cat, tools: visibleTools.filter((t) => t.category === cat) }))
    .filter((g) => g.tools.length > 0);

  const renderTool = (tool) => {
    const Icon = tool.icon;
    return (
      <div
        key={tool.type}
        draggable
        onDragStart={(e) => onDragStart(e, tool.type)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 transition-colors cursor-grab active:cursor-grabbing ${tool.tool}`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{tool.label}</span>
      </div>
    );
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-700 tracking-wide mb-1">
        添加元素
      </h2>
      <p className="text-xs text-gray-500 mb-2">{headerLabel}</p>

      {currentView === 'c4' && currentLevel === 'container' && (
        <div className="mb-4 p-2 bg-teal-50 border border-teal-200 rounded text-xs text-teal-800 leading-relaxed">
          💡 {CONTAINER_HINT}
        </div>
      )}

      {visibleTools.length === 0 && (
        <div className="text-sm text-gray-500 text-center py-4">
          当前层级没有可添加的元素
        </div>
      )}

      {groups.map((g, i) => (
        <div key={g.cat}>
          <h3 className={`text-xs font-semibold text-gray-500 tracking-wide mb-2 ${i > 0 ? 'mt-6' : ''}`}>
            {CATEGORY_LABELS[g.cat] || g.cat}
          </h3>
          <div className="space-y-2">{g.tools.map(renderTool)}</div>
        </div>
      ))}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-xs font-semibold text-blue-900 mb-2">操作提示</h3>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• 拖拽元素到画布即可添加</li>
          <li>• 单击元素编辑属性；<b>双击可下钻</b>进入其内部</li>
          <li>• 从元素连接点拖到另一个元素建立关系</li>
          <li>• 用顶部面包屑返回上层</li>
        </ul>
      </div>
    </aside>
  );
};

export default Toolbar;
