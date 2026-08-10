import { useEffect } from 'react';
import useStore from '../store';

const LOCAL_STORAGE_KEY = 'ddd-tool-autosave';
const AUTOSAVE_INTERVAL = 30000; // 30s

// 是否有任何视图存在元素
const hasAny = (data) =>
  Object.values(data?.boards || {}).some((b) => (b?.elements || []).length > 0) ||
  (data?.bcCanvases || []).length > 0;

/**
 * 自动保存 / 恢复整个工作台（所有视图）到 localStorage。
 */
export const useLocalStorage = () => {
  const getFullState = useStore((s) => s.getFullState);
  const loadFullState = useStore((s) => s.loadFullState);

  // 挂载时尝试恢复
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      if (hasAny(data) && window.confirm('发现上次自动保存的内容，是否恢复？')) {
        loadFullState(data);
      }
    } catch (e) {
      console.error('恢复自动保存失败:', e);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [loadFullState]);

  // 周期保存 + 关闭页面时保存
  useEffect(() => {
    const save = () => {
      const data = getFullState();
      if (!hasAny(data)) return;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error('保存失败:', e);
      }
    };
    const interval = setInterval(save, AUTOSAVE_INTERVAL);
    window.addEventListener('beforeunload', save);
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', save);
    };
  }, [getFullState]);
};

export const clearLocalStorage = () => localStorage.removeItem(LOCAL_STORAGE_KEY);
