/**
 * 个人中心页面
 * 优化版本：MusicPlayer折叠式、横向滚动宝宝卡片、设置抽屉、回收站入口
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { 
  Moon, Sun, Download, Upload, Trash2, ChevronRight, Heart, LogOut, User, 
  Palette, Tag, Edit3, Plus, X, Check, Image, Users, Trophy, Sparkles, Copy, Check as CheckIcon, Settings, ChevronDown
} from 'lucide-react';
import { exportAllData, importAllData, PRESET_AVATARS, generateInviteToken } from '../utils/db';
import { calculateAge } from '../utils/dateUtils';
import { MusicPlayer } from '../components/MusicPlayer';

// 主题预设配置
const THEME_PRESETS = [
  { id: 'pink', name: '默认粉橙', color: '#FF7B70', gradient: 'from-primary-400 to-primary-500' },
  { id: 'forest', name: '森林绿', color: '#34D399', gradient: 'from-emerald-400 to-emerald-500' },
  { id: 'ocean', name: '海洋蓝', color: '#60A5FA', gradient: 'from-blue-400 to-blue-500' },
  { id: 'lavender', name: '薰衣草紫', color: '#A78BFA', gradient: 'from-violet-400 to-violet-500' },
  { id: 'sunshine', name: '暖阳黄', color: '#FBBF24', gradient: 'from-amber-400 to-amber-500' },
];

// 里程碑emoji选项
const EMOJI_OPTIONS = ['⭐', '🌱', '💪', '📚', '✨', '🎈', '🎀', '🌟', '💫', '🌈', '☀️', '🌙', '❤️', '🎉', '👏', '🦋', '🌸', '🍀'];

export function ProfilePage({ onEditBaby, onAddBaby, onOpenRecycleBin }) {
  const navigate = useNavigate();
  const { 
    currentBaby, 
    babies,
    setBabies,
    setMoments,
    setCapsules,
    theme, 
    themePreset,
    customThemeColor,
    toggleTheme, 
    setTheme,
    showToast,
    currentUser,
    logout,
    updateUserProfile,
    customMilestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    getAllMilestones,
    switchBaby,
  } = useApp();
  
  const fileInputRef = useRef(null);
  const colorInputRef = useRef(null);
  
  // 状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState({ label: '', emoji: '⭐', color: '#FF7B70' });
  
  // 邀约打卡状态
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  
  // 设置面板抽屉状态
  const [showSettings, setShowSettings] = useState(false);
  
  // 音乐播放器折叠状态
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);
  
  // 个人资料编辑状态
  const [editProfile, setEditProfile] = useState({
    nickname: '',
    avatar: '',
    signature: ''
  });
  
  // 导入模式
  const [importMode, setImportMode] = useState('merge');
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);
  const containerRef = useRef(null);
  
  // 初始化编辑资料
  useEffect(() => {
    if (currentUser) {
      setEditProfile({
        nickname: currentUser.nickname || '',
        avatar: currentUser.avatar || '',
        signature: currentUser.signature || ''
      });
    }
  }, [currentUser]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const { getAllBabies, getMomentsByBaby, getCapsulesByBaby } = await import('../utils/db');
      const allBabies = await getAllBabies();
      setBabies(allBabies);
      
      if (currentBaby?.id) {
        const [updatedMoments, updatedCapsules] = await Promise.all([
          getMomentsByBaby(currentBaby.id),
          getCapsulesByBaby(currentBaby.id)
        ]);
        setMoments(updatedMoments);
        setCapsules(updatedCapsules);
      }
      
      showToast('已刷新');
    } catch (error) {
      showToast('刷新失败', 'error');
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [currentBaby, isRefreshing, setBabies, setMoments, setCapsules, showToast]);
  
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
  
  // 切换宝宝
  const handleSwitchBaby = async (babyId) => {
    await switchBaby(babyId);
    showToast('已切换宝宝档案');
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `babytime-backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('数据已导出');
    } catch (error) {
      showToast('导出失败: ' + error.message, 'error');
    }
  };

  // 导入数据
  const handleImport = async () => {
    if (!importFile) {
      showToast('请选择文件', 'error');
      return;
    }

    setIsImporting(true);
    try {
      const text = await importFile.text();
      const data = JSON.parse(text);
      await importAllData(data, importMode);
      showToast('数据导入成功');
      setShowImportModal(false);
      handleRefresh();
    } catch (error) {
      showToast('导入失败: ' + error.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  // 打开邀约
  const handleOpenInvite = () => {
    if (!currentBaby) {
      showToast('请先创建宝宝档案', 'error');
      return;
    }
    const token = generateInviteToken(currentBaby.id);
    const link = `${window.location.origin}/invite?babyId=${currentBaby.id}&token=${token}`;
    setInviteLink(link);
    setShowInviteModal(true);
  };

  // 复制链接
  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showToast('已复制链接');
  };

  // 保存资料
  const handleSaveProfile = async () => {
    try {
      await updateUserProfile(editProfile);
      showToast('资料已更新');
      setShowProfileModal(false);
    } catch (error) {
      showToast('保存失败', 'error');
    }
  };

  // 保存里程碑
  const handleSaveMilestone = async () => {
    if (!milestoneForm.label.trim()) {
      showToast('请输入标签名称', 'error');
      return;
    }
    
    try {
      if (editingMilestone) {
        await updateMilestone(editingMilestone.id, milestoneForm);
        showToast('已更新');
      } else {
        await addMilestone(milestoneForm);
        showToast('已添加');
      }
      setShowMilestoneModal(false);
      setEditingMilestone(null);
      setMilestoneForm({ label: '', emoji: '⭐', color: '#FF7B70' });
    } catch (error) {
      showToast('保存失败', 'error');
    }
  };

  // 删除里程碑
  const handleDeleteMilestone = async (id) => {
    try {
      await deleteMilestone(id);
      showToast('已删除');
    } catch (error) {
      showToast('删除失败', 'error');
    }
  };

  // 登出
  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const allMilestones = getAllMilestones();

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
      
      {/* 头部 - 优化：设置按钮和头像在右侧 */}
      <header className="bg-gradient-to-b from-primary-400 to-primary-500 text-white safe-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold">👤 我的</h1>
            <div className="flex items-center gap-2">
              {/* 设置按钮 */}
              <button
                onClick={() => setShowSettings(true)}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              {/* 头像 */}
              <div 
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl overflow-hidden cursor-pointer"
                onClick={() => setShowProfileModal(true)}
              >
                {currentUser?.avatar ? (
                  currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http') ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.avatar}</span>
                  )
                ) : (
                  <User className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          </div>
          
          {/* 用户信息 */}
          <div 
            className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm cursor-pointer hover:bg-white/15 transition-colors"
            onClick={() => setShowProfileModal(true)}
          >
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl overflow-hidden">
                {currentUser?.avatar ? (
                  currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http') ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.avatar}</span>
                  )
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="font-bold">{currentUser?.nickname || currentUser?.username || '用户'}</h2>
                {currentUser?.signature && (
                  <p className="text-sm text-white/70 mt-0.5">{currentUser.signature}</p>
                )}
              </div>
              <ChevronRight className="w-5 h-5 text-white/60" />
            </div>
          </div>
          
          {/* 宝宝信息 - 横向滚动卡片 */}
          <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-2 -mx-4 px-4">
            {/* 当前宝宝卡片 */}
            {currentBaby && (
              <div 
                className="flex-shrink-0 w-28 bg-white/20 rounded-2xl p-3 backdrop-blur-sm cursor-pointer hover:bg-white/25 transition-all active:scale-95"
                onClick={() => onEditBaby(currentBaby)}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/10 mb-2">
                  {currentBaby.avatar ? (
                    <img src={currentBaby.avatar} alt={currentBaby.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      👶
                    </div>
                  )}
                </div>
                <p className="text-white text-sm font-bold text-center truncate">{currentBaby.nickname || currentBaby.name}</p>
                <p className="text-white/70 text-xs text-center">{calculateAge(currentBaby.birthDate)}</p>
              </div>
            )}
            
            {/* 其他宝宝卡片 */}
            {babies.filter(b => b.id !== currentBaby?.id).map(baby => (
              <div 
                key={baby.id}
                className="flex-shrink-0 w-28 bg-white/10 rounded-2xl p-3 backdrop-blur-sm cursor-pointer hover:bg-white/15 transition-all active:scale-95"
                onClick={() => handleSwitchBaby(baby.id)}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-white/10 mb-2">
                  {baby.avatar ? (
                    <img src={baby.avatar} alt={baby.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      👶
                    </div>
                  )}
                </div>
                <p className="text-white text-sm font-bold text-center truncate">{baby.nickname || baby.name}</p>
                <p className="text-white/70 text-xs text-center">{calculateAge(baby.birthDate)}</p>
              </div>
            ))}
            
            {/* 添加宝宝卡片 */}
            <button
              onClick={onAddBaby}
              className="flex-shrink-0 w-28 h-36 bg-white/10 rounded-2xl border-2 border-dashed border-white/30 flex flex-col items-center justify-center gap-1 hover:bg-white/15 transition-all active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/80 text-xs">添加宝宝</span>
            </button>
          </div>
        </div>
      </header>
      
      {/* 功能列表 */}
      <main className="px-4 -mt-4 max-w-lg mx-auto">

        {/* 音乐播放器卡片 - 折叠式 */}
        <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <button
            onClick={() => setShowMusicPlayer(!showMusicPlayer)}
            className="w-full flex items-center justify-between"
          >
            <h3 className="font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              🎵 背景音乐
            </h3>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showMusicPlayer ? 'rotate-180' : ''}`} />
          </button>
          {showMusicPlayer && (
            <div className="mt-3 animate-fade-in">
              <MusicPlayer />
            </div>
          )}
        </div>
        
        {/* 邀约打卡 */}
        <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.03s' }}>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            邀约打卡
          </h3>
          
          {/* 生成邀请链接 */}
          <button
            onClick={handleOpenInvite}
            className="w-full flex items-center justify-between py-3 hover:bg-cream-50 dark:hover:bg-gray-700 -mx-4 px-4 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">🔗</span>
              <span className="text-gray-700 dark:text-gray-200">生成邀请链接</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* 数据管理 */}
        <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.06s' }}>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            数据管理
          </h3>
          
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-between py-3 hover:bg-cream-50 dark:hover:bg-gray-700 -mx-4 px-4 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Download className="w-5 h-5 text-primary-500" />
              <span className="text-gray-700 dark:text-gray-200">导出数据</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="w-full flex items-center justify-between py-3 hover:bg-cream-50 dark:hover:bg-gray-700 -mx-4 px-4 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Upload className="w-5 h-5 text-primary-500" />
              <span className="text-gray-700 dark:text-gray-200">导入数据</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
          
          <button
            onClick={() => onOpenRecycleBin?.()}
            className="w-full flex items-center justify-between py-3 hover:bg-cream-50 dark:hover:bg-gray-700 -mx-4 px-4 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-200">回收站</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* 外观设置 */}
        <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.09s' }}>
          <h3 className="font-medium text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            外观设置
          </h3>
          
          <button
            onClick={() => setShowThemeModal(true)}
            className="w-full flex items-center justify-between py-3 hover:bg-cream-50 dark:hover:bg-gray-700 -mx-4 px-4 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <span className="text-gray-700 dark:text-gray-200">
                {theme === 'dark' ? '深色模式' : '浅色模式'}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        {/* 账号 */}
        <div className="card mb-4 animate-fade-in" style={{ animationDelay: '0.12s' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between py-3 hover:bg-red-50 dark:hover:bg-red-900/20 -mx-4 px-4 rounded-xl transition-colors group"
          >
            <div className="flex items-center gap-3">
              <LogOut className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
              <span className="text-gray-700 dark:text-gray-200 group-hover:text-red-500">退出登录</span>
            </div>
          </button>
        </div>
      </main>

      {/* 设置面板抽屉 */}
      {showSettings && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          onClick={() => setShowSettings(false)}
        >
          <div 
            className="absolute right-0 top-0 bottom-0 w-80 max-w-full bg-white dark:bg-gray-800 shadow-xl animate-slide-in-right overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-cream-100 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-800 dark:text-white">设置</h2>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 -mr-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* 主题切换 */}
              <div className="flex items-center justify-between">
                <span className="text-gray-700 dark:text-gray-200">深色模式</span>
                <button
                  onClick={toggleTheme}
                  className={`w-12 h-7 rounded-full transition-colors ${theme === 'dark' ? 'bg-primary-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              {/* 回收站入口 */}
              <button
                onClick={() => {
                  setShowSettings(false);
                  onOpenRecycleBin?.();
                }}
                className="w-full flex items-center gap-3 py-3 text-gray-700 dark:text-gray-200 hover:bg-cream-50 dark:hover:bg-gray-700 rounded-xl px-3 -mx-3"
              >
                <Trash2 className="w-5 h-5 text-gray-400" />
                回收站
              </button>
              
              {/* 版本信息 */}
              <div className="pt-4 border-t border-cream-100 dark:border-gray-700">
                <p className="text-xs text-gray-400 text-center">宝贝时光 v1.0</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主题选择模态框 */}
      {showThemeModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowThemeModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">选择主题</h3>
            
            <div className="space-y-2 mb-4">
              {THEME_PRESETS.map(preset => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setTheme(preset.id);
                    showToast('主题已切换');
                    setShowThemeModal(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                    themePreset === preset.id ? 'bg-primary-50 dark:bg-primary-900/20 ring-2 ring-primary-500' : 'hover:bg-cream-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <div 
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${preset.gradient}`}
                  />
                  <span className="text-gray-700 dark:text-gray-200">{preset.name}</span>
                  {themePreset === preset.id && <Check className="w-5 h-5 text-primary-500 ml-auto" />}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => {
                toggleTheme();
                showToast(`已切换到${theme === 'dark' ? '浅色' : '深色'}模式`);
                setShowThemeModal(false);
              }}
              className="w-full py-3 bg-cream-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-cream-200 dark:hover:bg-gray-600 transition-colors"
            >
              {theme === 'dark' ? '☀️ 切换到浅色模式' : '🌙 切换到深色模式'}
            </button>
            
            <button
              onClick={() => setShowThemeModal(false)}
              className="w-full mt-3 py-2 text-gray-500"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 导入数据模态框 */}
      {showImportModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImportModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">导入数据</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                选择JSON文件
              </label>
              <input
                type="file"
                accept=".json"
                onChange={e => setImportFile(e.target.files?.[0])}
                className="w-full px-4 py-3 border border-cream-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                导入模式
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    importMode === 'merge' ? 'bg-primary-500 text-white' : 'bg-cream-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  合并
                </button>
                <button
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 py-2 rounded-lg transition-colors ${
                    importMode === 'replace' ? 'bg-primary-500 text-white' : 'bg-cream-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  覆盖
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                合并：保留现有数据，导入数据追加；覆盖：清空现有数据后导入
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 py-3 bg-cream-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl disabled:opacity-50"
              >
                {isImporting ? '导入中...' : '确认导入'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 个人资料模态框 */}
      {showProfileModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowProfileModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">编辑资料</h3>
            
            {/* 头像选择 */}
            <div className="text-center mb-4">
              <div className="relative inline-block mb-3">
                <div className="w-20 h-20 rounded-full bg-cream-100 dark:bg-gray-700 flex items-center justify-center text-3xl overflow-hidden border-4 border-primary-200">
                  {editProfile.avatar ? (
                    editProfile.avatar.startsWith('data:') || editProfile.avatar.startsWith('http') ? (
                      <img src={editProfile.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span>{editProfile.avatar}</span>
                    )
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const randomAvatar = PRESET_AVATARS[Math.floor(Math.random() * PRESET_AVATARS.length)];
                    setEditProfile(prev => ({ ...prev, avatar: randomAvatar }));
                  }}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg"
                >
                  🎲
                </button>
              </div>
              
              <div className="grid grid-cols-6 gap-2">
                {PRESET_AVATARS.slice(0, 12).map((a, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setEditProfile(prev => ({ ...prev, avatar: a }))}
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all ${
                      editProfile.avatar === a ? 'bg-primary-100 ring-2 ring-primary-500' : 'bg-cream-100 dark:bg-gray-700'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">昵称</label>
                <input
                  type="text"
                  value={editProfile.nickname}
                  onChange={e => setEditProfile(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-4 py-3 border border-cream-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="输入昵称"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">个性签名</label>
                <input
                  type="text"
                  value={editProfile.signature}
                  onChange={e => setEditProfile(prev => ({ ...prev, signature: e.target.value }))}
                  className="w-full px-4 py-3 border border-cream-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                  placeholder="输入个性签名"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 py-3 bg-cream-100 dark:bg-gray-700 rounded-xl text-gray-700 dark:text-gray-200"
              >
                取消
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex-1 py-3 bg-primary-500 text-white rounded-xl"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 邀约打卡模态框 */}
      {showInviteModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowInviteModal(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">邀约打卡</h3>
            
            <p className="text-sm text-gray-500 mb-4">
              分享链接给家人朋友，让他们可以为 {currentBaby?.nickname || currentBaby?.name} 打卡~
            </p>
            
            <div className="p-3 bg-cream-50 dark:bg-gray-700 rounded-xl break-all text-sm text-gray-600 dark:text-gray-300 mb-4">
              {inviteLink}
            </div>
            
            <button
              onClick={handleCopyLink}
              className="w-full py-3 bg-primary-500 text-white rounded-xl flex items-center justify-center gap-2"
            >
              {copied ? <CheckIcon className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              {copied ? '已复制' : '复制链接'}
            </button>
            
            <button
              onClick={() => setShowInviteModal(false)}
              className="w-full mt-3 py-2 text-gray-500"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
