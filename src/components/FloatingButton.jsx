import { useEffect } from 'react';

/**
 * 确保 SDK 按钮正常显示
 */

export function FloatingButton() {
  useEffect(() => {
    // 确保按钮显示 - 每隔一段时间检查并确保按钮可见
    const ensureButtonVisible = () => {
      const buttons = document.querySelectorAll('[class*="coze-chat"] [class*="float-btn"], [class*="coze-chat"] button[class*="launcher"], [class*="coze-chat-float-btn"]');
      buttons.forEach(btn => {
        if (btn) {
          btn.style.display = 'flex';
          btn.style.visibility = 'visible';
          btn.style.opacity = '1';
        }
      });
    };

    // 多次检查确保按钮显示
    setTimeout(ensureButtonVisible, 500);
    setTimeout(ensureButtonVisible, 1000);
    setTimeout(ensureButtonVisible, 2000);

    return () => {};
  }, []);

  return null;
}

export default FloatingButton;
