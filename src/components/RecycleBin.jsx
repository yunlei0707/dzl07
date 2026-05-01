/**
 * 回收站组件
 * 显示已删除的动态记录，支持还原和永久删除
 */

import { useState, useEffect } from 'react';
import { X, RotateCcw, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { getDeletedMomentsByBaby, restoreMoment, deleteMomentPermanently, emptyRecycleBin } from '../utils/db';

export function RecycleBin({ onClose }) {
  const { currentBaby, showToast, setMoments } = useApp();
  const [deletedMoments, setDeletedMoments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // 加载回收站数据
  useEffect(() => {
    loadDeletedMoments();
  }, [currentBaby]);

  const loadDeletedMoments = async () => {
    if (!currentBaby?.id) return;
    
    setIsLoading(true);
    try {
      const moments = await getDeletedMomentsByBaby(currentBaby.id);
      setDeletedMoments(moments);
    } catch (error) {
      showToast('加载回收站失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 还原动态
  const handleRestore = async (momentId) => {
    setActionLoading(momentId);
    try {
      await restoreMoment(momentId);
      showToast('已还原到时光轴');
      await loadDeletedMoments();
      
      // 刷新时光轴
      const { getMomentsByBaby } = await import('../utils/db');
      const moments = await getMomentsByBaby(currentBaby.id);
      setMoments(moments);
    } catch (error) {
      showToast('还原失败', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // 永久删除
  const handlePermanentDelete = async (momentId) => {
    if (!confirm('确定要永久删除吗？此操作不可恢复！')) return;
    
    setActionLoading(momentId);
    try {
      await deleteMomentPermanently(momentId);
      showToast('已永久删除');
      await loadDeletedMoments();
    } catch (error) {
      showToast('删除失败', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // 清空回收站
  const handleEmptyBin = async () => {
    if (!confirm('确定要清空回收站吗？所有已删除的记录将被永久删除！')) return;
    
    try {
      await emptyRecycleBin(currentBaby.id);
      showToast('回收站已清空');
      await loadDeletedMoments();
    } catch (error) {
      showToast('清空失败', 'error');
    }
  };

  // 格式化日期
  const formatDeletedDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天删除';
    if (diffDays === 1) return '昨天删除';
    if (diffDays < 7) return `${diffDays}天前删除`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  // 格式化原始日期
  const formatOriginalDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div 
        className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-cream-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-gray-500" />
            <h2 className="font-bold text-lg text-gray-800 dark:text-white">回收站</h2>
            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-xs rounded-full">
              {deletedMoments.length}条
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 提示 */}
        <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              删除的记录会在30天后自动清除，可随时还原
            </p>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : deletedMoments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Trash2 className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-center">回收站是空的</p>
            </div>
          ) : (
            <div className="divide-y divide-cream-100 dark:divide-gray-700">
              {deletedMoments.map(moment => (
                <div key={moment.id} className="p-4">
                  {/* 内容预览 */}
                  <div className="flex gap-3">
                    {/* 缩略图 */}
                    {(moment.photos?.[0] || moment.videos?.[0]?.cover) && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img 
                          src={moment.photos?.[0] || moment.videos?.[0]?.cover} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    
                    {/* 文字内容 */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {moment.content || '(无文字内容)'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatOriginalDate(moment.date)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 删除时间和操作 */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatDeletedDate(moment.deletedAt)}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(moment.id)}
                        disabled={actionLoading === moment.id}
                        className="px-3 py-1.5 text-xs text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full flex items-center gap-1 disabled:opacity-50"
                      >
                        {actionLoading === moment.id ? (
                          <div className="w-3 h-3 border border-primary-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <RotateCcw className="w-3 h-3" />
                        )}
                        还原
                      </button>
                      <button
                        onClick={() => handlePermanentDelete(moment.id)}
                        disabled={actionLoading === moment.id}
                        className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full flex items-center gap-1 disabled:opacity-50"
                      >
                        <Trash2 className="w-3 h-3" />
                        永久删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        {deletedMoments.length > 0 && (
          <div className="p-4 border-t border-cream-100 dark:border-gray-700">
            <button
              onClick={handleEmptyBin}
              className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              清空回收站
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
