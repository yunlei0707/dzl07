/**
 * 时光轴页面
 * ✅ 性能优化版本：懒加载 + 分页加载
 * ✅ 双账号支持：账号切换和数据隔离
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { BabyHeader } from '../components/BabyHeader';
import { MomentCard } from '../components/MomentCard';
import { PhotoViewer } from '../components/PhotoViewer';
import { ShareCard } from '../components/ShareCard';
import { groupByYearAndMonth } from '../utils/dateUtils';
import { deleteMoment, getMomentsByBaby, addMoment, initDB } from '../utils/db';
import { PredictionPage } from '../components/PredictionPage';
import { Plus, Calendar, X, ChevronDown, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { 
  getCurrentV2Account, 
  getCurrentTimeline, 
  addMomentToCurrentAccount,
  deleteMomentFromCurrentAccount,
  updateMomentInCurrentAccount,
  isSystemAccount as checkIsSystemAccount,
  getCurrentBabyInfo,
  deleteLinkedContentByRecordId
} from '../utils/dbV2';

// 类型筛选选项
const typeFilters = [
  { value: '', label: '全部' },
  { value: 'photo', label: '照片' },
  { value: 'video', label: '视频' },
  { value: 'diary', label: '文字' },
  { value: 'audio', label: '语音' },
];

export function TimelinePage({ 
  onAddMoment, 
  onEditMoment, 
  onSwitchBaby, 
  onAddBaby, 
  filterType, 
  filterMood, 
  filterMilestone,
  onClearFilters 
}) {
  const { moments, setMoments, currentBaby, currentUser, showToast, getAllMilestones, getAllMoods } = useApp();
  
  // v2 账号系统状态
  const [v2Moments, setV2Moments] = useState([]);
  const [isSystemAccount, setIsSystemAccount] = useState(false);
  const [hasV2Baby, setHasV2Baby] = useState(false);
  const [v2AccountInfo, setV2AccountInfo] = useState(null);
  
  // 删除确认弹窗状态
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, momentId: null, momentContent: '' });
  
  // 监听账号切换和动态更新，刷新 v2 数据
  useEffect(() => {
    const updateV2Info = () => {
      const account = getCurrentV2Account();
      const timeline = getCurrentTimeline();
      const isSystem = checkIsSystemAccount();
      const babyInfo = getCurrentBabyInfo();
      
      // 只在数据真正变化时才更新，避免不必要的重渲染
      setV2Moments(prev => {
        if (JSON.stringify(prev) === JSON.stringify(timeline)) return prev;
        return timeline;
      });
      setIsSystemAccount(isSystem);
      setHasV2Baby(!!babyInfo);
      setV2AccountInfo(account || null);
    };
    
    updateV2Info();
    
    // 监听 localStorage 变化
    window.addEventListener('storage', updateV2Info);
    // 轮询更新（检测添加动态等操作），改为5秒减少频繁渲染
    const interval = setInterval(updateV2Info, 5000);
    
    // 监听自定义事件（添加动态后主动刷新）
    const handleMomentAdded = () => updateV2Info();
    window.addEventListener('v2-moment-updated', handleMomentAdded);
    
    return () => {
      window.removeEventListener('storage', updateV2Info);
      clearInterval(interval);
      window.removeEventListener('v2-moment-updated', handleMomentAdded);
    };
  }, []);
  
  // 获取所有名场面选项（包含预设和自定义）
  const milestoneFilters = useMemo(() => {
    const allMilestones = getAllMilestones();
    return [
      { value: '', label: '全部', emoji: '✨', color: '#8B5CF6', shortLabel: '全部' },
      ...allMilestones.map(m => ({
        value: m.id,
        label: m.label,
        emoji: m.emoji,
        color: m.color || '#8B5CF6',
        shortLabel: m.shortLabel || m.label
      }))
    ];
  }, [getAllMilestones]);

  // 获取所有心情选项（包含预设和自定义）
  const moodFilters = useMemo(() => {
    const allMoods = getAllMoods();
    return [
      { value: '', label: '全部' },
      ...allMoods.map(m => ({
        value: m.id,
        label: m.label
      }))
    ];
  }, [getAllMoods]);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showMilestoneDropdown, setShowMilestoneDropdown] = useState(false);
  const [showPrediction, setShowPrediction] = useState(false);
  const [sharingMoment, setSharingMoment] = useState(null);

  
  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);
  const containerRef = useRef(null);
  
  const shareCardRef = useRef(null);
  
  // 监听外部筛选条件变化
  useEffect(() => {
    if (filterType && filterType !== 'specific' && filterType !== '') {
      setSelectedType(filterType);
    }
    if (filterMood) {
      setSelectedMood(filterMood);
    }
    if (filterMilestone) {
      setSelectedMilestone(filterMilestone);
    }
  }, [filterType, filterMood, filterMilestone]);
  
  // 分享动态
  const handleShareMoment = useCallback((moment) => {
    setSharingMoment(moment);
  }, []);
  
  // 刷新数据
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      if (isSystemAccount) {
        // 系统账号刷新 v2 数据
        const timeline = getCurrentTimeline();
        setV2Moments(timeline);
      } else if (currentBaby) {
        // 用户账号刷新 db 数据
        const babyMoments = await getMomentsByBaby(currentBaby.id);
        setMoments(babyMoments);
      }
      showToast('已刷新');
    } catch (error) {
      showToast('刷新失败', 'error');
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [isSystemAccount, currentBaby, isRefreshing, setMoments, showToast]);
  
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
  
  // 筛选后的动态 - 根据账号类型选择数据源
  const filteredMoments = useMemo(() => {
    // 判断当前宝宝是否是 v2 账号
    const babyInfo = getCurrentBabyInfo();
    // 有两种情况用v2数据：1)没有普通宝宝 2)当前宝宝ID匹配v2账号ID
    const useV2Data = !currentBaby || (babyInfo && babyInfo.id === currentBaby.id);
    // 使用对应数据源
    const sourceMoments = useV2Data ? v2Moments : moments;
    let result = sourceMoments.filter(m => !m.isDeleted); // 排除已删除的记录
    
    if (selectedType) {
      result = result.filter(m => m.type === selectedType);
    }
    if (selectedMood) {
      result = result.filter(m => m.mood === selectedMood);
    }
    if (selectedMilestone) {
      result = result.filter(m => m.milestone === selectedMilestone);
    }
    
    return result;
  }, [v2Moments, moments, hasV2Baby, selectedType, selectedMood, selectedMilestone]);
  
  // 按年月分组 - 传入宝宝生日以显示相对时间
  const groupedMoments = useMemo(() => {
    // 获取宝宝生日或预产期
    const babyBirthDate = v2AccountInfo?.accountData?.birthDate || currentBaby?.birthDate;
    const babyDueDate = v2AccountInfo?.accountData?.dueDate || currentBaby?.dueDate;
    // 如果有出生日期用出生日期，否则用预产期
    const referenceDate = babyBirthDate || babyDueDate;
    return groupByYearAndMonth(filteredMoments, referenceDate);
  }, [filteredMoments, v2AccountInfo, currentBaby]);
  
  // 是否有激活的筛选条件
  const hasActiveFilters = useMemo(() => {
    return selectedType || selectedMood || selectedMilestone;
  }, [selectedType, selectedMood, selectedMilestone]);
  
  // 获取当前筛选条件的显示文本
  const getActiveFilterLabel = () => {
    const labels = [];
    if (selectedType) {
      const typeFilter = typeFilters.find(f => f.value === selectedType);
      if (typeFilter) labels.push(typeFilter.label);
    }
    if (selectedMood) {
      const moodFilter = moodFilters.find(f => f.value === selectedMood);
      if (moodFilter) labels.push(moodFilter.label);
    }
    if (selectedMilestone) {
      const milestoneFilter = milestoneFilters.find(f => f.value === selectedMilestone);
      if (milestoneFilter) labels.push(milestoneFilter.label);
    }
    return labels;
  };
  
  // 清除所有筛选
  const handleClearAllFilters = () => {
    setSelectedType('');
    setSelectedMood('');
    setSelectedMilestone('');
    onClearFilters?.();
  };
  
  // 删除动态 - 显示确认弹窗
  const handleDeleteMoment = useCallback((momentId) => {
    if (isSystemAccount) {
      showToast('系统账号不可删除', 'error');
      return;
    }
    
    // 获取动态内容用于显示
    const moment = v2Moments.find(m => m.id === momentId) || moments.find(m => m.id === momentId);
    const content = moment?.content?.substring(0, 30) || '这条记录';
    
    setDeleteConfirm({ show: true, momentId, momentContent: content });
  }, [isSystemAccount, v2Moments, moments]);
  
  // 执行删除（放入回收站）
  const executeDeleteToBin = useCallback(async () => {
    const { momentId } = deleteConfirm;
    if (!momentId) return;
    
    try {
      if (hasV2Baby) {
        // v2 账号：将动态标记为已删除（放入回收站）
        updateMomentInCurrentAccount(momentId, { 
          isDeleted: true, 
          deletedAt: new Date().toISOString() 
        });
        // 从列表中移除（显示上删除）
        setV2Moments(prev => prev.filter(m => m.id !== momentId));
        
        // 删除对应的联动内容（静默处理，不影响主流程）
        try {
          deleteLinkedContentByRecordId(momentId);
        } catch (e) {
          console.error('[Timeline] 删除联动内容失败:', e);
        }
      } else {
        // IndexedDB：使用软删除
        await deleteMoment(momentId);
        setMoments(prev => prev.filter(m => m.id !== momentId));
      }
      showToast('已放入回收站');
    } catch (error) {
      showToast('删除失败', 'error');
    } finally {
      setDeleteConfirm({ show: false, momentId: null, momentContent: '' });
    }
  }, [deleteConfirm, hasV2Baby, showToast]);
  
  // 执行永久删除
  const executePermanentDelete = useCallback(async () => {
    const { momentId } = deleteConfirm;
    if (!momentId) return;
    
    try {
      if (hasV2Baby) {
        // v2 账号：永久删除
        deleteMomentFromCurrentAccount(momentId);
        setV2Moments(prev => prev.filter(m => m.id !== momentId));
        
        // 删除对应的联动内容（静默处理，不影响主流程）
        try {
          deleteLinkedContentByRecordId(momentId);
        } catch (e) {
          console.error('[Timeline] 删除联动内容失败:', e);
        }
      } else {
        // IndexedDB：永久删除
        await deleteMoment(momentId);
        setMoments(prev => prev.filter(m => m.id !== momentId));
      }
      showToast('已永久删除');
    } catch (error) {
      showToast('删除失败', 'error');
    } finally {
      setDeleteConfirm({ show: false, momentId: null, momentContent: '' });
    }
  }, [deleteConfirm, hasV2Baby, showToast]);

  // 照片点击
  const handlePhotoClick = useCallback((photos, index) => {
    setSelectedPhotos(photos);
    setPhotoIndex(index);
  }, []);

  // 统计
  const totalCount = filteredMoments.length;
  const filteredCount = filteredMoments.length;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen pb-20 bg-cream-50 dark:bg-gray-900"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      {pullDistance > 0 && (
        <div className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2">
          {isRefreshing ? (
            <div className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
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
                {v2AccountInfo?.identityName || currentUser?.name || "📅 时光轴"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {/* 月龄神预言按钮 */}
              <button
                onClick={() => setShowPrediction(true)}
                className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-full transition-all shadow-sm border border-purple-100/50"
              >
                <span className="text-sm">✨</span>
                <span className="text-sm font-medium text-purple-600">月龄神预言</span>
              </button>
            </div>
          </div>
          
          <BabyHeader />
          
          {/* 筛选标签区域 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {getActiveFilterLabel().map((label, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-full text-sm"
                >
                  {label}
                  <button 
                    onClick={() => {
                      if (selectedType) setSelectedType('');
                      else if (selectedMood) setSelectedMood('');
                      else if (selectedMilestone) setSelectedMilestone('');
                      if (!selectedType && !selectedMood && !selectedMilestone) {
                        onClearFilters?.();
                      }
                    }}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button 
                onClick={handleClearAllFilters}
                className="px-3 py-1.5 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-colors"
              >
                清除全部
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* 筛选器 - 统一main容器 */}
      <main className="px-4 -mt-4 max-w-lg mx-auto">
        {/* 筛选器卡片 */}
        <div className="card mb-4">
          {/* 类型筛选 */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">类型多</span>
            <button
              onClick={() => setSelectedType('')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedType === ''
                  ? 'bg-primary-100 text-primary-600 font-medium'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {typeFilters.filter(f => f.value !== '').map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedType(filter.value)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                    selectedType === filter.value
                      ? 'bg-primary-100 text-primary-600 font-medium'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* 心情筛选 */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400 flex-shrink-0">心情好</span>
            <button
              onClick={() => setSelectedMood('')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedMood === ''
                  ? 'bg-amber-100 text-amber-600 font-medium'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {moodFilters.filter(f => f.value !== '').map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setSelectedMood(filter.value)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                    selectedMood === filter.value
                      ? 'bg-amber-100 text-amber-600 font-medium'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* 名场面筛选 */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-gray-400 flex-shrink-0">名场面</span>
            <button
              onClick={() => setSelectedMilestone('')}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 ${
                selectedMilestone === ''
                  ? 'bg-purple-100 text-purple-600 font-medium'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              全部
            </button>
            <div className="flex gap-1.5 overflow-x-auto hide-scrollbar">
              {milestoneFilters.filter(f => f.value !== '').slice(0, 3).map(filter => {
                const isSelected = selectedMilestone === filter.value;
                const color = filter.color || '#8B5CF6';
                const emoji = filter.emoji || '✨';
                return (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedMilestone(filter.value)}
                    className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors ${
                      isSelected ? 'font-medium' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                    style={isSelected ? { backgroundColor: color, color: 'white' } : {}}
                  >
                    {emoji} {filter.shortLabel || filter.label}
                  </button>
                );
              })}
            </div>
            {/* 更多按钮 - 滑到第3个后出现 */}
            {milestoneFilters.filter(f => f.value !== '').length > 3 && (
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setShowMilestoneDropdown(!showMilestoneDropdown)}
                  className={`px-2 py-1 rounded-full text-xs whitespace-nowrap transition-colors flex items-center gap-0.5 ${
                    selectedMilestone && !milestoneFilters.filter(f => f.value !== '').slice(0, 3).find(f => f.value === selectedMilestone)
                      ? 'font-medium'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  style={selectedMilestone && !milestoneFilters.filter(f => f.value !== '').slice(0, 3).find(f => f.value === selectedMilestone) ? {
                    backgroundColor: milestoneFilters.find(f => f.value === selectedMilestone)?.color || '#8B5CF6',
                    color: 'white',
                  } : {}}
                >
                  {selectedMilestone && !milestoneFilters.filter(f => f.value !== '').slice(0, 3).find(f => f.value === selectedMilestone)
                    ? `${milestoneFilters.find(f => f.value === selectedMilestone)?.emoji || '✨'} ${milestoneFilters.find(f => f.value === selectedMilestone)?.shortLabel || '更多'}`
                    : <>更多 <ChevronDown className="w-3 h-3" /></>
                  }
                </button>
                <div
                  className={`absolute top-full right-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-[100] min-w-[140px] ${showMilestoneDropdown ? '' : 'hidden'}`}
                >
                  {milestoneFilters.filter(f => f.value !== '').slice(3).map(filter => {
                    const isSelected = selectedMilestone === filter.value;
                    const color = filter.color || '#8B5CF6';
                    const emoji = filter.emoji || '✨';
                    return (
                      <button
                        key={filter.value}
                        onClick={() => {
                          setSelectedMilestone(filter.value);
                          setShowMilestoneDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'font-medium' : ''
                        }`}
                        style={isSelected ? { color } : {}}
                      >
                        <span>{emoji}</span>
                        <span>{filter.shortLabel || filter.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 时光轴内容 */}
        <div className="space-y-4">
        {/* 筛选结果统计 */}
        {hasActiveFilters && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              共找到 <span className="font-bold text-primary-500">{filteredCount}</span> 条记录
              {filteredCount !== totalCount && `（共 ${totalCount} 条）`}
            </p>
          </div>
        )}
        
        {groupedMoments.length === 0 ? (
          <div className="card text-center py-12 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 bg-cream-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {hasActiveFilters ? '暂无符合条件的记录' : (isSystemAccount ? '系统账号暂无记录' : '还没有记录哦')}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {hasActiveFilters 
                ? '试试调整筛选条件' 
                : (isSystemAccount 
                  ? '切换到自己的账号开始记录' 
                  : '点击右下角 + 按钮添加第一条记录')
              }
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-full text-sm hover:bg-primary-600 transition-colors"
              >
                清除筛选
              </button>
            )}
            {isSystemAccount && (
              <div className="mt-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl inline-block">
                <p className="text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  系统账号为示例数据，仅供浏览
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* 时间轴线 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-200 to-transparent" />
            
            {groupedMoments.map((group) => (
              <div key={`${group.year}-${group.month}`} className="relative mb-6">
                {/* 年月标签 - 显示相对时间或降级为日历日期 */}
                <div className="sticky top-0 z-10 py-2">
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-1.5 shadow-sm">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {group.relativeDisplay || `${group.year}年${group.month}月`}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {group.moments.length}条记录
                    </span>
                  </div>
                </div>
                
                {/* 动态列表 */}
                <div className="ml-10">
                  {group.moments.map((moment) => (
                    <div key={moment.id} className="relative">
                      <div className="absolute -left-8 top-4 w-3 h-3 rounded-full bg-white border-2 border-primary-400 shadow-sm" />
                      
                      <MomentCard
                        moment={moment}
                        onEdit={onEditMoment}
                        onDelete={handleDeleteMoment}
                        onClick={handlePhotoClick}
                        onShare={handleShareMoment}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </main>
      
      {/* 照片查看器 */}
      {selectedPhotos && (
        <PhotoViewer
          photos={selectedPhotos}
          initialIndex={photoIndex}
          onClose={() => setSelectedPhotos(null)}
        />
      )}

      {/* 分享卡片弹窗 */}
      <ShareCard
        visible={!!sharingMoment}
        onClose={() => setSharingMoment(null)}
        data={sharingMoment}
        title={sharingMoment?.milestoneLabel}
        content={sharingMoment?.content}
        babyName={currentBaby?.name || v2AccountInfo?.accountData?.name || '宝宝'}
        date={sharingMoment?.date}
        type={sharingMoment?.type}
        thumbnail={sharingMoment?.photos?.[0] || sharingMoment?.videos?.[0]?.cover}
        mood={sharingMoment?.mood}
        milestone={sharingMoment?.milestone}
      />

      {/* 添加记录按钮 - 系统账号禁用 */}
      {isSystemAccount ? (
        <div 
          className="fixed right-4 bottom-20 w-14 h-14 bg-gray-300 rounded-full shadow-lg flex items-center justify-center z-50 cursor-not-allowed"
          title="系统账号不可编辑"
        >
          <Lock className="w-6 h-6 text-gray-500" />
        </div>
      ) : (
        <button
          onClick={onAddMoment}
          className="fixed right-4 bottom-20 w-14 h-14 bg-gradient-to-br from-primary-500 to-warm-500 rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform hover:shadow-xl"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>
      )}
      
      {/* 删除确认弹窗 */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center mb-2">
              如何处理这条记录？
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-5">
              "{deleteConfirm.momentContent}..."
            </p>
            
            <div className="space-y-3">
              {/* 放入回收站 - 默认推荐 */}
              <button
                onClick={executeDeleteToBin}
                className="w-full py-3 px-4 bg-primary-50 dark:bg-primary-900/30 border-2 border-primary-500 rounded-xl flex items-center gap-3 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">放入回收站</div>
                  <div className="text-xs opacity-75">可在回收站恢复，30天后自动清理</div>
                </div>
              </button>
              
              {/* 永久删除 */}
              <button
                onClick={executePermanentDelete}
                className="w-full py-3 px-4 bg-red-50 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
              >
                <AlertTriangle className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">永久删除</div>
                  <div className="text-xs opacity-75">删除后无法恢复，请谨慎操作</div>
                </div>
              </button>
            </div>
            
            {/* 取消按钮 */}
            <button
              onClick={() => setDeleteConfirm({ show: false, momentId: null, momentContent: '' })}
              className="w-full mt-4 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      )}
      
      {/* 月龄神预言全屏页面 */}
      {showPrediction && (
        <PredictionPage onClose={() => setShowPrediction(false)} />
      )}

    </div>
  );
}
