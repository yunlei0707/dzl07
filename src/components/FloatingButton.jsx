/**
 * SDK 初始化组件 v2.5.0
 * 
 * 功能：初始化扣子SDK，并在SDK按钮下方渲染"AI助手"文字标签
 */

import { useEffect } from 'react';
import './FloatingButton.css';

export function FloatingButton() {
  // 初始化扣子 SDK - 只执行一次
  useEffect(() => {
    console.log('[FloatingButton v2.5.0] 开始初始化 SDK...');

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
      } else {
        console.error('[FloatingButton] ❌ window.CozeWebSDK 不存在');
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

  // 渲染"AI助手"文字标签在SDK按钮下方
  return (
    <div className="ai-assistant-label">
      AI助手
    </div>
  );
}

export default FloatingButton;
