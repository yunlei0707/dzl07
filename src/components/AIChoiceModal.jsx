/**
 * AI 创作选择弹窗组件
 */

import { useState, useEffect } from 'react';
import { Sparkles, MessageCircle, X } from 'lucide-react';

export function AIChoiceModal({ show, content, onConfirm, onCancel }) {
  // 调试日志
  useEffect(() => {
    console.log('[AIChoiceModal] 状态变化:', { show, hasContent: !!content, contentLength: content?.length || 0 });
  }, [show, content]);

  // 如果不显示，返回 null
  if (!show) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-[90%] max-w-sm mx-4 overflow-hidden"
        onClick={e => e.stopPropagation()}
        style={{ zIndex: 1000000 }}
      >
        {/* 顶部装饰 */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-4 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-white font-bold text-lg">✨ AI 智能创作 ✨</h3>
          <p className="text-white/80 text-sm mt-1">检测到记录内容，尝试 AI 创作</p>
        </div>

        {/* 内容预览 */}
        <div className="p-4">
          {content && content.trim() ? (
            <div className="bg-cream-50 dark:bg-gray-700 rounded-xl p-3 mb-4 max-h-32 overflow-y-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                {content.length > 150 ? content.slice(0, 150) + '...' : content}
              </p>
            </div>
          ) : (
            <div className="bg-cream-50 dark:bg-gray-700 rounded-xl p-3 mb-4 text-center">
              <p className="text-sm text-gray-500">记录已保存，将基于记录内容生成创作</p>
            </div>
          )}

          {/* 按钮组 */}
          <div className="space-y-3">
            <button
              onClick={onConfirm}
              className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
            >
              <MessageCircle className="w-5 h-5" />
              好的，帮我创作
            </button>
            <button
              onClick={onCancel}
              className="w-full py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              不用了，谢谢
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AIChoiceModal;
