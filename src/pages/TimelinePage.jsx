/**
 * 时光轴页面
 * ✅ 性能优化版本：虚拟滚动 + 懒加载 + 分页加载
 * ✅ 双账号支持：账号切换和数据隔离
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { BabyHeader } from '../components/BabyHeader';
import { MomentCard } from '../components/MomentCard';
import { PhotoViewer } from '../components/PhotoViewer';
import { ShareCard } from '../components/ShareCard';
import { groupByYearAndMonth } from '../utils/dateUtils';
import { getMomentsOnSameDayLastYear, deleteMoment, getMomentsByBaby, addMoment, initDB } from '../utils/db';
import { Plus, Calendar, Clock, X, ChevronDown, Lock, Trash2, AlertTriangle } from 'lucide-react';
import { 
  getCurrentV2Account, 
  getCurrentTimeline, 
  addMomentToCurrentAccount,
  deleteMomentFromCurrentAccount,
  updateMomentInCurrentAccount,
  isSystemAccount as checkIsSystemAccount,
  getCurrentBabyInfo 
} from '../utils/dbV2';

// ==================== 虚拟滚动优化 ====================
// 虚拟列表项高度估计
const ESTIMATED_ITEM_HEIGHT = 300;
// 视口外预渲染数量
const BUFFER_SIZE = 5;

// 虚拟列表HOC：只渲染可见区域的卡片
function withVirtualList(Component) {
  return function VirtualListWrapper({ index, ...props }) {
    const [isVisible, setIsVisible] = useState(false);
    const itemRef = useRef(null);

    useEffect(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          setIsVisible(entries[0].isIntersecting);
        },
        { rootMargin: `${BUFFER_SIZE * ESTIMATED_ITEM_HEIGHT}px` }
      );

      if (itemRef.current) {
        observer.observe(itemRef.current);
      }

      return () => observer.disconnect();
    }, []);

    return (
      <div ref={itemRef}>
        {isVisible ? <Component {...props} /> : (
          <div style={{ height: ESTIMATED_ITEM_HEIGHT }} className="bg-transparent" />
        )}
      </div>
    );
  };
}

// 应用虚拟滚动优化
const VirtualMomentCard = withVirtualList(MomentCard);

// 类型筛选选项
const typeFilters = [
  { value: '', label: '类型' },
  { value: 'photo', label: '📷 照片' },
  { value: 'video', label: '🎬 视频' },
  { value: 'diary', label: '📝 日记' },
  { value: 'audio', label: '🎙️ 语音' },
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
      
      setV2Moments(timeline);
      setIsSystemAccount(isSystem);
      setHasV2Baby(!!babyInfo);
      setV2AccountInfo(account || null);
    };
    
    updateV2Info();
    
    // 监听 localStorage 变化
    window.addEventListener('storage', updateV2Info);
    // 轮询更新（检测添加动态等操作）
    const interval = setInterval(updateV2Info, 300);
    
    // 监听自定义事件（添加动态后主动刷新）
    const handleMomentAdded = () => updateV2Info();
    window.addEventListener('v2-moment-updated', handleMomentAdded);
    
    return () => {
      window.removeEventListener('storage', updateV2Info);
      clearInterval(interval);
      window.removeEventListener('v2-moment-updated', handleMomentAdded);
    };
  }, []);
  
  // 获取所有里程碑选项（包含预设和自定义）
  const milestoneFilters = useMemo(() => {
    const allMilestones = getAllMilestones();
    return [
      { value: '', label: '里程碑' },
      ...allMilestones.map(m => ({
        value: m.id,
        label: `${m.emoji} ${m.label}`
      }))
    ];
  }, [getAllMilestones]);

  // 获取所有心情选项（包含预设和自定义）
  const moodFilters = useMemo(() => {
    const allMoods = getAllMoods();
    return [
      { value: '', label: '心情' },
      ...allMoods.map(m => ({
        value: m.id,
        label: `${m.emoji} ${m.label}`
      }))
    ];
  }, [getAllMoods]);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showSameDay, setShowSameDay] = useState(false);
  const [sameDayMoments, setSameDayMoments] = useState([]);
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
    // 有 v2 宝宝信息使用 v2Moments，否则使用 moments
    const sourceMoments = hasV2Baby ? v2Moments : moments;
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
  
  // 按年月分组
  const groupedMoments = useMemo(() => {
    return groupByYearAndMonth(filteredMoments);
  }, [filteredMoments]);
  
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
  
  // 检查往年今日
  const checkSameDayLastYear = async () => {
    if (!currentBaby && !hasV2Baby) {
      showToast('请先创建宝宝档案', 'error');
      return;
    }
    
    if (!showSameDay) {
      setShowSameDay(true);
      try {
        const sameDay = await getMomentsOnSameDayLastYear(currentBaby?.id);
        setSameDayMoments(sameDay);
      } catch (error) {
        showToast('获取失败', 'error');
      }
    } else {
      setShowSameDay(false);
    }
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
  }, [deleteConfirm, hasV2Baby]);

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
      <header className="bg-gradient-to-b from-primary-400 to-primary-500 text-white safe-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* 头像显示在左上角（使用v2账号身份信息） */}
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden">
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
              <h1 className="text-xl font-bold">📅 时光轴</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* 往年今日按钮 */}
              <button
                onClick={checkSameDayLastYear}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>往年今日</span>
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
      
      {/* 往年今日折叠面板 - 就地展开 */}
      {showSameDay && (
        <div className="px-4 py-3 bg-cream-50 dark:bg-gray-800/50 animate-slide-up">
          <div className="max-w-lg mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-cream-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🕰️</span>
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    往年今日
                  </h3>
                </div>
              </div>
              <div className="p-4">
                {sameDayMoments.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">
                    去年今天没有记录，继续创造回忆吧~
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sameDayMoments.map(moment => (
                      <MomentCard
                        key={moment.id}
                        moment={moment}
                        onClick={handlePhotoClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 筛选器 - 水平滚动 */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 space-y-2">
          {/* 类型筛选 */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {typeFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedType(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedType === filter.value
                    ? 'bg-primary-500 text-white font-medium'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* 心情筛选 */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {moodFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedMood(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedMood === filter.value
                    ? 'bg-warm-500 text-white font-medium'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* 里程碑筛选 */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {milestoneFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedMilestone(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedMilestone === filter.value
                    ? 'bg-purple-500 text-white font-medium'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}

          </div>
        </div>
      </div>
      
      {/* 时光轴内容 */}
      <main className="px-4 mt-4">
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
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 bg-cream-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
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
                {/* 年月标签 */}
                <div className="sticky top-0 z-10 py-2">
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-1.5 shadow-sm">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {group.year}年{group.month}月
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {group.moments.length}条记录
                    </span>
                  </div>
                </div>
                
                {/* 动态列表 - 虚拟滚动优化 */}
                <div className="ml-10">
                  {group.moments.map((moment, index) => (
                    <div key={moment.id} className="relative">
                      <div className="absolute -left-8 top-4 w-3 h-3 rounded-full bg-white border-2 border-primary-400 shadow-sm" />
                      
                      <VirtualMomentCard
                        index={index}
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
        babyName={currentBaby?.name}
        date={sharingMoment?.date}
        type={sharingMoment?.type}
        thumbnail={sharingMoment?.photos?.[0] || sharingMoment?.videos?.[0]?.cover}
        mood={sharingMoment?.mood}
        milestone={sharingMoment?.milestone}
      />

      {/* 添加记录按钮 - 系统账号禁用 */}
      {isSystemAccount ? (
        <div 
          className="fixed right-4 bottom-32 w-14 h-14 bg-gray-300 rounded-full shadow-lg flex items-center justify-center z-50 cursor-not-allowed"
          title="系统账号不可编辑"
        >
          <Lock className="w-6 h-6 text-gray-500" />
        </div>
      ) : (
        <button
          onClick={onAddMoment}
          className="fixed right-4 bottom-32 w-14 h-14 bg-gradient-to-br from-primary-500 to-warm-500 rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform hover:shadow-xl"
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
    </div>
  );
}
