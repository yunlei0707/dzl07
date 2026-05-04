// 这是之前的最简测试版ProfilePage，现在可以逐步恢复功能
/**
 * 个人中心页面 - 逐步恢复版
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { PRESET_AVATARS } from '../utils/db';
import {
  Moon, Sun, Download, Upload, Trash2, ChevronRight, Heart, LogOut, User, 
  Palette, Tag, Edit3, Plus, X, Check, Image, Users, Trophy, Sparkles, Copy, Check as CheckIcon, Settings, ChevronDown, Database
} from 'lucide-react';
import { calculateAge } from '../utils/dateUtils';

// 主题预设配置
const THEME_PRESETS = [
  { id: 'pink', name: '默认粉橙', color: '#FF7B70', gradient: 'from-primary-400 to-primary-500' },
  { id: 'green', name: '森林绿', color: '#34D399', gradient: 'from-emerald-400 to-emerald-500' },
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
    refreshBabies,
    updateUserProfile,
    customMilestones,
    addMilestone,
    updateMilestone,
    deleteMilestone,
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

  // 心情标签管理状态
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [editingMood, setEditingMood] = useState(null);
  const [moodForm, setMoodForm] = useState({ label: '', emoji: '😊' });

  // 资料编辑状态
  const [userForm, setUserForm] = useState(currentUser || { name: '', avatar: '' });

  // 生日计算
  const babyAge = currentBaby?.birthday ? calculateAge(new Date(currentBaby.birthday)) : null;

  // 切换主题
  const handleThemeChange = async (preset) => {
    setTheme(preset);
    setShowThemeModal(false);
    showToast(`已切换为${preset === 'pink' ? '默认粉橙' : THEME_PRESETS.find(t => t.id === preset)?.name}主题`);
  };

  // 选择自定义颜色
  const handleCustomColorChange = async (color) => {
    // 纯内存版本，直接更新状态
    // 实际应用中需要调用db.updateSetting保存
    showToast('自定义颜色已应用');
  };

  // 打开回收站
  const handleOpenRecycleBin = () => {
    onOpenRecycleBin?.();
  };

  // 编辑宝宝资料
  const handleEditBaby = () => {
    onEditBaby?.(currentBaby);
  };

  // 添加新宝宝
  const handleAddBaby = () => {
    onAddBaby?.(null);
  };

  // 更新用户资料
  const handleUpdateProfile = () => {
    updateUserProfile(userForm);
    setShowProfileModal(false);
    showToast('资料已更新');
  };

  // 新增里程碑
  const handleAddMilestone = () => {
    if (!milestoneForm.label.trim()) {
      showToast('请输入里程碑名称');
      return;
    }
    addMilestone(milestoneForm);
    setMilestoneForm({ label: '', emoji: '⭐', color: '#FF7B70' });
    setShowMilestoneModal(false);
    showToast('里程碑已添加');
  };

  // 编辑里程碑
  const handleEditMilestone = (milestone) => {
    setEditingMilestone(milestone);
    setMilestoneForm({ ...milestone });
    setShowMilestoneModal(true);
  };

  // 更新里程碑
  const handleUpdateMilestone = () => {
    if (!milestoneForm.label.trim()) {
      showToast('请输入里程碑名称');
      return;
    }
    updateMilestone(editingMilestone.id, milestoneForm);
    setMilestoneForm({ label: '', emoji: '⭐', color: '#FF7B70' });
    setEditingMilestone(null);
    setShowMilestoneModal(false);
    showToast('里程碑已更新');
  };

  // 删除里程碑
  const handleDeleteMilestone = (id) => {
    deleteMilestone(id);
    showToast('里程碑已删除');
  };

  // 显示宝宝选择器（多宝宝时）
  const showBabySelector = babies.length > 1;

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">个人中心</h1>
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <ChevronDown size={20} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* 宝宝信息卡片 */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-primary-100 dark:border-primary-900">
                  {currentBaby?.avatar ? (
                    <img src={currentBaby.avatar} alt={currentBaby.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                      <span className="text-3xl">{currentBaby?.name?.[0] || '👶'}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleEditBaby}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{currentBaby?.name || '未命名'}</h2>
                {babyAge && (
                  <p className="text-gray-600 dark:text-gray-400">{babyAge.years}岁{babyAge.months}个月</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {currentBaby?.gender === 'boy' ? '男宝' : '女宝'} • {currentBaby?.birthday?.split('T')[0] || '未设置生日'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {showBabySelector && babies.map((baby) => (
                <button
                  key={baby.id}
                  onClick={() => switchBaby(baby.id)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    currentBaby?.id === baby.id
                      ? 'bg-primary-100 dark:bg-primary-900 border-2 border-primary-500'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="text-sm font-medium">{baby.name?.[0]}</span>
                </button>
              ))}
              {babies.length < 2 && (
                <button
                  onClick={handleAddBaby}
                  className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <Plus size={18} />
                </button>
              )}
            </div>
          </div>

          {/* 宝宝成长数据 */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">成长记录</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                  <Sparkles size={20} className="text-primary-600 dark:text-primary-400" />
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">时空胶囊</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">--</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                  <Database size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 功能菜单 */}
        <div className="space-y-4">
          {/* 用户资料 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">个人资料</h2>
              <button
                onClick={() => setShowProfileModal(true)}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                <Edit3 size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
                {userForm?.avatar ? (
                  <img src={userForm.avatar} alt={userForm.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <User size={32} className="text-gray-400 dark:text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{userForm?.name || '家长'}</h3>
                <p className="text-gray-600 dark:text-gray-400">{currentBaby?.gender === 'boy' ? '爸爸' : '妈妈'}</p>
              </div>
            </div>
          </div>

          {/* 主题设置 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">主题设置</h2>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {theme === 'dark' ? (
                  <Sun size={20} className="text-yellow-500" />
                ) : (
                  <Moon size={20} className="text-gray-600 dark:text-gray-400" />
                )}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-4">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleThemeChange(preset.id)}
                  className={`relative rounded-xl overflow-hidden transition-all ${
                    themePreset === preset.id
                      ? 'ring-2 ring-primary-500 scale-105'
                      : 'hover:scale-105'
                  }`}
                >
                  <div className={`h-12 w-full bg-gradient-to-r ${preset.gradient}`} />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <span className="text-white font-medium text-sm">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowThemeModal(true)}
              className="w-full py-3 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="flex items-center justify-center gap-2">
                <Palette size={18} />
                <span>自定义主题颜色</span>
              </div>
            </button>
          </div>

          {/* 数据管理 */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-6">数据管理</h2>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={handleOpenRecycleBin}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Trash2 size={24} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">回收站</span>
              </button>
              <button
                // onClick={handleExportData}
                disabled
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 opacity-50 cursor-not-allowed"
              >
                <Download size={24} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">导出数据</span>
              </button>
              <button
                // onClick={() => setShowImportModal(true)}
                disabled
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 opacity-50 cursor-not-allowed"
              >
                <Upload size={24} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">导入数据</span>
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Settings size={24} className="text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">更多设置</span>
              </button>
            </div>
          </div>

          {/* 退出登录 */}
          <button
            onClick={logout}
            className="w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
          >
            <div className="flex items-center justify-center gap-2">
              <LogOut size={20} />
              <span>退出登录</span>
            </div>
          </button>
        </div>
      </div>

      {/* 里程碑编辑模态框 */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingMilestone ? '编辑里程碑' : '添加新里程碑'}
                </h2>
                <button
                  onClick={() => {
                    setShowMilestoneModal(false);
                    setEditingMilestone(null);
                    setMilestoneForm({ label: '', emoji: '⭐', color: '#FF7B70' });
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    里程碑名称
                  </label>
                  <input
                    type="text"
                    value={milestoneForm.label}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, label: e.target.value })}
                    placeholder="例如：第一次爬行、会说话了"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    表情符号
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_OPTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setMilestoneForm({ ...milestoneForm, emoji })}
                        className={`p-2 rounded-lg transition-colors ${
                          milestoneForm.emoji === emoji
                            ? 'bg-primary-100 dark:bg-primary-900 border-2 border-primary-500'
                            : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="text-2xl">{emoji}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    颜色
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={milestoneForm.color}
                      onChange={(e) => setMilestoneForm({ ...milestoneForm, color: e.target.value })}
                      className="w-12 h-12 rounded-full cursor-pointer border-2 border-gray-300 dark:border-gray-600"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{milestoneForm.color}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={editingMilestone ? handleUpdateMilestone : handleAddMilestone}
                  className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {editingMilestone ? '更新里程碑' : '添加里程碑'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 个人资料编辑模态框 */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">编辑个人资料</h2>
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setUserForm(currentUser || { name: '', avatar: '' });
                  }}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
                      {userForm.avatar ? (
                        <img src={userForm.avatar} alt={userForm.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                          <User size={40} className="text-gray-400 dark:text-gray-500" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
                    >
                      <Edit3 size={16} />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          // 纯内存版本，直接生成预览URL
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setUserForm({ ...userForm, avatar: event.target.result });
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">点击更换头像</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    称呼
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    placeholder="例如：爸爸、妈妈"
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleUpdateProfile}
                  className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  保存资料
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 主题设置模态框 */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">自定义主题颜色</h2>
                <button
                  onClick={() => setShowThemeModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center gap-4">
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={customThemeColor || '#FF7B70'}
                    onChange={(e) => handleCustomColorChange(e.target.value)}
                    className="w-24 h-24 rounded-full cursor-pointer border-4 border-gray-300 dark:border-gray-600"
                  />
                  <button
                    onClick={() => colorInputRef.current?.click()}
                    className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    选择颜色
                  </button>
                </div>

                <div className="grid grid-cols-5 gap-3">
                  {['#FF7B70', '#34D399', '#60A5FA', '#A78BFA', '#FBBF24', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'].map((color) => (
                    <button
                      key={color}
                      onClick={() => handleCustomColorChange(color)}
                      className={`w-full aspect-square rounded-lg ${color === (customThemeColor || '#FF7B70') ? 'ring-2 ring-white ring-offset-2 ring-offset-black' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">主题预览</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-900 rounded-xl p-4">
                      <div className="w-full h-8 rounded-lg" style={{ backgroundColor: customThemeColor || '#FF7B70' }} />
                      <div className="w-full h-8 rounded-lg mt-3 opacity-70" style={{ backgroundColor: customThemeColor || '#FF7B70' }} />
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                      <div className="w-full h-8 rounded-lg" style={{ backgroundColor: customThemeColor || '#FF7B70' }} />
                      <div className="w-full h-8 rounded-lg mt-3 opacity-70" style={{ backgroundColor: customThemeColor || '#FF7B70' }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => {
                    setShowThemeModal(false);
                  }}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowThemeModal(false);
                  }}
                  className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                >
                  应用颜色
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 数据导入模态框 */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">导入数据</h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} className="text-gray-600 dark:text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 flex flex-col items-center justify-center gap-4">
                  <Upload size={40} className="text-gray-400 dark:text-gray-500" />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-primary-500 text-white font-medium rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    选择备份文件
                  </button>
                  <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                    支持从导出的JSON文件导入宝宝数据和成长记录
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="importMode"
                    id="merge"
                    defaultChecked
                    className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="merge" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    合并模式 - 保留现有数据，添加导入数据
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="importMode"
                    id="replace"
                    className="h-4 w-4 text-primary-600 dark:text-primary-400 focus:ring-primary-500 dark:focus:ring-primary-400 border-gray-300 dark:border-gray-600"
                  />
                  <label htmlFor="replace" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    覆盖模式 - 清除现有数据，替换为导入数据
                  </label>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // 纯内存版本，暂时不处理导入
                        showToast('纯内存版本暂时不支持数据导入');
                        setShowImportModal(false);
                      }
                    }}
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  disabled
                  className="flex-1 py-3 bg-primary-500 text-white font-medium rounded-lg opacity-50 cursor-not-allowed"
                >
                  开始导入
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认模态框 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">确认删除宝宝?</h2>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  删除后将无法恢复宝宝的所有数据，包括成长记录、时空胶囊等。
                </p>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 纯内存版本，暂时不处理删除
                    showDeleteConfirm(false);
                    showToast('纯内存版本暂时不支持删除宝宝');
                  }}
                  className="flex-1 py-3 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 transition-colors"
                >
                  确认删除
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
