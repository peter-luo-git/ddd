import useStore from '../store';
import { Plus, Trash2 } from 'lucide-react';

// 标准 Bounded Context Canvas v5（ddd-crew）：结构化表单，支持多个限界上下文。
const DOMAIN = ['核心域 Core', '支撑域 Supporting', '通用域 Generic', '其它 Other'];
const BUSINESS_MODEL = ['营收 Revenue', '互动 Engagement', '合规 Compliance', '降本 Cost Reduction'];
const EVOLUTION = ['探索 Genesis', '定制 Custom Built', '产品 Product', '商品化 Commodity'];
const ROLE_TYPES = ['规格模型 Specification', '执行模型 Execution', '分析模型 Analysis', '审批者 Approver'];

const secTitle = 'text-xs font-bold text-indigo-700 mb-1';
const ta = 'w-full text-sm border border-gray-200 rounded p-2 resize-none focus:outline-none focus:ring-1 focus:ring-blue-400';

const RadioList = ({ options, value, onChange }) => (
  <div className="flex flex-col gap-0.5">
    {options.map((o) => (
      <button key={o} type="button" onClick={() => onChange(value === o ? '' : o)}
        className={`text-left text-xs px-2 py-0.5 rounded ${value === o ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
        {value === o ? '●' : '○'} {o}
      </button>
    ))}
  </div>
);

const CheckList = ({ options, values, onChange }) => (
  <div className="flex flex-col gap-0.5">
    {options.map((o) => {
      const on = values.includes(o);
      return (
        <button key={o} type="button" onClick={() => onChange(on ? values.filter((x) => x !== o) : [...values, o])}
          className={`text-left text-xs px-2 py-0.5 rounded ${on ? 'bg-indigo-600 text-white' : 'text-gray-700 hover:bg-gray-100'}`}>
          {on ? '☑' : '☐'} {o}
        </button>
      );
    })}
  </div>
);

const Cell = ({ title, hint, children, className = '' }) => (
  <div className={`border border-gray-300 p-3 ${className}`}>
    <div className={secTitle}>{title}</div>
    {hint && <div className="text-[11px] text-gray-400 mb-2">{hint}</div>}
    {children}
  </div>
);

const BoundedContextCanvasView = () => {
  const bcCanvases = useStore((s) => s.bcCanvases);
  const selectedBcId = useStore((s) => s.selectedBcId);
  const addBcCanvas = useStore((s) => s.addBcCanvas);
  const updateBcCanvas = useStore((s) => s.updateBcCanvas);
  const deleteBcCanvas = useStore((s) => s.deleteBcCanvas);
  const setSelectedBc = useStore((s) => s.setSelectedBc);

  const bc = bcCanvases.find((c) => c.id === selectedBcId) || bcCanvases[0] || null;
  const set = (patch) => bc && updateBcCanvas(bc.id, patch);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 overflow-x-auto">
        {bcCanvases.map((c) => (
          <button key={c.id} onClick={() => setSelectedBc(c.id)}
            className={`px-3 py-1 rounded-full text-xs border shrink-0 ${c.id === bc?.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-indigo-400'}`}>
            {c.name || '未命名'}
          </button>
        ))}
        <button onClick={addBcCanvas} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs border border-dashed border-gray-400 text-gray-600 hover:border-indigo-400 hover:text-indigo-600 shrink-0">
          <Plus className="w-3.5 h-3.5" /> 新建限界上下文
        </button>
        {bc && (
          <button onClick={() => { if (window.confirm('删除该限界上下文画布？')) deleteBcCanvas(bc.id); }}
            className="ml-auto flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-red-500 shrink-0">
            <Trash2 className="w-3.5 h-3.5" /> 删除
          </button>
        )}
      </div>

      {!bc ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
          <p className="text-sm">还没有限界上下文画布</p>
          <button onClick={addBcCanvas} className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> 新建限界上下文画布
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-auto p-4">
          <div className="max-w-6xl mx-auto mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-gray-700 leading-relaxed">
            <div className="font-semibold text-indigo-800 mb-1">什么是限界上下文（Bounded Context）？为什么要定义它？</div>
            <ul className="list-disc pl-5 space-y-1">
              <li><b>定义</b>：DDD 战略设计的核心——一个明确的<b>业务边界</b>，边界内有一套自洽的领域模型和统一语言（同一术语在不同上下文含义可不同，如“账户”在支付与风控里不一样）。</li>
              <li><b>与系统 / 微服务的关系</b>：一个限界上下文通常对应<b>一个微服务</b>（或一小组），是划分微服务边界的<b>业务依据</b>。理想状态：一个上下文 = 一个微服务，独享自己的领域模型与数据库。</li>
              <li><b>为什么要定义</b>：先按业务把边界划清楚（高内聚、低耦合），再落到微服务架构，能避免边界划错导致的服务耦合、共享数据库、大泥球等问题。</li>
              <li><b>下游</b>：这里定义好的限界上下文，正是右侧「架构设计（C4）」里做微服务拆分的输入依据。</li>
            </ul>
          </div>
          <div className="max-w-6xl mx-auto border-2 border-gray-800">
            <div className="border-b-2 border-gray-800 p-3 flex items-center gap-2">
              <span className="text-sm font-bold text-gray-800">名称 Name：</span>
              <input value={bc.name} onChange={(e) => set({ name: e.target.value })}
                className="flex-1 text-sm border-b border-gray-300 focus:outline-none focus:border-blue-400" placeholder="限界上下文名称" />
              <span className="text-xs text-gray-400">v5 · ddd-crew/bounded-context-canvas</span>
            </div>

            <div className="grid grid-cols-3 border-b-2 border-gray-800">
              <Cell title="用途 Purpose" hint="这个上下文提供什么业务价值？从业务角度描述">
                <textarea rows={6} value={bc.purpose} onChange={(e) => set({ purpose: e.target.value })} className={ta} />
              </Cell>
              <Cell title="战略分类 Strategic Classification">
                <div className="grid grid-cols-3 gap-2">
                  <div><div className="text-[11px] font-semibold text-gray-500 mb-1">Domain</div><RadioList options={DOMAIN} value={bc.domain} onChange={(v) => set({ domain: v })} /></div>
                  <div><div className="text-[11px] font-semibold text-gray-500 mb-1">Business Model</div><RadioList options={BUSINESS_MODEL} value={bc.businessModel} onChange={(v) => set({ businessModel: v })} /></div>
                  <div><div className="text-[11px] font-semibold text-gray-500 mb-1">Evolution</div><RadioList options={EVOLUTION} value={bc.evolution} onChange={(v) => set({ evolution: v })} /></div>
                </div>
              </Cell>
              <Cell title="领域角色 Domain Roles" hint="Role Types">
                <CheckList options={ROLE_TYPES} values={bc.roles} onChange={(v) => set({ roles: v })} />
              </Cell>
            </div>

            <div className="grid grid-cols-3 border-b-2 border-gray-800">
              <Cell title="入站通信 Inbound Communication" hint="上游协作者 / 接收的消息（每行一个）">
                <textarea rows={8} value={bc.inbound} onChange={(e) => set({ inbound: e.target.value })} className={ta} />
              </Cell>
              <div className="border-x border-gray-300 flex flex-col">
                <Cell title="统一语言 Ubiquitous Language" hint="上下文特定术语（每行一个）" className="border-0 border-b border-gray-300">
                  <textarea rows={4} value={bc.ubiquitousLanguage} onChange={(e) => set({ ubiquitousLanguage: e.target.value })} className={ta} />
                </Cell>
                <Cell title="业务决策 Business Decisions" hint="关键业务规则/策略（每行一个）" className="border-0">
                  <textarea rows={4} value={bc.businessDecisions} onChange={(e) => set({ businessDecisions: e.target.value })} className={ta} />
                </Cell>
              </div>
              <Cell title="出站通信 Outbound Communication" hint="下游协作者 / 发出的消息（每行一个）">
                <textarea rows={8} value={bc.outbound} onChange={(e) => set({ outbound: e.target.value })} className={ta} />
              </Cell>
            </div>

            <div className="grid grid-cols-3">
              <Cell title="假设 Assumptions" hint="设计时未验证的假设">
                <textarea rows={4} value={bc.assumptions} onChange={(e) => set({ assumptions: e.target.value })} className={ta} />
              </Cell>
              <Cell title="验证指标 Verification Metrics" hint="用于验证边界是否合理的指标">
                <textarea rows={4} value={bc.verificationMetrics} onChange={(e) => set({ verificationMetrics: e.target.value })} className={ta} />
              </Cell>
              <Cell title="开放问题 Open Questions">
                <textarea rows={4} value={bc.openQuestions} onChange={(e) => set({ openQuestions: e.target.value })} className={ta} />
              </Cell>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoundedContextCanvasView;
