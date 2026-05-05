/**
 * 悬浮 AI 助手按钮组件 v2.2.0
 * 
 * 功能：
 * 1. 初始化扣子 SDK
 * 2. 点击时触发 SDK 聊天窗口
 * 3. 支持拖拽调整位置，位置保存到 localStorage
 */

import { useEffect, useState, useRef } from 'react';
import { MessageCircle } from 'lucide-react';

export function FloatingButton() {
  const [isReady, setIsReady] = useState(false);
  const buttonRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 初始化位置（从 localStorage 读取）
  useEffect(() => {
    const saved = localStorage.getItem('floating-button-position');
    if (saved) {
      try {
        const pos = JSON.parse(saved);
        setPosition(pos);
      } catch (e) {
        // 使用默认位置
      }
    }
  }, []);

  // 初始化扣子 SDK - 只执行一次
  useEffect(() => {
    console.log('[FloatingButton v2.2.0] 开始初始化...');

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
          
          // 隐藏 SDK 自带的悬浮按钮（用我们自己的）
          setTimeout(hideSDKFloatButton, 500);
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

  // 隐藏 SDK 自带的悬浮按钮
  const hideSDKFloatButton = () => {
    const selectors = [
      '[class*="coze-chat-float-btn"]',
      '[class*="float-btn"]',
      '[class*="asst-btn"]',
      '[class*="coze"] button',
      '[class*="Coze"] button',
      'button[aria-label*="chat"]',
      'button[aria-label*="助手"]',
      'div[style*="position: fixed"] button',
    ];
    
    selectors.forEach(selector => {
      document.querySelectorAll(selector).forEach(el => {
        el.style.display = 'none';
        el.style.visibility = 'hidden';
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
        el.style.position = 'absolute';
        el.style.left = '-9999px';
      });
    });
  };

  // 点击打开聊天窗口 - 尝试找到 SDK 的按钮并点击
  const handleClick = () => {
    console.log('[FloatingButton] 点击打开聊天窗口');
    
    // 先尝试直接调用 SDK 的 open 方法
    if (window.cozeChat && typeof window.cozeChat.open === 'function') {
      try {
        window.cozeChat.open();
        console.log('[FloatingButton] 直接调用 open() 成功');
        return;
      } catch (e) {
        console.error('[FloatingButton] 直接调用失败:', e);
      }
    }
    
    // 备用方案：查找并点击 SDK 渲染的元素
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
            return;
          } catch (e) {
            console.error('[FloatingButton] 点击失败:', e);
          }
        }
      }
      
      alert('请刷新页面后重试');
    }, 100);
  };

  // 拖拽开始
  const handleDragStart = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragStart({
      x: clientX - position.x,
      y: clientY - position.y
    });
    e.preventDefault();
  };

  // 拖拽中
  const handleDragMove = (e) => {
    if (!isDragging) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    // 计算新位置，带边界限制
    const maxX = window.innerWidth - 70;
    const maxY = window.innerHeight - 70;
    const newX = Math.max(0, Math.min(maxX, clientX - dragStart.x));
    const newY = Math.max(0, Math.min(maxY, clientY - dragStart.y));
    
    setPosition({ x: newX, y: newY });
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setIsDragging(false);
    // 保存位置到 localStorage
    localStorage.setItem('floating-button-position', JSON.stringify(position));
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
      ref={buttonRef}
      onClick={handleClick}
      onMouseDown={handleDragStart}
      onMouseMove={handleDragMove}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={handleDragStart}
      onTouchMove={handleDragMove}
      onTouchEnd={handleDragEnd}
      className="fixed z-50 w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-200 select-none"
      style={{
        right: position.x ? 'auto' : '16px',
        bottom: position.y ? 'auto' : '80px',
        left: position.x ? `${position.x}px` : 'auto',
        top: position.y ? `${position.y}px` : 'auto',
        boxShadow: '0 4px 20px rgba(255, 123, 112, 0.4)',
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      title={isReady ? 'AI 助手 (可拖拽)' : 'AI 助手加载中...'}
    >
      <MessageCircle className="w-7 h-7 text-white" />
    </button>
  );
}

export default FloatingButton;
