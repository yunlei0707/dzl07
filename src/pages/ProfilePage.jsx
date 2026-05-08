/**
 * 个人中心页面
 * 优化版本：MusicPlayer折叠式、横向滚动宝宝卡片、设置抽屉、回收站入口
 */

import 
{ useState, useRef, useCallback, useEffect } from 'react';
import 
{ useNavigate } from 'react-router-dom';
import 
{ useApp } from '../store/AppContext';
import 
{ 
  Moon, Sun, Download, Upload, Trash2, ChevronRight, Heart, LogOut, User, 
  Palette, Tag, Tags, Edit3, Plus, X, Check, Image, Users, Trophy, Sparkles, Copy, Check as CheckIcon, ChevronDown, Database,
  HelpCircle, Shield, FileText, Info, RotateCcw
} from 'lucide-react';
import 
{ exportAllData, importAllData, clearAllData, PRESET_AVATARS, getAllBabies, getMomentsByBaby, getCapsulesByBaby, addMoment, deleteBaby } from '../utils/db';
import { exportV2AccountData, importV2AccountData, isSystemAccount } from '../utils/dbV2';
import 
{ calculateAge } from '../utils/dateUtils';
import 
{ BabyHeader } from '../components/BabyHeader';
import 
{ getCurrentV2Account, getCurrentBabyInfo, isSystemAccount as checkIsSystemAccount, addMomentToCurrentAccount } from '../utils/dbV2';
import { isInApp, exportToFile, importFromFile } from '../utils/jsBridge';
import { sampleTemplates, ageGroups, getBabyAgeGroup, getTypeEmoji, getMoodEmoji, getWeatherEmoji } from '../data/sampleTemplates';

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

export function ProfilePage(
{ onEditBaby, onAddBaby, onOpenRecycleBin, onOpenCapsules }) 
{
  const navigate = useNavigate();
  const 
{ 
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
    refreshBabies,
    updateUserProfile,
    customMilestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
    switchBaby,
    deleteBaby,
    customMoods,
    addMood,
    updateMood,
    deleteMood,
    refreshMoments,
    refreshCapsules,
  } = useApp();
  
  const fileInputRef = useRef(null);
  const colorInputRef = useRef(null);
  const containerRef = useRef(null);
  
  // 状态
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState('');
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState(null);
  const [milestoneForm, setMilestoneForm] = useState(
{ label: '', emoji: '⭐', color: '#FF7B70' });
  
  // 心情标签管理状态
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [editingMood, setEditingMood] = useState(null);
  const [moodForm, setMoodForm] = useState(
{ label: '', emoji: '😊' });
  
  // 设置面板抽屉状态 - 已移除，内容整合到主体菜单
  
  // 导入模式
  const [importMode, setImportMode] = useState('merge');
  const [importFile, setImportFile] = useState(null);
  const [importText, setImportText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  
  // 导入示例数据 - 模板选择流程
  const [isImportingSample, setIsImportingSample] = useState(false);
  const [showTagGroup, setShowTagGroup] = useState(false);
  
  // 分组折叠状态 - 数据管理和"其他"默认折叠
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showOther, setShowOther] = useState(false);
  
  // 示例数据模板选择流程状态
  const [sampleStep, setSampleStep] = useState(null); // null | 'age' | 'template' | 'edit'
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedMoments, setEditedMoments] = useState([]); // 编辑中的记录列表
  const [editingContent, setEditingContent] = useState(null); // 当前编辑的记录ID
  
  // v2 账号系统状态
  const [v2AccountInfo, setV2AccountInfo] = useState(null);
  const [hasV2Baby, setHasV2Baby] = useState(false);
  
  // 监听账号切换
  useEffect(() => 
{
    const updateV2Info = () => 
{
      const account = getCurrentV2Account();
      const babyInfo = getCurrentBabyInfo();
      setV2AccountInfo(account || null);
      setHasV2Baby(!!babyInfo);
    };
    
    updateV2Info();
    
    // 监听 localStorage 变化
    window.addEventListener('storage', updateV2Info);
    // 轮询更新
    const interval = setInterval(updateV2Info, 500);
    
    return () => 
{
      window.removeEventListener('storage', updateV2Info);
      clearInterval(interval);
    };
  }, []);
  
  // 检查是否为系统账号
  const isSystemAccount = v2AccountInfo?.isSystem === true;
  
  const generateWaveform = useCallback(() => 
{
    return Array(32).fill(0).map(() => Array(6).fill(0).map(() => Math.random() * 255));
  }, []);
  
  // 导入示例数据 - 启动模板选择流程
  const handleImportSampleData = useCallback(() => {
    if (!currentBaby && !hasV2Baby) return;
    // 根据宝宝生日计算推荐月龄
    const babyBirthDate = v2AccountInfo?.accountData?.birthDate || currentBaby?.birthDate;
    const recommendedAge = getBabyAgeGroup(babyBirthDate);
    setSelectedAge(recommendedAge);
    setSampleStep('age');
  }, [currentBaby, hasV2Baby, v2AccountInfo]);

  // 选择月龄
  const handleSelectAge = useCallback((age) => {
    setSelectedAge(age);
    setSelectedTemplate(null);
    setSampleStep('template');
  }, []);

  // 选择模板
  const handleSelectTemplate = useCallback((template) => {
    setSelectedTemplate(template);
    // 深拷贝模板数据用于编辑
    setEditedMoments(template.moments.map(m => ({ ...m })));
    setSampleStep('edit');
  }, []);

  // 删除记录
  const handleDeleteMoment = useCallback((index) => {
    setEditedMoments(prev => prev.filter((_, i) => i !== index));
  }, []);

  // 更新记录内容
  const handleUpdateContent = useCallback((index, content) => {
    setEditedMoments(prev => prev.map((m, i) => i === index ? { ...m, content } : m));
  }, []);

  // 替换记录图片
  const handleReplaceImage = useCallback((index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target.result;
        setEditedMoments(prev => prev.map((m, i) => {
          if (i !== index) return m;
          return { ...m, photos: [dataUrl] };
        }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, []);

  // 删除记录图片
  const handleRemoveImage = useCallback((index) => {
    setEditedMoments(prev => prev.map((m, i) => {
      if (i !== index) return m;
      const updated = { ...m };
      delete updated.photos;
      return updated;
    }));
  }, []);

  // 执行导入
  const executeImport = useCallback(async () => {
    if (!editedMoments.length || isImportingSample) return;
    
    setIsImportingSample(true);
    try {
      const now = new Date();
      const babyInfo = getCurrentBabyInfo();
      const isV2 = !!babyInfo;
      
      for (const moment of editedMoments) {
        const date = new Date(now.getTime() - moment.daysAgo * 24 * 60 * 60 * 1000);
        const data = { 
          ...moment, 
          date: date.toISOString(),
          photos: moment.photos ? [...moment.photos] : undefined,
          videos: moment.videos ? [...moment.videos] : undefined,
          audios: moment.audios ? [...moment.audios] : undefined,
        };
        delete data.daysAgo;
        
        if (isV2) {
          addMomentToCurrentAccount(data);
        } else {
          await addMoment({ babyId: currentBaby.id, ...data });
        }
      }
      
      showToast(`已导入${editedMoments.length}条示例数据，正在刷新...`, 'success');
      
      // 重置状态
      setSampleStep(null);
      setSelectedAge(null);
      setSelectedTemplate(null);
      setEditedMoments([]);
      
      setTimeout(() => window.location.reload(), 500);
    } catch (error) {
      console.error('导入示例数据失败:', error);
      showToast('导入失败', 'error');
    } finally {
      setIsImportingSample(false);
    }
  }, [editedMoments, isImportingSample, currentBaby, showToast]);

  // 重置模板选择流程
  const resetSampleSelection = useCallback(() => {
    setSampleStep(null);
    setSelectedAge(null);
    setSelectedTemplate(null);
    setEditedMoments([]);
    setEditingContent(null);
  }, []);

  // 步骤返回
  const handleSampleStepBack = useCallback(() => {
    if (sampleStep === 'edit') {
      setSampleStep('template');
      setEditedMoments([]);
    } else if (sampleStep === 'template') {
      setSampleStep('age');
      setSelectedTemplate(null);
    } else {
      resetSampleSelection();
    }
  }, [sampleStep, resetSampleSelection]);

  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);
  
  // 刷新数据
  const refreshData = useCallback(async () => 
{
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try 
{
      // 调用全局store的刷新方法，这样所有页面都能看到更新
      await refreshBabies();
      
      if (currentBaby?.id) 
{
        await Promise.all([
          refreshMoments(currentBaby.id),
          refreshCapsules(currentBaby.id)
        ]);
      }
      
      showToast('刷新成功', 'success');
    } catch (error) 
{
      console.error('刷新数据失败:', error);
      showToast('刷新失败', 'error');
    } finally 
{
      setIsRefreshing(false);
    }
  }, [currentBaby, isRefreshing, refreshBabies, refreshMoments, refreshCapsules, showToast]);
  
  // 下拉刷新处理
  const handleTouchStart = useCallback((e) => 
{
    if (containerRef.current) 
{
      scrollTop.current = containerRef.current.scrollTop;
      touchStartY.current = e.touches[0].clientY;
    }
  }, []);
  
  const handleTouchMove = useCallback((e) => 
{
    if (isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    if (scrollTop.current <= 0 && diff > 0) 
{
      const dampenedDiff = Math.min(diff * 0.5, 80);
      setPullDistance(dampenedDiff);
      e.preventDefault();
    }
  }, [isRefreshing]);
  
  const handleTouchEnd = useCallback(() => 
{
    if (pullDistance > 50) 
{
      refreshData();
    }
    setPullDistance(0);
  }, [pullDistance, refreshData]);
  
  // 导出数据
  const handleExport = useCallback(async () => 
{
    try 
{
      const idbData = await exportAllData();
      const v2Data = exportV2AccountData();
      // 合并两份数据
      const mergedData = {
        ...idbData,
        v2AccountData: v2Data,
      };
      const jsonStr = JSON.stringify(mergedData, null, 2);
      setExportData(jsonStr);
      setShowExportModal(true);
      
      // APP环境下自动保存并分享
      if (isInApp()) {
        try {
          await exportToFile(jsonStr);
        } catch (e) {
          // 静默失败，不影响原有导出流程
          console.log('APP文件分享失败，将使用传统方式');
        }
      }
    } catch (error) 
{
      console.error('导出失败:', error);
      showToast('导出失败', 'error');
    }
  }, []);
  
  // 复制到剪贴板
  const handleCopyToClipboard = useCallback(async () => 
{
    try {
      await navigator.clipboard.writeText(exportData);
      showToast('已复制到剪贴板！可粘贴到备忘录保存', 'success');
    } catch (e) {
      // 备用方案：创建临时textarea
      const textarea = document.createElement('textarea');
      textarea.value = exportData;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        showToast('已复制到剪贴板！可粘贴到备忘录保存', 'success');
      } catch (e2) {
        showToast('复制失败，请手动选中下方文本复制', 'warning');
      }
      document.body.removeChild(textarea);
    }
  }, [exportData, showToast]);
  
  // 下载文件
  const handleDownloadFile = useCallback(() => 
{
    const blob = new Blob([exportData], 
{ type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `宝贝时光备份_$
{new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('文件已下载', 'success');
  }, [exportData, showToast]);
  
  // 导入数据
  const handleImport = useCallback(async () => 
{
    // 支持两种方式：文件选择 或 剪贴板粘贴
    // APP环境下同样支持，不做阻断
    let data;
    if (importText.trim()) {
      // 方式1：从剪贴板粘贴的文本
      try {
        data = JSON.parse(importText.trim());
      } catch (e) {
        showToast('粘贴的数据格式错误，请检查', 'error');
        return;
      }
    } else if (importFile) {
      // 方式2：从文件选择
      try {
        const text = await importFile.text();
        data = JSON.parse(text);
      } catch (e) {
        showToast('文件格式错误', 'error');
        return;
      }
    } else {
      showToast('请先选择备份文件或粘贴备份数据', 'warning');
      return;
    }
    
    setIsImporting(true);
    try 
{
      // 导入 IndexedDB 数据
      await importAllData(data, importMode);
      
      // 如果包含 v2 账号数据，也导入
      if (data.v2AccountData) {
        importV2AccountData(data.v2AccountData, importMode);
      }
      
      showToast('导入成功，正在刷新...', 'success');
      setShowImportModal(false);
      setImportText('');
      setImportFile(null);
      // 延迟刷新页面，确保toast提示能显示
      setTimeout(() => window.location.reload(), 500);
    } catch (error) 
{
      console.error('导入失败:', error);
      const errorMsg = error?.message || error?.toString() || '未知错误';
      showToast('导入失败: ' + errorMsg, 'error');
    } finally 
{
      setIsImporting(false);
    }
  }, [importFile, importText, importMode, showToast, refreshData]);
  
  
  // 退出登录
  const handleLogout = useCallback(() => 
{
    logout();
    navigate('/login');
  }, [logout, navigate]);
  
  // 清除缓存
  const handleClearCache = useCallback(async () => 
{
    try {
      await clearAllData();
      localStorage.setItem('lastDataUpdate', Date.now().toString());
      showToast('缓存已清除', 'success');
      setShowClearConfirm(false);
      // 刷新页面，回到登录页
      window.location.reload();
    } catch (error) {
      console.error('清除缓存失败:', error);
      showToast('清除失败', 'error');
    }
  }, [showToast]);
  
  // 保存里程碑
  const handleSaveMilestone = useCallback(async () => 
{
    try 
{
      if (editingMilestone) 
{
        await updateMilestone(editingMilestone.id, milestoneForm);
        showToast('更新成功', 'success');
      } else 
{
        await addMilestone(milestoneForm);
        showToast('添加成功', 'success');
      }
      setShowMilestoneModal(false);
      setEditingMilestone(null);
      setMilestoneForm(
{ label: '', emoji: '⭐', color: '#FF7B70' });
    } catch (error) 
{
      console.error('保存失败:', error);
      showToast('保存失败', 'error');
    }
  }, [editingMilestone, milestoneForm, addMilestone, updateMilestone, showToast]);

  // 保存心情标签
  const handleSaveMood = useCallback(async () => 
{
    try 
{
      if (editingMood) 
{
        await updateMood(editingMood.id, moodForm);
        showToast('更新成功', 'success');
      } else 
{
        await addMood(moodForm);
        showToast('添加成功', 'success');
      }
      setShowMoodModal(false);
      setEditingMood(null);
      setMoodForm(
{ label: '', emoji: '😊' });
    } catch (error) 
{
      console.error('保存失败:', error);
      showToast('保存失败', 'error');
    }
  }, [editingMood, moodForm, addMood, updateMood, showToast]);

  // 如果没有用户数据，显示登录提示
  if (!currentUser) 
{
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 dark:text-gray-400 mb-4">请先登录</p>
          <button
            onClick=
{() => navigate('/login')}
            className="px-6 py-2 bg-primary-500 text-white rounded-lg"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div 
      ref=
{containerRef}
      className="min-h-screen pb-20"
      onTouchStart=
{handleTouchStart}
      onTouchMove=
{handleTouchMove}
      onTouchEnd=
{handleTouchEnd}
    >
      
{/* 下拉刷新指示器 */}
      
{(pullDistance > 0 || isRefreshing) && (
        <div 
          className="flex items-center justify-center py-3 text-gray-400 transition-transform"
          style=
{
{ transform: `translateY($
{pullDistance}px)` }}
        >
          
{isRefreshing ? (
            <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full" />
          ) : (
            <div 
              className="w-5 h-5 border-2 border-gray-300 border-t-primary-400 rounded-full transition-transform"
              style=
{
{ transform: `rotate($
{pullDistance * 3}deg)` }}
            />
          )}
        </div>
      )}
      
      
{/* 头部 - 左上角展示账号头像和名称，参考成长数据页面 */}
      <header className="bg-gradient-to-b from-primary-50 to-white safe-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            
            {/* 账号头像显示在左上角 */}
            <div 
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-200 to-primary-300 flex items-center justify-center text-lg overflow-hidden shadow-sm"
            >
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
                <User className="w-5 h-5" />
              )}
            </div>
            <h1 className="text-base font-medium text-gray-600 dark:text-gray-300">
              {v2AccountInfo?.identityName || currentUser?.name || "我的"}
            </h1>
            <div className="flex-1" />
            {/* 给宝宝的信按钮 */}
            <button
              onClick={onOpenCapsules}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-full transition-colors"
            >
              <Heart className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">给宝宝的信</span>
            </button>
          </div>
          
          {/* 账号切换器 */}
          <BabyHeader onEditBaby={(babyInfo) => onEditBaby(babyInfo)} isSystemAccount={isSystemAccount} showToast={showToast} />
        </div>
      </header>
      
      {/* 功能菜单 - 分组结构 */}
      <main className="px-4 -mt-4 max-w-lg mx-auto space-y-4">
        
        {/* 个性化分组 */}
        <div>
          <p className="text-sm font-medium text-gray-500 mb-2 px-1">个性化</p>
          <div className="space-y-2">
            {/* 主题设置 */}
            <button
              onClick={() => setShowThemeModal(true)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Palette className="w-5 h-5 text-primary-500" />
              <div className="flex-1 text-left">
                <span className="text-sm dark:text-white">主题设置</span>
                <p className="text-xs text-gray-400 dark:text-gray-400">自定义应用颜色主题</p>
              </div>
            </button>

            {/* 标签自定义 */}
            <button
              onClick={() => setShowTagGroup(!showTagGroup)}
              className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Tags className="w-5 h-5 text-amber-500" />
              <div className="flex-1 text-left">
                <span className="text-sm dark:text-white">标签自定义</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">管理里程碑、心情、虚拟时光标签</p>
              </div>
              <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showTagGroup ? 'rotate-180' : ''}`} />
            </button>

            {showTagGroup && (
              <div className="space-y-2 pl-4">
                {/* 里程碑标签自定义 */}
                <button
                  onClick={() => {
                    setEditingMilestone(null);
                    setMilestoneForm({ label: '', emoji: '⭐', color: '#FF7B70' });
                    setShowMilestoneModal(true);
                  }}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-sm text-primary-500">⭐</span>
                  <div className="flex-1 text-left">
                    <span className="text-sm dark:text-white">里程碑标签自定义</span>
                  </div>
                </button>

                {/* 心情标签自定义 */}
                <button
                  onClick={() => {
                    setEditingMood(null);
                    setMoodForm({ label: '', emoji: '😊' });
                    setShowMoodModal(true);
                  }}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-sm text-amber-500">😊</span>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-sm dark:text-white">心情标签自定义</span>
                  </div>
                </button>

                {/* 虚拟时光标签自定义 */}
                <button
                  onClick={() => navigate('/virtual-time-categories')}
                  className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <span className="text-sm text-gray-400">✨</span>
                  <div className="flex-1 text-left">
                    <span className="font-medium text-sm dark:text-white">虚拟时光标签自定义</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 数据管理分组 - 可折叠 */}
        <div className="px-4 mt-4">
          <button
            onClick={() => setShowDataManagement(!showDataManagement)}
            className="w-full flex items-center justify-between cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-2 px-1"
          >
            <p className="text-xs font-medium text-gray-400">数据管理</p>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDataManagement ? 'rotate-180' : ''}`} />
          </button>
          {showDataManagement && (
            <div className="space-y-2">
            {/* 导入示例数据 */}
            <button
              onClick={handleImportSampleData}
              disabled={!currentBaby || isImportingSample}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
            >
              <Database className="w-5 h-5 text-primary-500" />
              <div className="flex-1 text-left">
                <span className="font-medium dark:text-white">导入示例数据</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {isImportingSample ? '导入中...' : '选择模板，添加照片、视频、语音、日记'}
                </p>
              </div>
            </button>

            {/* 导出数据 */}
            <button
              onClick={() => handleExport()}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Download className="w-5 h-5 text-amber-500" />
              <div className="flex-1 text-left">
                <span className="font-medium dark:text-white">导出数据</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">备份应用数据到本地</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 导入数据 */}
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Upload className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <span className="font-medium dark:text-white">导入数据</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">从备份文件恢复数据</p>
              </div>
            </button>

            {/* 回收站 */}
            <button
              onClick={() => onOpenRecycleBin()}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Trash2 className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <span className="font-medium dark:text-white">回收站</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">查看已删除的时光记录</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 清除缓存 */}
            <button
              onClick={() => setShowClearConfirm(true)}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <RotateCcw className="w-5 h-5 text-red-400" />
              <div className="flex-1 text-left">
                <span className="font-medium text-red-500 dark:text-red-400">清除缓存</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">谨慎操作，将清除所有本地数据</p>
              </div>
            </button>
          </div>
          )}
        </div>

        {/* 其他分组 - 可折叠 */}
        <div>
          <button
            onClick={() => setShowOther(!showOther)}
            className="w-full flex items-center justify-between cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors mb-2 px-1"
          >
            <p className="text-sm font-medium text-gray-500">其他</p>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showOther ? 'rotate-180' : ''}`} />
          </button>
          {showOther && (
            <div className="space-y-2">
            {/* 帮助与反馈 */}
            <button
              onClick={() => window.open('https://support.coze.cn', '_blank')}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <span className="font-medium dark:text-white">帮助与反馈</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">获取使用帮助或提交反馈</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 隐私政策 */}
            <button
              onClick={() => window.open('https://www.coze.cn/privacy', '_blank')}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <Shield className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <span className="font-medium dark:text-white">隐私政策</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">了解数据收集与使用政策</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 用户协议 */}
            <button
              onClick={() => window.open('https://www.coze.cn/terms', '_blank')}
              className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <FileText className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <span className="text-sm dark:text-white">用户协议</span>
                <p className="text-xs text-gray-500 dark:text-gray-400">使用条款与免责声明</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </button>

            {/* 版本信息 */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3">
              <Info className="w-5 h-5 text-gray-400" />
              <div className="flex-1 text-left">
                <span className="font-medium dark:text-white">版本信息</span>
                <p className="text-xs text-gray-400 dark:text-gray-400">当前版本 v2.42.0</p>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* 退出登录 - 独立 */}
        <button
          onClick={handleLogout}
          className="w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          <span className="font-medium text-red-500 dark:text-red-400">退出登录</span>
        </button>
      </main>
      
      
{/* 底部标语 */}
      <div className="text-center py-8 text-sm text-gray-400">
        <Heart className="w-4 h-4 inline mx-1 text-red-400" />
        用心记录每一个成长瞬间
      </div>
      
      
{/* 导入数据弹窗 */}
      
{showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 dark:text-white">导入数据</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">导入模式</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="importMode"
                    checked=
{importMode === 'merge'}
                    onChange=
{() => setImportMode('merge')}
                    className="w-4 h-4 text-primary-500"
                  />
                  <div>
                    <p className="font-medium dark:text-white">合并导入</p>
                    <p className="text-xs text-gray-400">保留现有数据，只添加新内容</p>
                  </div>
                </label>
                <label className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                  <input
                    type="radio"
                    name="importMode"
                    checked=
{importMode === 'replace'}
                    onChange=
{() => setImportMode('replace')}
                    className="w-4 h-4 text-primary-500"
                  />
                  <div>
                    <p className="font-medium dark:text-white">覆盖导入</p>
                    <p className="text-xs text-gray-400">删除现有数据，完全替换</p>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">选择备份文件</label>
              <input
                ref=
{fileInputRef}
                type="file"
                accept=".json"
                onChange=
{(e) => { setImportFile(e.target.files?.[0] || null); setImportText(''); }}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 file:cursor-pointer dark:file:bg-primary-900/30 dark:file:text-primary-400"
              />
              
{importFile && (
                <p className="text-sm text-green-600 mt-2">已选择: 
{importFile.name}</p>
              )}
              
              <div className="flex items-center gap-2 my-3">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
                <span className="text-xs text-gray-400">或者</span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
              </div>
              
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">从剪贴板粘贴</label>
              <div className="flex gap-2 mb-2">
                <button
                  onClick=
{async () => { try { const text = await navigator.clipboard.readText(); setImportText(text); setImportFile(null); } catch(e) { showToast('无法读取剪贴板，请手动粘贴', 'warning'); } }}
                  className="px-3 py-1.5 text-xs bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-400"
                >
                  读取剪贴板
                </button>
              </div>
              <textarea
                value=
{importText}
                onChange=
{(e) => { setImportText(e.target.value); if (e.target.value) setImportFile(null); }}
                placeholder="粘贴备份数据（JSON格式）..."
                className="w-full h-24 text-xs p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick=
{() => { setShowImportModal(false); setImportText(''); }}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                onClick=
{handleImport}
                disabled=
{(!importFile && !importText.trim()) || isImporting}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                
{isImporting ? '导入中...' : '开始导入'}
              </button>
            </div>
          </div>
        </div>
      )}
      
{/* 清除缓存确认弹窗 */}
      
{showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-2 dark:text-white">⚠️ 清除缓存</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              此操作将清除所有本地数据，包括宝宝信息、时光记录等。清除后无法恢复，建议先导出备份！
            </p>
            <div className="flex gap-3">
              <button
                onClick=
{() => setShowClearConfirm(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                onClick=
{handleClearCache}
                className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium"
              >
                确认清除
              </button>
            </div>
          </div>
        </div>
      )}
      
      
{/* 导出数据弹窗 */}
      
{showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold mb-3 dark:text-white">📦 导出数据</h3>
            
            <div className="flex gap-2 mb-3">
              <button
                onClick=
{handleCopyToClipboard}
                className="flex-1 py-2.5 bg-primary-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1"
              >
                <Copy className="w-4 h-4" />
                复制到剪贴板
              </button>
              <button
                onClick=
{handleDownloadFile}
                className="flex-1 py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1"
              >
                <Download className="w-4 h-4" />
                下载文件
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mb-2">APP用户建议用「复制到剪贴板」，然后粘贴到备忘录保存</p>
            
            <textarea
              value=
{exportData}
              readOnly
              className="flex-1 min-h-[120px] text-xs p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none font-mono"
            />
            
            <button
              onClick=
{() => { setShowExportModal(false); setExportData(''); }}
              className="mt-3 w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      )}
      
      
{/* 个人资料编辑弹窗 */}
      
      
{/* 主题设置弹窗 */}
      
{showThemeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 dark:text-white">选择主题</h3>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              
{THEME_PRESETS.map(preset => (
                <button
                  key=
{preset.id}
                  onClick=
{() => setTheme(preset.id)}
                  className=
{`p-4 rounded-xl flex flex-col items-center gap-2 transition-all $
{
                    themePreset === preset.id 
                      ? 'ring-2 ring-offset-2 ring-gray-400' 
                      : ''
                  }`}
                  style=
{
{ backgroundColor: preset.color + '20' }}
                >
                  <div 
                    className="w-10 h-10 rounded-full"
                    style=
{
{ backgroundColor: preset.color }}
                  />
                  <span className="text-xs font-medium dark:text-white">
{preset.name}</span>
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3 mb-6">
              <label className="text-sm font-medium dark:text-gray-300">自定义颜色:</label>
              <input
                ref=
{colorInputRef}
                type="color"
                value=
{customThemeColor}
                onChange=
{(e) => setTheme('custom', e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer"
              />
            </div>
            
            <button
              onClick=
{() => setShowThemeModal(false)}
              className="w-full py-2 bg-primary-500 text-white rounded-lg font-medium"
            >
              完成
            </button>
          </div>
        </div>
      )}
      
      
{/* 里程碑编辑弹窗 */}
      
{showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-6 dark:text-white">
              
{editingMilestone ? '编辑里程碑' : '添加里程碑'}
            </h3>
            
            
{/* 名称 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">里程碑名称</label>
              <input
                type="text"
                value=
{milestoneForm.label}
                onChange=
{(e) => setMilestoneForm(m => (
{ ...m, label: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="如: 第一次游泳"
              />
            </div>
            
            
{/* emoji选择 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">选择图标</label>
              <div className="grid grid-cols-9 gap-1">
                
{EMOJI_OPTIONS.map((emoji, i) => (
                  <button
                    key=
{i}
                    onClick=
{() => setMilestoneForm(m => (
{ ...m, emoji }))}
                    className=
{`aspect-square rounded-lg text-xl flex items-center justify-center transition-all $
{
                      milestoneForm.emoji === emoji
                        ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    
{emoji}
                  </button>
                ))}
              </div>
            </div>
            
            
{/* 颜色选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">选择颜色</label>
              <input
                type="color"
                value=
{milestoneForm.color}
                onChange=
{(e) => setMilestoneForm(m => (
{ ...m, color: e.target.value }))}
                className="w-full h-12 rounded-lg cursor-pointer"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick=
{() => setShowMilestoneModal(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                onClick=
{handleSaveMilestone}
                disabled=
{!milestoneForm.label}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                保存
              </button>
            </div>
            
            
{/* 已有里程碑列表 */}
            
{customMilestones.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium mb-3 dark:text-gray-300">已有的里程碑自定义</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  
{customMilestones.map(ms => (
                    <div
                      key=
{ms.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span>
{ms.emoji}</span>
                        <span className="text-sm dark:text-white">
{ms.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick=
{() => 
{
                            setEditingMilestone(ms);
                            setMilestoneForm(
{ label: ms.label, emoji: ms.emoji, color: ms.color });
                          }}
                          className="p-1 text-gray-500 hover:text-primary-500"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick=
{() => deleteMilestone(ms.id)}
                          className="p-1 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      
{/* 心情标签编辑弹窗 */}
      
{showMoodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-6 dark:text-white">
              
{editingMood ? '编辑心情标签' : '添加心情标签'}
            </h3>
            
            
{/* 名称 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">心情名称</label>
              <input
                type="text"
                value=
{moodForm.label}
                onChange=
{(e) => setMoodForm(m => (
{ ...m, label: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="如: 兴奋"
              />
            </div>
            
            
{/* emoji选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">选择表情</label>
              <div className="grid grid-cols-9 gap-1">
                
{EMOJI_OPTIONS.map((emoji, i) => (
                  <button
                    key=
{i}
                    onClick=
{() => setMoodForm(m => (
{ ...m, emoji }))}
                    className=
{`aspect-square rounded-lg text-xl flex items-center justify-center transition-all $
{
                      moodForm.emoji === emoji
                        ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500'
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    
{emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick=
{() => setShowMoodModal(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                onClick=
{handleSaveMood}
                disabled=
{!moodForm.label}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                保存
              </button>
            </div>
            
            
{/* 已有自定义心情标签列表 */}
            
{customMoods.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-medium mb-3 dark:text-gray-300">已有的自定义心情标签</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  
{customMoods.map(mood => (
                    <div
                      key=
{mood.id}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span>
{mood.emoji}</span>
                        <span className="text-sm dark:text-white">
{mood.label}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick=
{() => 
{
                            setEditingMood(mood);
                            setMoodForm(
{ label: mood.label, emoji: mood.emoji });
                          }}
                          className="p-1 text-gray-500 hover:text-primary-500"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick=
{() => deleteMood(mood.id)}
                          className="p-1 text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      
      {/* 示例数据模板选择面板 */}
      {sampleStep && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => resetSampleSelection()}
        >
          <div 
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <button
                onClick={handleSampleStepBack}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-500 rotate-180" />
              </button>
              <h3 className="font-bold dark:text-white">
                {sampleStep === 'age' && '选择宝宝月龄'}
                {sampleStep === 'template' && '选择模板'}
                {sampleStep === 'edit' && '编辑预览'}
              </h3>
              <button
                onClick={resetSampleSelection}
                className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            
            {/* 内容区域 */}
            <div className="flex-1 overflow-y-auto p-4">
              
              {/* Step 1: 选择月龄 */}
              {sampleStep === 'age' && (
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(ageGroups).map(([key, age]) => {
                    const isRecommended = key === selectedAge;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectAge(key)}
                        className={`relative p-4 rounded-xl border-2 transition-all ${
                          isRecommended 
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                            : 'border-gray-100 dark:border-gray-700 hover:border-primary-200'
                        }`}
                      >
                        {isRecommended && (
                          <span className="absolute -top-2 -right-2 px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                            推荐
                          </span>
                        )}
                        <div className="text-lg font-bold text-gray-800 dark:text-white">
                          {age.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {age.range}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
              
              {/* Step 2: 选择模板 */}
              {sampleStep === 'template' && selectedAge && (
                <div className="space-y-3">
                  {sampleTemplates[selectedAge]?.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectTemplate(template)}
                      className="w-full p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium dark:text-white">{template.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {template.description}
                          </div>
                        </div>
                        <span className="px-2 py-1 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full whitespace-nowrap">
                          {template.moments.length}条记录
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Step 3: 编辑预览 */}
              {sampleStep === 'edit' && (
                <div className="space-y-4">
                  {editedMoments.map((moment, index) => (
                    <div 
                      key={index}
                      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 relative"
                    >
                      {/* 删除按钮 */}
                      <button
                        onClick={() => handleDeleteMoment(index)}
                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                      
                      {/* 类型标签 */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full">
                          {getTypeEmoji(moment.type)} {moment.type === 'photo' ? '照片' : moment.type === 'video' ? '视频' : moment.type === 'audio' ? '语音' : '日记'}
                        </span>
                      </div>
                      
                      {/* 内容编辑 */}
                      {editingContent === index ? (
                        <textarea
                          value={moment.content}
                          onChange={(e) => handleUpdateContent(index, e.target.value)}
                          onBlur={() => setEditingContent(null)}
                          autoFocus
                          className="w-full min-h-[80px] p-3 text-sm bg-white dark:bg-gray-800 border border-primary-300 dark:border-primary-700 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                        />
                      ) : (
                        <div 
                          onClick={() => setEditingContent(index)}
                          className="min-h-[60px] p-3 text-sm bg-white dark:bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
                        >
                          {moment.content}
                        </div>
                      )}
                      
                      {/* 底部信息 */}
                      <div className="flex items-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
                        <span>{getMoodEmoji(moment.mood)}</span>
                        <span>{getWeatherEmoji(moment.weather)}</span>
                        <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                          {moment.milestoneLabel}
                        </span>
                        <span className="ml-auto text-xs">
                          {moment.daysAgo}天前
                        </span>
                      </div>
                      
                      {/* 照片预览 */}
                      {moment.photos && moment.photos[0] ? (
                        <div className="mt-3 relative group">
                          <img 
                            src={moment.photos[0]} 
                            alt="" 
                            className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = '';
                              e.target.parentElement.innerHTML = `
                                <div class="w-full h-32 bg-gray-200 dark:bg-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                  <svg class="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                  <span class="text-xs">图片加载失败</span>
                                </div>
                              `;
                            }}
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-3 md:opacity-0">
                            <button
                              onClick={() => handleReplaceImage(index)}
                              className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-800 active:bg-gray-200"
                            >
                              替换
                            </button>
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="px-3 py-1.5 bg-red-500 rounded-lg text-sm font-medium text-white active:bg-red-600"
                            >
                              删除
                            </button>
                          </div>
                          {/* 移动端：底部操作条 */}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/50 rounded-b-lg flex md:hidden">
                            <button
                              onClick={() => handleReplaceImage(index)}
                              className="flex-1 py-2 text-center text-sm text-white active:bg-white/20"
                            >
                              替换图片
                            </button>
                            <button
                              onClick={() => handleRemoveImage(index)}
                              className="flex-1 py-2 text-center text-sm text-red-300 active:bg-white/20 border-l border-white/20"
                            >
                              删除图片
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleReplaceImage(index)}
                          className="mt-3 w-full h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 hover:border-primary-400 hover:text-primary-500 transition-colors"
                        >
                          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                          <span className="text-xs">添加图片</span>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {editedMoments.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      已删除所有记录
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* 底部操作栏 */}
            {sampleStep === 'edit' && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
                <button
                  onClick={handleSampleStepBack}
                  className="flex-1 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium"
                >
                  返回重选
                </button>
                <button
                  onClick={executeImport}
                  disabled={editedMoments.length === 0 || isImportingSample}
                  className="flex-1 py-3 bg-primary-500 text-white rounded-xl font-medium disabled:opacity-50"
                >
                  {isImportingSample ? '导入中...' : `确认导入${editedMoments.length > 0 ? `(${editedMoments.length}条)` : ''}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
