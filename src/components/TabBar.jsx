/**
 * 底部导航栏组件 v2.4.0
 * 
 * 修改：所有文字在同一高度，图标在上方，确保SDK按钮在最上方
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
      {/* 图标在最顶部 */}
      {isEmoji ? (
        <span className={`text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}>
          {tab.icon}
        </span>
      ) : (
        <tab.icon 
          className={`w-7 h-7 transition-transform ${isActive ? 'scale-110' : ''}`} 
          strokeWidth={isActive ? 2.5 : 2} 
        />
      )}
      {/* 文字在最底部，和AI助手文字对齐 */}
      <span className={`text-xs font-medium ${isActive ? '' : 'font-normal'}`}>
        {tab.label}
      </span>
    </button>
  );
});

export const TabBar = memo(function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-cream-200 dark:border-gray-700 z-40">
      <div className="flex items-stretch h-16 max-w-lg mx-auto">
        {tabs.map(tab => (
          <TabButton 
            key={tab.id} 
            tab={tab} 
            isActive={activeTab === tab.id} 
            onTabChange={onTabChange} 
          />
        ))}
        {/* 最右边空位：AI助手文字，和其他文字在同一高度 */}
        <div className="flex-1 flex flex-col items-center justify-end pb-1">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            AI助手
          </span>
        </div>
      </div>
    </nav>
  );
});
