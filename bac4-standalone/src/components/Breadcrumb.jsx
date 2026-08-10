import { ChevronRight, Home } from 'lucide-react';
import useStore from '../store';
import { LEVEL_LABELS } from '../config/elementTypes';

// 下钻面包屑：全部系统 > 系统 > 容器 > 组件 …，点击可返回上层
const Breadcrumb = () => {
  const drillPath = useStore((s) => s.drillPath);
  const elements = useStore((s) => s.elements);
  const currentLevel = useStore((s) => s.currentLevel);
  const currentView = useStore((s) => s.currentView);
  const drillTo = useStore((s) => s.drillTo);

  if (currentView !== 'c4') return null; // 下钻/面包屑仅用于 C4 架构视图

  const nameOf = (id) => elements.find((e) => e.id === id)?.name || id;

  const crumbs = [{ label: '全部系统', index: 0, home: true }];
  drillPath.forEach((id, i) => crumbs.push({ label: nameOf(id), index: i + 1 }));

  return (
    <nav className="flex items-center gap-1 text-sm">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-gray-400" />}
          <button
            onClick={() => drillTo(c.index)}
            className={`px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1 ${
              i === crumbs.length - 1 ? 'font-semibold text-gray-900' : 'text-gray-500'
            }`}
          >
            {c.home && <Home className="w-3.5 h-3.5" />}
            {c.label}
          </button>
        </span>
      ))}
      <span className="ml-2 text-xs text-gray-400">（{LEVEL_LABELS[currentLevel]}层）</span>
    </nav>
  );
};

export default Breadcrumb;
