/**
 * AI 创作提示弹窗组件 v2.4.0
 * 
 * 功能：保存记录后，提示用户点击"宝宝内容创作"直接打开AI聊天窗口
 * 与SDK悬浮按钮合二为一
 */

import { useEffect } from 'react';
import { Sparkles, MessageCircle, X } from 'lucide-react';

export function AIChoiceModal({ show, onCancel }) {
  useEffect(() => {
    console.log('[AIChoiceModal v2.4.0] 状态变化:', { show });
    console.log('[AIChoiceModal] window.cozeChat:', window.cozeChat);
  }, [show]);

  // 点击打开聊天窗口
  const handleOpenChat = () => {
    console.log('[AIChoiceModal] 点击"宝宝内容创作"');
    onCancel();
    
    // 方案1: 直接调用 SDK 的 open 方法
    if (window.cozeChat && typeof window.cozeChat.open === 'function') {
      try {
        window.cozeChat.open();
        console.log('[AIChoiceModal] ✅ window.cozeChat.open() 调用成功');
        return;
      } catch (e) {
        console.error('[AIChoiceModal] ❌ window.cozeChat.open() 失败:', e);
      }
    }
    
    // 方案2: 查找并点击 SDK 渲染的按钮（备用）
    setTimeout(() => {
      const selectors = [
        'button[class*="coze"]',
        'button[class*="Coze"]', 
        'div[class*="coze"] button',
        'div[class*="Coze"] button',
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          try {
            elements[0].click();
            console.log('[AIChoiceModal] 点击 SDK 按钮成功');
            return;
          } catch (e) {
            console.error('[AIChoiceModal] 点击失败:', e);
          }
        }
      }
    }, 100);
  };

  if (!show) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center"
      style={{ 
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onCancel}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-[85%] max-w-xs overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 py-3 flex items-center justify-between bg-gradient-to-r from-primary-50 to-orange-50 dark:from-gray-700 dark:to-gray-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium text-gray-800 dark:text-gray-200 text-sm">AI 智能创作</span>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
            记录已保存！
            <br />
            点击下方按钮开始 AI 创作
          </p>

          <button
            onClick={handleOpenChat}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-primary-600 hover:to-primary-700 transition-all shadow-lg"
          >
            <MessageCircle className="w-5 h-5" />
            宝宝内容创作
          </button>
        </div>
      </div>
    </div>
  );
}

export default AIChoiceModal;
