import { ChevronRight } from 'lucide-react';
import useStore from '../store';
import { PHASES, VIEWS } from '../config/views';

// 阶段标题为弱化小灰字（不可点）；子视图为描边胶囊按钮（未选中也有边框，选中蓝色填充）。
const WorkspaceNav = () => {
  const currentView = useStore((s) => s.currentView);
  const switchView = useStore((s) => s.switchView);

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 border-b border-gray-200 overflow-x-auto">
      {PHASES.map((phase, i) => (
        <div key={phase.id} className="flex items-center gap-2 shrink-0">
          {i > 0 && <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />}
          <span className="text-[11px] font-semibold text-gray-400 tracking-wider select-none uppercase">
            {phase.label}
          </span>
          {phase.views.map((v) => {
            const active = currentView === v;
            return (
              <button
                key={v}
                onClick={() => switchView(v)}
                className={`px-3 py-1 rounded-full text-xs border shadow-sm transition-colors ${
                  active
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
              >
                {VIEWS[v].label}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default WorkspaceNav;
