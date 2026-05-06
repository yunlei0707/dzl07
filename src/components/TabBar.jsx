/**
 * 底部导航栏组件
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
      className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${isActive ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'}`}
    >
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
      <span className={`text-sm mt-1.5 font-medium ${isActive ? '' : 'font-normal'}`}>
        {tab.label}
      </span>
    </button>
  );
});

export const TabBar = memo(function TabBar({ activeTab, onTabChange }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-cream-200 dark:border-gray-700 safe-bottom z-30">
      <div className="flex items-center h-20 max-w-lg mx-auto">
        {tabs.map(tab => (
          <TabButton 
            key={tab.id} 
            tab={tab} 
            isActive={activeTab === tab.id} 
            onTabChange={onTabChange} 
          />
        ))}
        {/* 最右边留空位给SDK按钮 */}
        <div className="flex-1" />
      </div>
    </nav>
  );
});
