/**
 * AI 创作提示弹窗组件 v2.5.0
 * 
 * 方案：弹窗里不显示我们自己的按钮，而是把SDK自带按钮放大移动到弹窗位置
 * 用户直接点击SDK按钮，100%有效
 */

import { useEffect } from 'react';
import { Sparkles, X } from 'lucide-react';

export function AIChoiceModal({ show, onCancel }) {
  // 弹窗显示时，把SDK按钮放大移动到弹窗位置
  useEffect(() => {
    if (show) {
      console.log('[AIChoiceModal v2.5.0] 弹窗显示，放大SDK按钮');
      
      // 给 body 加一个 class，CSS会定位SDK按钮
      document.body.classList.add('ai-modal-shown');
      
      // 尝试查找并放大SDK按钮
      setTimeout(() => {
        const selectors = [
          '[class*="coze-chat-float-btn"]',
          '[class*="float-btn"]',
          '[class*="asst-btn"]',
        ];
        
        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            el.classList.add('sdk-btn-enlarged');
          });
        }
      }, 100);
    } else {
      // 弹窗关闭时恢复
      document.body.classList.remove('ai-modal-shown');
      document.querySelectorAll('.sdk-btn-enlarged').forEach(el => {
        el.classList.remove('sdk-btn-enlarged');
      });
    }
    
    return () => {
      document.body.classList.remove('ai-modal-shown');
      document.querySelectorAll('.sdk-btn-enlarged').forEach(el => {
        el.classList.remove('sdk-btn-enlarged');
      });
    };
  }, [show]);

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
          
          {/* 这里不渲染我们自己的按钮，SDK按钮会被CSS移到这个位置 */}
          <div className="w-full h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl opacity-30 flex items-center justify-center text-white text-sm font-medium">
            宝宝内容创作
          </div>
          <p className="text-xs text-gray-400 mt-2">点击右下角悬浮按钮打开聊天</p>
        </div>
      </div>
    </div>
  );
}

export default AIChoiceModal;
