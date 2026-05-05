/**
 * 悬浮 AI 助手按钮组件
 * 
 * 功能：
 * 1. 初始化扣子 SDK
 * 2. 点击时触发 SDK 聊天窗口
 */

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

export function FloatingButton() {
  const [isReady, setIsReady] = useState(false);

  // 初始化扣子 SDK - 只执行一次
  useEffect(() => {
    console.log('[FloatingButton] 开始初始化...');

    const initSDK = () => {
      // 避免重复初始化
      if (window.cozeChatInitialized) {
        console.log('[FloatingButton] ✅ SDK 已初始化，跳过');
        setIsReady(true);
        return;
      }

      if (window.CozeWebSDK && window.CozeWebSDK.WebChatClient) {
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
          window.cozeChatInitialized = true;
          setIsReady(true);
          console.log('[FloatingButton] ✅ CozeWebSDK 初始化成功');
        } catch (e) {
          console.error('[FloatingButton] ❌ SDK 初始化失败:', e);
        }
      }
    };

    // 延迟检查确保 SDK 脚本已执行
    const timer = setTimeout(initSDK, 800);
    
    // 如果 SDK 已经加载，立即检查
    if (window.CozeWebSDK) {
      clearTimeout(timer);
      initSDK();
    }

    return () => clearTimeout(timer);
  }, []);

  // 点击打开聊天窗口 - 尝试找到 SDK 的按钮并点击
  const handleClick = () => {
    console.log('[FloatingButton] 点击打开聊天窗口');
    
    // 尝试找到 SDK 渲染的浮动按钮并点击
    setTimeout(() => {
      // 查找 SDK 可能渲染的按钮
      const selectors = [
        'button[class*="coze"]',
        'button[class*="Coze"]', 
        'div[class*="coze"] button',
        'div[class*="Coze"] button',
        'iframe[class*="coze"]',
        'iframe[class*="Coze"]',
      ];
      
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          console.log(`[FloatingButton] 找到 ${elements.length} 个元素: ${selector}`);
          // 点击第一个元素
          try {
            elements[0].click();
            console.log('[FloatingButton] 点击成功');
            return;
          } catch (e) {
            console.error('[FloatingButton] 点击失败:', e);
          }
        }
      }
      
      // 如果找不到 SDK 按钮，提示用户
      alert('请点击右下角的聊天图标与 AI 助手对话');
    }, 100);
  };

  // 暴露打开函数供其他地方调用
  useEffect(() => {
    window.openCozeChat = handleClick;
    return () => {
      delete window.openCozeChat;
    };
  }, []);

  // 渲染我们自己的按钮
  return (
    <button
      onClick={handleClick}
      className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200"
      style={{
        boxShadow: '0 4px 20px rgba(255, 123, 112, 0.4)'
      }}
      title={isReady ? '打开 AI 助手' : 'AI 助手加载中...'}
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </button>
  );
}

export default FloatingButton;
