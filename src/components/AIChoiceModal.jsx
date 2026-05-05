/**
 * AI 创作提示弹窗组件 v2.2.0
 * 
 * 功能：保存记录后，轻量提示用户可以点击右下角 AI 助手进行创作
 * 不再强制跳转，只做友好提示
 */

import { useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

export function AIChoiceModal({ show, onCancel }) {
  // 调试日志
  useEffect(() => {
    console.log('[AIChoiceModal v2.2.0] 状态变化:', { show });
  }, [show]);

  // 如果不显示，返回 null
  if (!show) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center pointer-events-none"
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[85%] max-w-xs overflow-hidden pointer-events-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部：图标 + 标题 */}
        <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary-50 to-orange-50 dark:from-gray-700 dark:to-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">AI 助手提示</span>
          </div>
          <button 
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 提示内容 */}
        <div className="px-4 py-3 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            记录已保存！
            <br />
            点击右下角 <span className="text-primary-500 font-medium">AI 助手</span>
            <br />
            可以为您生成虚拟时光创作
          </p>
        </div>

        {/* 底部按钮 */}
        <div className="px-4 pb-4">
          <button
            onClick={onCancel}
            className="w-full py-2 bg-primary-500 text-white rounded-lg font-medium text-sm hover:bg-primary-600 transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIChoiceModal;
