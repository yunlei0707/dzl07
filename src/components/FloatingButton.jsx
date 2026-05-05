/**
 * 悬浮 AI 助手按钮组件
 * 
 * 功能：
 * 1. 初始化扣子 SDK（SDK 会自动渲染浮动按钮）
 * 2. 暴露打开函数供其他地方调用
 */

import { useEffect } from 'react';

export function FloatingButton() {

  // 初始化扣子 SDK - 只执行一次
  useEffect(() => {
    console.log('[FloatingButton] 开始初始化...');

    const initSDK = () => {
      // 避免重复初始化
      if (window.cozeChatInitialized) {
        console.log('[FloatingButton] ✅ SDK 已初始化，跳过');
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

  // 暴露打开函数供其他地方调用
  useEffect(() => {
    window.openCozeChat = () => {
      // SDK 会自己渲染浮动按钮，用户点击 SDK 的按钮即可打开
      console.log('[FloatingButton] 请点击 SDK 自带的浮动聊天按钮');
    };
    return () => {
      delete window.openCozeChat;
    };
  }, []);

  // 不渲染任何按钮 - SDK 会自动渲染浮动按钮
  return null;
}

export default FloatingButton;
