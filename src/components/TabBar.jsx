/**
 * 底部导航栏组件 v2.5.3
 * 
 * 修改：1. AI助手文字用绝对定位放到SDK按钮正下方 2. 图标缩小，圆形容器保持大小一致
 */

import { memo } from 'react';
import { Home, BarChart3, Sparkles, User } from 'lucide-react';

const tabs = [
  { id: 'timeline', label: '时光轴', icon: Home },
  { id: 'stats', label: '成长数据', icon: BarChart3 },
  { id: 'virtual', label: '虚拟时光', icon: Sparkles },
  { id: 'profile', label: '我的', icon: User },
];

const TabButton = memo(({ tab, isActive, onTabChange }) => {
  const isEmoji = typeof tab.icon === 'string';
  return (
    <button
      onClick={() => onTabChange(tab.id)}
      className={`flex flex-col items-center justify-between pt-0 pb-1 flex-1 h-full transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`}
    >
      {/* 圆形图标容器保持大小不变，内部图标缩小 */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
        isActive ? 'bg-primary-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-700'
      }`}>
        {isEmoji ? (
          <span className={`text-lg transition-transform ${isActive ? 'scale-110' : ''}`}>
            {tab.icon}
          </span>
        ) : (
          <tab.icon 
            className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} 
            strokeWidth={isActive ? 2.5 : 2} 
          />
        )}
      </div>
      {/* 文字在最底部 */}
      <span className={`text-xs font-medium ${isActive ? '' : 'font-normal'}`}>
        {tab.label}
      </span>
    </button>
  );
});

export const TabBar = memo(function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-cream-200 dark:border-gray-700 z-40">
      <div className="flex items-stretch h-16 max-w-lg mx-auto relative">
        {tabs.map(tab => (
          <TabButton 
            key={tab.id} 
            tab={tab} 
            isActive={activeTab === tab.id} 
            onTabChange={onTabChange} 
          />
        ))}
        {/* 占位，给SDK按钮留出位置 */}
        <div className="flex-1"></div>
      </div>
      {/* AI助手文字，用绝对定位放到SDK按钮正下方 */}
      <div className="absolute bottom-1 right-4 transform -translate-x-1/2">
        <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
          AI助手
        </span>
      </div>
    </nav>
  );
});
