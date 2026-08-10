// 后端 API 客户端。后端未启动时调用会抛错，由调用方优雅降级。
const BASE = import.meta.env?.VITE_API_BASE || 'http://localhost:8000';
export const API_BASE = BASE;

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

export const listProjects = () => req('/api/projects');
export const getProject = (id) => req(`/api/projects/${id}`);
export const createProject = (name, model) => req('/api/projects', { method: 'POST', body: JSON.stringify({ name, model }) });
export const updateProject = (id, name, model) => req(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify({ name, model }) });
export const deleteProject = (id) => req(`/api/projects/${id}`, { method: 'DELETE' });
