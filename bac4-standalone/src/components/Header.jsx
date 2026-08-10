import { useState } from 'react';
import { Download, Upload, FileJson, FileImage, FileCode, FileText, Layout, BookOpen, FolderOpen, Trash2 } from 'lucide-react';
import useStore from '../store';
import { exportAsPNG, exportAsSVG, generatePlantUML, generateMermaid, generateMarkdown, exportAsHTML, exportAsDrawio } from '../utils/exportUtils';
import { applyHierarchicalLayout, applyGridLayout, applyCircularLayout, applyForceLayout } from '../utils/layoutUtils';
import { exportToStructurizr, importFromStructurizr } from '../utils/structurizrUtils';
import Breadcrumb from './Breadcrumb';
import { EXAMPLES } from '../examples';
import { listProjects, getProject, createProject, updateProject, deleteProject } from '../utils/api';

const Header = () => {
  const { metadata, setMetadata, exportModel, importModel, clearAll, getAllElements, updateElement, relationships, drillInto, loadFullState } = useStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showExampleMenu, setShowExampleMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [projects, setProjects] = useState([]);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(metadata.name);

  // 导入模型后，自动下钻到第一个系统，直接看到其容器（微服务）视图
  const focusFirstSystem = () => {
    const sys = getAllElements().find((e) => e.type === 'system');
    if (sys) drillInto(sys.id);
  };

  const downloadText = (content, filename, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const baseName = (model) => (model.metadata?.name || 'c4-model').replace(/\s+/g, '-').toLowerCase();

  const handleExportJSON = () => {
    const model = exportModel();
    downloadText(JSON.stringify(model, null, 2), `${baseName(model)}.json`, 'application/json');
    setShowExportMenu(false);
  };

  const handleImportJSON = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.model && (data.views || data.documentation)) {
          importModel(importFromStructurizr(data));
          alert('已成功导入 Structurizr 工作区！');
        } else {
          importModel(data);
          alert('模型导入成功！');
        }
      } catch (error) {
        alert('导入失败：' + error.message);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleExportStructurizr = () => {
    const model = exportModel();
    downloadText(JSON.stringify(exportToStructurizr(model), null, 2), `${baseName(model)}-structurizr.json`, 'application/json');
    setShowExportMenu(false);
  };

  const handleExportPlantUML = () => {
    const model = exportModel();
    downloadText(generatePlantUML(model), `${baseName(model)}.puml`);
    setShowExportMenu(false);
  };

  const handleExportMermaid = () => {
    const model = exportModel();
    downloadText(generateMermaid(model), `${baseName(model)}.mmd`);
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    const model = exportModel();
    downloadText(generateMarkdown(model), `${baseName(model)}.md`, 'text/markdown');
    setShowExportMenu(false);
  };

  const handleExportHTML = () => { exportAsHTML(exportModel()); setShowExportMenu(false); };
  const handleExportPNG = async () => { await exportAsPNG(exportModel()); setShowExportMenu(false); };
  const handleExportSVG = async () => { await exportAsSVG(exportModel()); setShowExportMenu(false); };
  const handleExportDrawio = () => { exportAsDrawio(exportModel()); setShowExportMenu(false); };

  const handleClearAll = () => {
    if (window.confirm('确定清空所有元素吗？此操作不可撤销。')) {
      clearAll();
      setCurrentProjectId(null);
    }
  };

  // —— 示例 —— //
  const loadExample = (ex) => {
    if (getAllElements().length > 0 && !window.confirm('加载示例会替换当前画布内容，确定继续吗？')) return;
    importModel(ex.model);
    focusFirstSystem();
    setCurrentProjectId(null);
    setShowExampleMenu(false);
  };

  // —— 项目（后端） —— //
  const openProjectMenu = async () => {
    const next = !showProjectMenu;
    setShowProjectMenu(next);
    if (next) {
      try {
        setProjects(await listProjects());
      } catch {
        setProjects([]);
        alert('无法连接后端服务（http://localhost:8000）。\n请先启动后端，或继续使用本地/示例功能。');
        setShowProjectMenu(false);
      }
    }
  };

  const handleSaveAsNew = async () => {
    const name = window.prompt('输入项目名称：', metadata.name || '未命名项目');
    if (!name) return;
    try {
      const proj = await createProject(name, exportModel());
      setCurrentProjectId(proj.id);
      setMetadata({ ...metadata, name });
      alert(`已保存为项目「${name}」`);
    } catch {
      alert('保存失败：后端不可用。');
    }
    setShowProjectMenu(false);
  };

  const handleOverwrite = async () => {
    if (!currentProjectId) return;
    try {
      await updateProject(currentProjectId, metadata.name, exportModel());
      alert('已保存到当前项目。');
    } catch {
      alert('保存失败：后端不可用。');
    }
    setShowProjectMenu(false);
  };

  const handleNew = () => {
    if (!window.confirm('新建将清空当前工作台的所有视图内容，确定吗？')) return;
    loadFullState({ metadata: { name: '未命名', version: '1.0', author: '' }, currentView: 'c4', boards: {} });
    setCurrentProjectId(null);
    setShowProjectMenu(false);
  };

  const handleDeleteProject = async (id, name) => {
    if (!window.confirm(`确定删除项目「${name}」？此操作不可撤销。`)) return;
    try {
      await deleteProject(id);
      setProjects(await listProjects());
      if (currentProjectId === id) setCurrentProjectId(null);
    } catch {
      alert('删除失败：后端不可用。');
    }
  };

  const handleOpenProject = async (id) => {
    try {
      const proj = await getProject(id);
      importModel(proj.model);
      setCurrentProjectId(proj.id);
      setMetadata({ ...(proj.model.metadata || metadata), name: proj.name });
      focusFirstSystem();
    } catch {
      alert('打开失败：后端不可用。');
    }
    setShowProjectMenu(false);
  };

  const handleTitleSave = () => {
    const t = editedTitle.trim();
    if (t) setMetadata({ ...metadata, name: t });
    else setEditedTitle(metadata.name);
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') handleTitleSave();
    else if (e.key === 'Escape') { setEditedTitle(metadata.name); setIsEditingTitle(false); }
  };

  const applyLayout = (layoutFn) => {
    const layouted = layoutFn(getAllElements(), relationships);
    layouted.forEach((el) => updateElement(el.type, el.id, { position: el.position }));
    setShowLayoutMenu(false);
  };

  const menuBtn = 'w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2';

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-900">微服务拆分设计工具</h1>
          <span className="text-gray-400">|</span>
          {isEditingTitle ? (
            <input type="text" value={editedTitle} autoFocus
              onChange={(e) => setEditedTitle(e.target.value)} onBlur={handleTitleSave} onKeyDown={handleTitleKeyDown}
              className="text-sm text-gray-900 font-medium px-2 py-1 border border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]" />
          ) : (
            <div onDoubleClick={() => { setEditedTitle(metadata.name); setIsEditingTitle(true); }}
              className="text-sm text-gray-600 cursor-pointer hover:text-gray-900 hover:bg-gray-100 px-2 py-1 rounded transition-colors"
              title="双击可编辑标题">
              {metadata.name}
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* 下钻面包屑 */}
          <Breadcrumb />

          <div className="flex items-center gap-2">
            {/* 示例 */}
            <div className="relative">
              <button onClick={() => setShowExampleMenu(!showExampleMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 text-white rounded-md hover:bg-amber-600 text-sm transition-colors" title="加载示例">
                <BookOpen className="w-4 h-4" /> 示例
              </button>
              {showExampleMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    {EXAMPLES.map((ex) => (
                      <button key={ex.id} onClick={() => loadExample(ex)} className="w-full text-left px-4 py-2 hover:bg-gray-100">
                        <div className="text-sm font-medium text-gray-800">{ex.name}</div>
                        <div className="text-xs text-gray-500">{ex.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 项目（后端） */}
            <div className="relative">
              <button onClick={openProjectMenu}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-600 text-white rounded-md hover:bg-slate-700 text-sm transition-colors" title="项目（需后端）">
                <FolderOpen className="w-4 h-4" /> 项目
              </button>
              {showProjectMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button onClick={handleNew} className={menuBtn}>🆕 新建（清空工作台）</button>
                    <button onClick={handleSaveAsNew} className={menuBtn}>💾 保存为新项目</button>
                    {currentProjectId && <button onClick={handleOverwrite} className={menuBtn}>♻️ 覆盖保存当前项目</button>}
                    <hr className="my-1" />
                    <div className="px-4 py-1 text-xs text-gray-400">打开项目</div>
                    {projects.length === 0 && <div className="px-4 py-2 text-xs text-gray-400">暂无项目</div>}
                    {projects.map((p) => (
                      <div key={p.id} className="flex items-center">
                        <button onClick={() => handleOpenProject(p.id)} className={`${menuBtn} flex-1`}>
                          <FolderOpen className="w-4 h-4" /> {p.name}
                        </button>
                        <button onClick={() => handleDeleteProject(p.id, p.name)} title="删除项目"
                          className="px-2 py-2 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 导出 */}
            <div className="relative">
              <button onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm transition-colors" title="导出模型">
                <Download className="w-4 h-4" /> 导出
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button onClick={handleExportJSON} className={menuBtn}><FileJson className="w-4 h-4" /> JSON（BAC4）</button>
                    <button onClick={handleExportStructurizr} className={menuBtn}><FileJson className="w-4 h-4" /> Structurizr JSON</button>
                    <hr className="my-1" />
                    <button onClick={handleExportPlantUML} className={menuBtn}><FileCode className="w-4 h-4" /> PlantUML</button>
                    <button onClick={handleExportMermaid} className={menuBtn}><FileCode className="w-4 h-4" /> Mermaid</button>
                    <button onClick={handleExportMarkdown} className={menuBtn}><FileText className="w-4 h-4" /> Markdown</button>
                    <button onClick={handleExportHTML} className={menuBtn}><FileText className="w-4 h-4" /> HTML 文档</button>
                    <hr className="my-1" />
                    <button onClick={handleExportPNG} className={menuBtn}><FileImage className="w-4 h-4" /> PNG 图片</button>
                    <button onClick={handleExportSVG} className={menuBtn}><FileImage className="w-4 h-4" /> SVG 图片</button>
                    <hr className="my-1" />
                    <button onClick={handleExportDrawio} className={menuBtn}><FileCode className="w-4 h-4" /> Draw.io（.drawio）</button>
                  </div>
                </div>
              )}
            </div>

            {/* 导入 */}
            <label className="flex items-center gap-2 px-3 py-1.5 bg-green-700 text-white rounded-md hover:bg-green-800 text-sm cursor-pointer transition-colors">
              <Upload className="w-4 h-4" /> 导入
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>

            {/* 布局 */}
            <div className="relative">
              <button onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm transition-colors" title="自动布局">
                <Layout className="w-4 h-4" /> 布局
              </button>
              {showLayoutMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button onClick={() => applyLayout(applyHierarchicalLayout)} className={menuBtn}>分层布局</button>
                    <button onClick={() => applyLayout(applyGridLayout)} className={menuBtn}>网格布局</button>
                    <button onClick={() => applyLayout(applyCircularLayout)} className={menuBtn}>环形布局</button>
                    <button onClick={() => applyLayout(applyForceLayout)} className={menuBtn}>力导向布局</button>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleClearAll}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm transition-colors" title="清空画布">
              清空
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
