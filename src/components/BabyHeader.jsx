/**
 * 宝宝信息卡片组件（v2 双账号版本）
 * 支持账号切换和系统账号标记
 */

import { memo, useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { calculateAge } from '../utils/dateUtils';
import { getCurrentBabyInfo, getAvailableAccounts, switchAccount, isSystemAccount } from '../utils/dbV2';

export const BabyHeader = memo(function BabyHeader() {
  const { currentBaby, setCurrentBaby } = useApp();
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [currentAccountInfo, setCurrentAccountInfo] = useState(null);
  const [availableAccounts, setAvailableAccounts] = useState([]);

  // 监听 localStorage 变化来更新账号信息
  useEffect(() => {
    const updateAccountInfo = () => {
      const info = getCurrentBabyInfo();
      setCurrentAccountInfo(info);
      const accounts = getAvailableAccounts();
      setAvailableAccounts(accounts);
    };

    // 初始加载
    updateAccountInfo();

    // 监听 storage 事件（跨标签页同步）
    window.addEventListener('storage', updateAccountInfo);

    // 轮询更新（账号切换后）
    const interval = setInterval(updateAccountInfo, 500);

    return () => {
      window.removeEventListener('storage', updateAccountInfo);
      clearInterval(interval);
    };
  }, []);

  // 处理账号切换
  const handleSwitchAccount = (accountId) => {
    const success = switchAccount(accountId);
    if (success) {
      setShowAccountSwitcher(false);
      // 触发页面刷新账号信息
      const info = getCurrentBabyInfo();
      setCurrentAccountInfo(info);
      const accounts = getAvailableAccounts();
      setAvailableAccounts(accounts);
    }
  };

  // 显示加载状态
  if (!currentBaby && !currentAccountInfo) {
    return (
      <div className="card mb-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-cream-200 dark:bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-5 bg-cream-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-cream-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  // 使用 v2 账号信息或降级到 currentBaby
  const displayInfo = currentAccountInfo || {
    name: currentBaby?.name || '我的宝宝',
    nickname: currentBaby?.nickname || currentBaby?.name || '我的宝宝',
    avatar: currentBaby?.avatar,
    birthDate: currentBaby?.birthDate,
    gender: currentBaby?.gender || 'girl',
    isSystem: false
  };

  const age = displayInfo.birthDate ? calculateAge(displayInfo.birthDate) : null;
  const avatarUrl = displayInfo.avatar || 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=200';
  const isSysAccount = displayInfo.isSystem;

  return (
    <div className="card mb-4">
      <div className="flex items-center gap-4">
        {/* 头像区域 */}
        <div className="relative">
          <img
            src={avatarUrl}
            alt={displayInfo.nickname || displayInfo.name}
            className="w-16 h-16 rounded-full object-cover border-3 border-primary-200 shadow-sm"
          />
          {displayInfo.gender === 'girl' && (
            <span className="absolute -bottom-1 -right-1 text-lg">👧</span>
          )}
          {displayInfo.gender === 'boy' && (
            <span className="absolute -bottom-1 -right-1 text-lg">👦</span>
          )}
        </div>
        
        {/* 宝宝信息区域 */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {displayInfo.nickname || displayInfo.name}
            </h2>
            {/* 系统账号标记 */}
            {isSysAccount && (
              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300 text-xs rounded-full flex items-center gap-0.5">
                📌 系统示例
              </span>
            )}
          </div>
          
          {age && (
            <p className="text-primary-600 dark:text-primary-400 font-medium text-sm">
              {age.display}
            </p>
          )}
          
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {displayInfo.name} 
              {displayInfo.birthDate && (
                <> · 生日 {new Date(displayInfo.birthDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</>
              )}
            </p>
            
            {/* 账号切换按钮 */}
            {availableAccounts.length > 1 && (
              <button
                onClick={() => setShowAccountSwitcher(!showAccountSwitcher)}
                className="text-xs text-primary-500 hover:text-primary-600 dark:text-primary-400 flex items-center gap-1"
              >
                <span>切换账号</span>
                <svg className={`w-3 h-3 transition-transform ${showAccountSwitcher ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 账号切换面板 */}
      {showAccountSwitcher && availableAccounts.length > 1 && (
        <div className="mt-3 pt-3 border-t border-cream-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">切换账号：</p>
          <div className="flex flex-wrap gap-2">
            {availableAccounts.map(account => (
              <button
                key={account.id}
                onClick={() => handleSwitchAccount(account.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all flex items-center gap-1.5 ${
                  account.isCurrent
                    ? 'bg-primary-500 text-white'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600'
                }`}
              >
                <span>{account.nickname || account.name}</span>
                {account.isSystem && <span>📌</span>}
                {account.isCurrent && <span className="text-xs opacity-75">当前</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 系统账号提示 */}
      {isSysAccount && (
        <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-400">
            📌 这是系统示例账号，记录了"豆芽"的成长故事。您可以在下方创建自己的宝宝档案。
          </p>
        </div>
      )}
    </div>
  );
});
