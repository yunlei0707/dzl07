/**
 * 悬浮 AI 助手按钮组件
 * 
 * 功能：
 * 1. 悬浮在页面右下角的按钮
 * 2. 点击打开扣子聊天窗口
 */

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

export function FloatingButton() {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState(null);

  // 初始化扣子 SDK
  useEffect(() => {
    console.log('[FloatingButton] 开始初始化...');

    // 检查 SDK 是否已加载
    const checkSDK = () => {
      console.log('[FloatingButton] 检查 SDK:', {
        hasCozeWebSDK: typeof window.CozeWebSDK !== 'undefined',
        hasCozeChat: typeof window.cozeChat !== 'undefined',
        hasCozeChatOpen: typeof window.cozeChat?.open === 'function'
      });
      
      if (window.CozeWebSDK && !window.cozeChat) {
        try {
          console.log('[FloatingButton] 初始化 Coze SDK...');
          window.cozeChat = new window.CozeWebSDK.WebChatClient({
            config: {
              bot_id: '7636350042466418731',
            },
            componentProps: {
              title: '虚拟时光助手',
            },
          });
          console.log('[FloatingButton] ✅ CozeWebSDK 初始化成功');
          setIsReady(true);
          setError(null);
        } catch (e) {
          console.error('[FloatingButton] ❌ SDK 初始化失败:', e);
          setError(e.message);
        }
      } else if (window.cozeChat) {
        console.log('[FloatingButton] ✅ cozeChat 已存在');
        setIsReady(true);
        setError(null);
      }
    };

    // 延迟检查，确保 SDK 脚本已执行
    const timer = setTimeout(checkSDK, 500);
    
    // 如果 SDK 已经加载，立即检查
    if (window.CozeWebSDK || window.cozeChat) {
      clearTimeout(timer);
      checkSDK();
    }

    return () => clearTimeout(timer);
  }, []);

  // 点击打开聊天窗口
  const handleClick = () => {
    console.log('[FloatingButton] 点击按钮', {
      hasCozeWebSDK: !!window.CozeWebSDK,
      hasCozeChat: !!window.cozeChat,
      hasOpen: typeof window.cozeChat?.open === 'function'
    });

    // 直接尝试打开或初始化
    try {
      // ✅ 每次点击都重新创建实例，并且尝试所有可能的打开方式
      console.log('[FloatingButton] 点击按钮，强制重新创建聊天窗口...');
      
      if (window.CozeWebSDK && window.CozeWebSDK.WebChatClient) {
        // 每次都创建新实例
        window.cozeChat = new window.CozeWebSDK.WebChatClient({
          config: { bot_id: '7636350042466418731' },
          componentProps: {
            title: '虚拟时光助手',
            // 尝试所有可能的自动打开参数
            autoOpen: true,
            defaultOpen: true,
            show: true,
            visible: true,
          },
        });
        
        // 打印所有方法
        console.log('[FloatingButton] ✅ 实例已创建，所有可用方法:', Object.keys(window.cozeChat));
        console.log('[FloatingButton] 完整实例:', window.cozeChat);
        
        // 暴力尝试所有可能的方法名
        const allMethods = ['open', 'show', 'toggle', 'display', 'openChat', 'showChat', 'launch', 'activate', 'expand'];
        allMethods.forEach(method => {
          if (typeof window.cozeChat[method] === 'function') {
            console.log(`[FloatingButton] 🎯 找到方法 ${method}()，尝试调用...`);
            try { window.cozeChat[method](); } catch(e) { console.error(e); }
          }
        });
        
        // 同时尝试点击 SDK 可能生成的浮动按钮
        setTimeout(() => {
          const possibleButtons = document.querySelectorAll('button[class*="coze"], button[class*="Coze"], div[class*="coze"], div[class*="Coze"], div[style*="fixed"]');
          console.log('[FloatingButton] 找到可能的按钮:', possibleButtons.length, '个');
          possibleButtons.forEach((btn, i) => {
            console.log(`[FloatingButton] 按钮 ${i}:`, btn.className || btn.id);
            try { btn.click(); } catch(e) {}
          });
        }, 500);
        
        return;
      }
      
      // 没有实例，重新初始化（正确的变量名是 window.CozeWebSDK！）
      if (window.CozeWebSDK) {
        console.log('[FloatingButton] 重新初始化 SDK...');
        window.cozeChat = new window.CozeWebSDK.WebChatClient({
          config: {
            bot_id: '7636350042466418731',
          },
          componentProps: {
            title: '虚拟时光助手',
          },
        });
        
        // 延迟一点时间后尝试打开
        setTimeout(() => {
          if (window.cozeChat && typeof window.cozeChat.open === 'function') {
            window.cozeChat.open();
            console.log('[FloatingButton] ✅ 初始化后打开成功');
          } else {
            alert('AI 助手正在加载，请稍后再试...');
          }
        }, 500);
      } else {
        alert('AI 助手脚本加载中，请刷新页面后再试...');
      }
    } catch (e) {
      console.error('[FloatingButton] ❌ 打开失败:', e);
      alert('AI 助手打开失败，请刷新页面重试');
    }
  };

  // 导出打开函数供其他地方调用
  useEffect(() => {
    window.openCozeChat = handleClick;
    return () => {
      delete window.openCozeChat;
    };
  }, []);

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
      style={{
        boxShadow: '0 4px 20px rgba(255, 123, 112, 0.4)'
      }}
      title={isReady ? '打开 AI 助手' : 'AI 助手加载中...'}
      disabled={false}
    >
      {error ? (
        <span className="text-white text-lg">⚠️</span>
      ) : (
        <MessageCircle className="w-7 h-7 text-white" />
      )}
    </button>
  );
}

export default FloatingButton;
