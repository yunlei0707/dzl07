/**
 * 成长数据页面
 * 优化版本：左上角显示头像，月度报告入口，双账号支持
 */

import { useMemo, useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { BabyHeader } from '../components/BabyHeader';
import { calculateAge } from '../utils/dateUtils';
import { getMomentsByBaby, getCapsulesByBaby } from '../utils/db';
import { Gift, TrendingUp, Camera, Star, BookOpen, ChevronDown, ChevronRight, Plus, Trash2, Edit3, BarChart2 } from 'lucide-react'
import { getCurrentV2Account, getCurrentTimeline, getCurrentGrowth, updateCurrentGrowth, isSystemAccount as checkIsSystemAccount, getCurrentBabyInfo } from '../utils/dbV2';
import { TimeBlindBox } from '../components/TimeBlindBox';
import { GROWTH_LABELS, GROWTH_UNITS, GROWTH_ICONS } from '../utils/growthMilestones';

// 成长曲线图组件
export function StatsPage({ onOpenCapsules, onStatClick, onOpenMonthlyReport, onAddGrowthRecord, onEditGrowthRecord }) {
  const { currentBaby, currentUser, moments, capsules, setMoments, setCapsules, showToast, getAllMilestones, growthRecords, refreshGrowthRecords } = useApp();
  
  // v2 账号系统：获取当前账号信息
  const [v2Moments, setV2Moments] = useState([]);
  const [v2Growth, setV2Growth] = useState(null);
  const [v2BabyInfo, setV2BabyInfo] = useState(null);
  const [isSystemAccount, setIsSystemAccount] = useState(false);
  const [hasV2Baby, setHasV2Baby] = useState(false);
  const [v2AccountInfo, setV2AccountInfo] = useState(null);
  
  // 监听账号切换，刷新 v2 数据（和 TimelinePage 完全一致）
  useEffect(() => {
    const updateV2Info = () => {
      const account = getCurrentV2Account();
      const timeline = getCurrentTimeline();
      const isSystem = checkIsSystemAccount();
      const growth = getCurrentGrowth();
      const babyInfo = getCurrentBabyInfo();
      
      setV2Moments(timeline);
      setIsSystemAccount(isSystem);
      setHasV2Baby(!!babyInfo);
      setV2AccountInfo(account || null);
      setV2Growth(growth);
      setV2BabyInfo(babyInfo);
    };
    
    // 数据更新时：刷新 v2 数据
    const handleDataUpdate = () => {
      updateV2Info();
      // 如果没有 v2 宝宝，则从 IndexedDB 重新加载
      if (currentBaby && !getCurrentBabyInfo()) {
        getMomentsByBaby(currentBaby.id).then(babyMoments => {
          setMoments(babyMoments);
        });
        getCapsulesByBaby(currentBaby.id).then(babyCapsules => {
          setCapsules(babyCapsules);
        });
      }
    };
    
    updateV2Info();
    
    // 监听 localStorage 变化（跨标签页同步）
    window.addEventListener('storage', updateV2Info);
    // 监听数据更新事件（添加/导入动态后触发）
    window.addEventListener('v2-moment-updated', handleDataUpdate);
    // 轮询更新（和 TimelinePage 一致，300ms）
    const interval = setInterval(updateV2Info, 300);
    
    return () => {
      window.removeEventListener('storage', updateV2Info);
      window.removeEventListener('v2-moment-updated', handleDataUpdate);
      clearInterval(interval);
    };
  }, [currentBaby, setMoments, setCapsules]);
  
  // 刷新成长记录
  useEffect(() => {
    const babyId = v2BabyInfo?.id || currentBaby?.id;
    if (babyId) {
      refreshGrowthRecords(babyId);
    }
  }, [currentBaby, v2BabyInfo, refreshGrowthRecords]);
  
  // 优先使用 v2 账号信息，兼容旧的 currentBaby
  const displayBaby = v2BabyInfo || currentBaby;
  
  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  
  // 折叠状态 - 成长概览默认展开，其他折叠
  const [showGrowthOverview, setShowGrowthOverview] = useState(true);
  const [showMilestoneStats, setShowMilestoneStats] = useState(false);
  const [showRecordTypes, setShowRecordTypes] = useState(false);
  const [showGrowthRecords, setShowGrowthRecords] = useState(true);
  const [expandedRecordId, setExpandedRecordId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);
  const containerRef = useRef(null);
  
  // 刷新数据
  const handleRefresh = useCallback(async () => {
    if (!currentBaby || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const [updatedMoments, updatedCapsules] = await Promise.all([
        getMomentsByBaby(currentBaby.id),
        getCapsulesByBaby(currentBaby.id)
      ]);
      setMoments(updatedMoments);
      setCapsules(updatedCapsules);
      showToast('已刷新');
    } catch (error) {
      showToast('刷新失败', 'error');
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [currentBaby, isRefreshing, setMoments, setCapsules, showToast]);
  
  // 下拉刷新手势处理
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    if (containerRef.current) {
      scrollTop.current = containerRef.current.scrollTop;
    }
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    if (scrollTop.current <= 0 && diff > 0) {
      const dampened = Math.min(diff * 0.3, 100);
      setPullDistance(dampened);
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing]);
  
  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, handleRefresh]);
  
  // 计算统计数据
  const stats = useMemo(() => {
    if (!displayBaby) return null;
    
    const age = calculateAge(displayBaby.birthDate);
    
    // 和 TimelinePage 一致：有 v2 宝宝用 v2Moments，否则用 moments
    const activeMoments = hasV2Baby
      ? v2Moments.filter(m => !m.isDeleted)
      : (moments && moments.length > 0
        ? moments.filter(m => !m.isDeleted)
        : []);
    
    // 照片数量
    const photoCount = activeMoments.filter(m => m.photos && m.photos.length > 0)
      .reduce((acc, m) => acc + m.photos.length, 0);
    
    // 里程碑数量
    const milestoneCount = activeMoments.filter(m => m.milestone).length;
    
    // 按类型统计
    const photoMoments = activeMoments.filter(m => m.type === 'photo').length;
    const videoMoments = activeMoments.filter(m => m.type === 'video').length;
    const diaryMoments = activeMoments.filter(m => m.type === 'diary').length;
    const audioMoments = activeMoments.filter(m => m.type === 'audio').length;
    
    // 按心情统计
    const moodStats = {};
    activeMoments.forEach(m => {
      if (m.mood) {
        moodStats[m.mood] = (moodStats[m.mood] || 0) + 1;
      }
    });
    
    // 最常见心情
    const topMood = Object.entries(moodStats)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || null;
    
    // 胶囊数量（非 v2 账号）
    const unlockedCapsules = capsules.filter(c => 
      new Date(c.unlockDate) <= new Date()
    ).length;
    const lockedCapsules = capsules.length - unlockedCapsules;
    
    return {
      age,
      photoCount,
      totalMoments: activeMoments.length,
      milestoneCount,
      unlockedCapsules,
      lockedCapsules,
      photoMoments,
      videoMoments,
      diaryMoments,
      audioMoments,
      topMood,
      moodStats,
    };
  }, [currentBaby, moments, capsules, v2Moments, hasV2Baby]);
  
  // 里程碑列表
  const milestones = useMemo(() => {
    const sourceMoments = hasV2Baby
      ? v2Moments
      : (moments && moments.length > 0 ? moments : []);
    return sourceMoments.filter(m => m.milestone && !m.isDeleted).slice(0, 5);
  }, [moments, v2Moments, hasV2Baby]);

  // 里程碑类型统计
  const milestoneStats = useMemo(() => {
    const sourceMoments = hasV2Baby
      ? v2Moments
      : (moments && moments.length > 0 ? moments : []);
    const milestoneMoments = sourceMoments.filter(m => m.milestone && !m.isDeleted);
    
    // 获取所有里程碑选项
    const allOptions = getAllMilestones();
    
    // 按milestone id分组计数
    const countMap = {};
    milestoneMoments.forEach(m => {
      const key = m.milestone;
      if (key) {
        countMap[key] = (countMap[key] || 0) + 1;
      }
    });
    
    // 构建结果：只显示有记录的类型
    const result = allOptions
      .filter(opt => countMap[opt.id])
      .map(opt => ({
        id: opt.id,
        label: opt.label,
        emoji: opt.emoji,
        count: countMap[opt.id],
      }));
    
    // 也加上没有匹配到选项的里程碑（自定义被删除的）
    Object.keys(countMap).forEach(key => {
      if (!result.find(r => r.id === key)) {
        const sample = milestoneMoments.find(m => m.milestone === key);
        result.push({
          id: key,
          label: sample?.milestoneLabel || key,
          emoji: sample?.milestoneEmoji || '⭐',
          count: countMap[key],
        });
      }
    });
    
    // 按数量降序
    return result.sort((a, b) => b.count - a.count);
  }, [moments, v2Moments, hasV2Baby, getAllMilestones]);
  
  if (!displayBaby || !stats) {
    return (
      <div className="min-h-screen pb-20 flex flex-col items-center justify-center px-4">
        <div className="w-24 h-24 mx-auto mb-4 bg-cream-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
          <BarChart2 className="w-12 h-12 text-gray-300" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-2 text-center">
          {isSystemAccount 
            ? '系统账号暂无成长数据' 
            : '还没有成长数据哦'
          }
        </p>
        {!isSystemAccount && (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
            在时光轴添加记录，或切换到其他账号查看
          </p>
        )}
        {isSystemAccount && (
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center">
            切换到自己的账号开始记录
          </p>
        )}
      </div>
    );
  }
  
  const moodEmojis = {
    happy: '😊 开心',
    excited: '🎉 兴奋',
    touched: '🥰 感动',
    sleepy: '😴 困倦',
    crying: '😢 哭泣',
    angry: '😠 生气',
  };
  
  const moodFilterLabels = {
    happy: '😊',
    excited: '🎉',
    touched: '🥰',
    sleepy: '😴',
    crying: '😢',
    angry: '😠',
  };
  
  return (
    <div 
      ref={containerRef}
      className="min-h-screen pb-20"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="flex items-center justify-center py-3 text-gray-400 transition-transform"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          {isRefreshing ? (
            <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full" />
          ) : (
            <div 
              className="w-5 h-5 border-2 border-gray-300 border-t-primary-400 rounded-full transition-transform"
              style={{ transform: `rotate(${pullDistance * 3}deg)` }}
            />
          )}
        </div>
      )}
      
      {/* 头部 - 优化：左上角显示头像 */}
      <header className="bg-gradient-to-b from-[#FFF0E0] via-[#FFF8F0] to-white safe-top">
        <div className="px-4 pt-4 pb-6">
      
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* 头像显示在左上角（使用v2账号身份信息） */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center text-lg overflow-hidden shadow-sm">
                {v2AccountInfo?.accountData?.avatar ? (
                  v2AccountInfo.accountData.avatar.startsWith('data:') || v2AccountInfo.accountData.avatar.startsWith('http') ? (
                    <img src={v2AccountInfo.accountData.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{v2AccountInfo.accountData.avatar}</span>
                  )
                ) : currentUser?.avatar ? (
                  currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http') ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.avatar}</span>
                  )
                ) : (
                  <span>👶</span>
                )}
              </div>
              <h1 className="text-base font-medium text-gray-600 dark:text-gray-300">
                {v2AccountInfo?.identityName || currentUser?.name || "📊 成长数据"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <TimeBlindBox moments={hasV2Baby ? v2Moments.filter(m => !m.isDeleted) : (moments || [])} babyName={v2BabyInfo?.nickname || v2BabyInfo?.name || displayBaby?.name || '宝宝'} />
            </div>
          </div>
          
          <BabyHeader />
          
          {/* 系统账号提示 */}
          {isSystemAccount && (
            <div className="mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                📌 系统示例账号，成长数据仅供参考
              </p>
            </div>
          )}
        </div>
          
      </header>
      
      {/* 统计内容 */}
      <main className="px-4 -mt-4 space-y-4 max-w-lg mx-auto">
        {/* 概览卡片 */}
        <div className="card animate-fade-in">
          <h3 
            className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 cursor-pointer hover:text-gray-600"
            onClick={() => setShowGrowthOverview(!showGrowthOverview)}
          >
            <TrendingUp className="w-5 h-5 text-primary-500" />
            成长概览
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${showGrowthOverview ? 'rotate-180' : ''}`} />
          </h3>
          
          {showGrowthOverview && (
            <div className="grid grid-cols-2 gap-3">
            {/* 成长记录 */}
            <div 
              className="bg-cream-50 dark:bg-gray-700 rounded-xl p-4 text-center cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onStatClick({ type: 'timeline' })}
            >
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                {stats.totalMoments}
              </p>
              <p className="text-xs text-gray-400 mt-1">成长记录</p>
            </div>
            
            {/* 珍贵照片 */}
            <div 
              className="bg-cream-50 dark:bg-gray-700 rounded-xl p-4 text-center cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onStatClick({ type: 'filter', filterType: 'photo' })}
            >
              <p className="text-3xl font-bold text-warm-600 dark:text-warm-400">
                {stats.photoCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">珍贵照片</p>
            </div>
            
            {/* 重要里程碑 */}
            <div 
              className="bg-cream-50 dark:bg-gray-700 rounded-xl p-4 text-center cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onStatClick({ type: 'filter', filterMilestone: 'all' })}
            >
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                {stats.milestoneCount}
              </p>
              <p className="text-xs text-gray-400 mt-1">重要里程碑</p>
            </div>
            
            {/* 成长天数 */}
            <div 
              className="bg-cream-50 dark:bg-gray-700 rounded-xl p-4 text-center cursor-pointer active:scale-[0.98] transition-transform"
              onClick={() => onStatClick({ type: 'profile', baby: displayBaby })}
            >
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {stats.age.totalDays}
              </p>
              <p className="text-xs text-gray-400 mt-1">成长天数</p>
            </div>
          </div>
          )}
        </div>
        
        {/* 记录类型分布 */}
        <div className="card animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 
            className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 cursor-pointer hover:text-gray-600"
            onClick={() => setShowRecordTypes(!showRecordTypes)}
          >
            <Camera className="w-5 h-5 text-primary-500" />
            记录类型
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${showRecordTypes ? 'rotate-180' : ''}`} />
          </h3>
          
          {showRecordTypes && (
            <div className="space-y-3">
            {/* 照片记录 */}
            <div 
              className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform rounded-lg p-1 -m-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onStatClick({ type: 'filter', filterType: 'photo' })}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">📷</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">照片记录</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-cream-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-400 rounded-full"
                    style={{ width: `${(stats.photoMoments / Math.max(stats.totalMoments, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 font-medium">{stats.photoMoments}</span>
              </div>
            </div>
            
            {/* 视频记录 */}
            <div 
              className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform rounded-lg p-1 -m-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onStatClick({ type: 'filter', filterType: 'video' })}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🎬</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">视频记录</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-cream-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400 rounded-full"
                    style={{ width: `${(stats.videoMoments / Math.max(stats.totalMoments, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{stats.videoMoments}</span>
              </div>
            </div>
            
            {/* 文字记录 */}
            <div 
              className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform rounded-lg p-1 -m-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onStatClick({ type: 'filter', filterType: 'diary' })}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">文字记录</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-cream-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-warm-400 rounded-full"
                    style={{ width: `${(stats.diaryMoments / Math.max(stats.totalMoments, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 w-8 font-medium">{stats.diaryMoments}</span>
              </div>
            </div>
            
            {/* 语音记录 */}
            <div 
              className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform rounded-lg p-1 -m-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={() => onStatClick({ type: 'filter', filterType: 'audio' })}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">🎙️</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">语音记录</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-cream-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-400 rounded-full"
                    style={{ width: `${(stats.audioMoments / Math.max(stats.totalMoments, 1)) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 w-8 text-right">{stats.audioMoments}</span>
              </div>
            </div>
          </div>
          )}
        </div>
        
        {/* 里程碑类型统计 */}
        <div className="card animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h3 
            className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 cursor-pointer hover:text-gray-600"
            onClick={() => setShowMilestoneStats(!showMilestoneStats)}
          >
            <Star className="w-5 h-5 text-amber-500" />
            里程碑统计
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${showMilestoneStats ? 'rotate-180' : ''}`} />
          </h3>
          
          {showMilestoneStats && (
            <div className="space-y-3">
            {milestoneStats.length > 0 ? milestoneStats.map((ms) => (
              <div 
                key={ms.id}
                className="flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform rounded-lg p-1 -m-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => onStatClick({ type: 'filter', filterMilestone: ms.id })}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{ms.emoji}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{ms.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-cream-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full"
                      style={{ width: `${(ms.count / Math.max(stats.milestoneCount, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-500 w-8 font-medium text-right">{ms.count}</span>
                </div>
              </div>
            )) : (
              <div className="space-y-3">
                {getAllMilestones().map((opt) => (
                  <div key={opt.id} className="flex items-center justify-between rounded-lg p-1 -m-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{opt.emoji}</span>
                      <span className="text-sm text-gray-400">{opt.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-cream-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: '0%' }} />
                      </div>
                      <span className="text-sm text-gray-400 w-8 font-medium text-right">0</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>
        
        {/* 宝宝成长档案入口 */}
        <div 
          className="card cursor-pointer active:scale-[0.98] transition-transform animate-fade-in"
          style={{ animationDelay: '0.4s' }}
          onClick={() => onOpenMonthlyReport?.()}
        >
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 cursor-pointer hover:text-gray-600">
            <BookOpen className="w-5 h-5 text-primary-500" />
            宝宝成长档案
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </h3>
          <p className="text-xs text-gray-400 mt-1">查看成长档案</p>
        </div>
        
        {/* 身体成长区块 */}
        <div className="card animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h3 
            className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 cursor-pointer hover:text-gray-600"
            onClick={() => setShowGrowthRecords(!showGrowthRecords)}
          >
            <span className="text-xl">📐</span>
            身体成长
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ml-auto ${showGrowthRecords ? 'rotate-180' : ''}`} />
          </h3>
          
          {showGrowthRecords && (
            <div className="space-y-4">
              {/* 最新数据卡片 */}
              {growthRecords.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    {['height', 'weight', 'headCircumference', 'footLength'].map((field) => {
                      const latest = growthRecords[0];
                      const previous = growthRecords[1];
                      const value = latest?.[field];
                      const oldValue = previous?.[field];
                      const change = value && oldValue ? (value - oldValue).toFixed(1) : null;
                      const color = field === 'height' ? 'text-rose-400' : field === 'weight' ? 'text-amber-400' : field === 'headCircumference' ? 'text-purple-400' : 'text-emerald-400';
                      
                      return (
                        <div key={field} className="bg-cream-50 dark:bg-gray-700 rounded-xl p-3">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                            <span>{GROWTH_ICONS[field]}</span>
                            <span>{GROWTH_LABELS[field]}</span>
                          </div>
                          <p className={`text-xl font-bold text-gray-800 dark:text-white mt-1 ${color}`}>
                            {value != null ? `${value} ${GROWTH_UNITS[field]}` : '--'}
                          </p>
                          {change && (
                            <p className={`text-xs mt-0.5 ${parseFloat(change) >= 0 ? 'text-emerald-500' : 'text-red-400'}`}>
                              {parseFloat(change) >= 0 ? '↑' : '↓'}{Math.abs(parseFloat(change))} {GROWTH_UNITS[field]}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  
                  
                  {/* 添加记录按钮 */}
                  <button
                    onClick={() => onAddGrowthRecord?.()}
                    className="w-full py-3 border-2 border-dashed border-primary-300 dark:border-primary-600 rounded-xl text-primary-500 font-medium flex items-center justify-center gap-2 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                  >
                    <Plus className="w-5 h-5" />
                    记录成长数据
                  </button>
                  
                  {/* 历史记录列表 */}
                  <div className="space-y-2">
                    {growthRecords.map((record, index) => (
                      <div key={record.id} className="bg-cream-50 dark:bg-gray-800 rounded-xl p-3">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setExpandedRecordId(expandedRecordId === record.id ? null : record.id)}
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                              <span className="text-gray-400">📅</span>
                              {record.date}
                              {index === 0 && (
                                <span className="px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400 text-xs rounded">最新</span>
                              )}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                              {record.height != null && (
                                <span className="flex items-center gap-0.5">{GROWTH_ICONS.height} {record.height}cm</span>
                              )}
                              {record.weight != null && (
                                <span className="flex items-center gap-0.5">{GROWTH_ICONS.weight} {record.weight}kg</span>
                              )}
                              {record.headCircumference != null && (
                                <span className="flex items-center gap-0.5">{GROWTH_ICONS.headCircumference} {record.headCircumference}cm</span>
                              )}
                              {record.footLength != null && (
                                <span className="flex items-center gap-0.5">{GROWTH_ICONS.footLength} {record.footLength}cm</span>
                              )}
                              {record.photos?.length > 0 && (
                                <span className="flex items-center gap-0.5">📷 {record.photos.length}张照片</span>
                              )}
                              {record.note && (
                                <span className="flex items-center gap-0.5">📝 {record.note}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); onEditGrowthRecord?.(record); }}
                              className="p-2 text-gray-400 hover:text-primary-500"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(record.id); }}
                              className="p-2 text-gray-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedRecordId === record.id ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                        
                        {/* 展开的照片 */}
                        {expandedRecordId === record.id && record.photos?.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2">
                            {record.photos.map((photo, i) => (
                              <img 
                                key={i}
                                src={photo}
                                alt=""
                                className="w-full aspect-square object-cover rounded-lg"
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400 dark:text-gray-500 mb-4">还没有成长记录哦</p>
                  <button
                    onClick={() => onAddGrowthRecord?.()}
                    className="px-6 py-3 bg-primary-500 text-white rounded-full font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    记录成长数据
                  </button>
                </div>
              )}
              
              {/* 删除确认弹窗 */}
              {deleteConfirmId && (
                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-xs w-full">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-2">确认删除</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">删除后将无法恢复，确定要删除这条成长记录吗？</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="flex-1 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-600 dark:text-gray-400 font-medium"
                      >
                        取消
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const { deleteGrowthRecord } = await import('../utils/db');
                            await deleteGrowthRecord(deleteConfirmId);
                            await refreshGrowthRecords();
                            showToast('已删除');
                          } catch (e) {
                            showToast('删除失败', 'error');
                          }
                          setDeleteConfirmId(null);
                        }}
                        className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-medium"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
