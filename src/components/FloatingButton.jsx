/**
 * SDK 初始化组件 v2.6.0
 * 
 * 修改：添加ui.footer配置，自定义底部文案
 */

import { useEffect } from 'react';

export function FloatingButton() {
  // 初始化扣子 SDK - 只执行一次
  useEffect(() => {
    console.log('[FloatingButton v2.6.0] 开始初始化 SDK...');

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
              title: '未来宝宝AI助手',
            },
            // UI配置 - 自定义底部文案
            ui: {
              footer: {
                isShow: true,
                expressionText: '未来宝宝AI助手-由Coze提供技术支持',
                linkvars: {}
              }
            }
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

  // 不渲染任何内容
  return null;
}

export default FloatingButton;
