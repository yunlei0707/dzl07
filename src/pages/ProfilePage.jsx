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
  Palette, Tag, Edit3, Plus, X, Check, Image, Users, Trophy, Sparkles, Copy, Check as CheckIcon, Settings, ChevronDown, Database
} from 'lucide-react';
import 
{ exportAllData, importAllData, PRESET_AVATARS, getAllBabies, getMomentsByBaby, getCapsulesByBaby, addMoment, deleteBaby } from '../utils/db';
import { exportV2AccountData, importV2AccountData, isSystemAccount } from '../utils/dbV2';
import 
{ calculateAge } from '../utils/dateUtils';
import 
{ BabyHeader } from '../components/BabyHeader';
import 
{ getCurrentV2Account, getCurrentBabyInfo, isSystemAccount as checkIsSystemAccount } from '../utils/dbV2';

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
{ onEditBaby, onAddBaby, onOpenRecycleBin }) 
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
  const [milestoneForm, setMilestoneForm] = useState(
{ label: '', emoji: '⭐', color: '#FF7B70' });
  
  // 心情标签管理状态
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [editingMood, setEditingMood] = useState(null);
  const [moodForm, setMoodForm] = useState(
{ label: '', emoji: '😊' });
  
  // 设置面板抽屉状态
  const [showSettings, setShowSettings] = useState(false);
  
  // 个人资料编辑状态
  const [editProfile, setEditProfile] = useState(
{
    nickname: '',
    avatar: '',
    signature: ''
  });
  
  // 导入模式
  const [importMode, setImportMode] = useState('merge');
  const [importFile, setImportFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);
  
  // 导入示例数据
  const [isImportingSample, setIsImportingSample] = useState(false);
  
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
      setV2AccountInfo(account?.accountData || null);
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
  
  // 导入示例数据
  const handleImportSampleData = useCallback(async () => 
{
    if (!currentBaby || isImportingSample) return;
    
    setIsImportingSample(true);
    try 
{
      const now = new Date();
      
      // 示例动态1：照片 - 三个月前
      const date1 = new Date(now);
      date1.setMonth(date1.getMonth() - 3);
      
      await addMoment(
{
        babyId: currentBaby.id,
        type: 'photo',
        date: date1.toISOString(),
        content: '今天第一次尝试翻身，虽然只翻了一半，但已经超级棒了！',
        photos: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400'],
        mood: 'happy',
        weather: 'sunny',
        milestone: 'first',
        milestoneLabel: '第一次翻身',
      });

      // 示例动态2：视频 - 两个月前
      const date2 = new Date(now);
      date2.setMonth(date2.getMonth() - 2);
      
      await addMoment(
{
        babyId: currentBaby.id,
        type: 'video',
        date: date2.toISOString(),
        content: '今天学会了爬行，追着球球跑得好开心呀！',
        videos: [
{
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          cover: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400',
          duration: 10
        }],
        mood: 'excited',
        weather: 'cloudy',
        milestone: 'growth',
        milestoneLabel: '学会爬行',
      });

      // 示例动态3：语音 - 一个月前
      const date3 = new Date(now);
      date3.setMonth(date3.getMonth() - 1);
      
      await addMoment(
{
        babyId: currentBaby.id,
        type: 'audio',
        date: date3.toISOString(),
        content: '今天第一次叫妈妈，虽然发音还不太标准，但真的好甜~',
        audios: [
{
          url: 'https://www.w3schools.com/html/horse.ogg',
          duration: 8,
          waveform: generateWaveform(),
        }],
        mood: 'touched',
        weather: 'sunny',
        milestone: 'growth',
        milestoneLabel: '学会说话',
      });

      // 示例动态4：日记 - 两周前
      const date4 = new Date(now);
      date4.setDate(date4.getDate() - 14);
      
      await addMoment(
{
        babyId: currentBaby.id,
        type: 'diary',
        date: date4.toISOString(),
        content: '今天带豆芽去公园玩，她对花花草草特别感兴趣，一直在摸小树叶。看见小狗狗就激动得不行，一定要追着跑。希望下周天气好，可以再去一次！',
        mood: 'happy',
        weather: 'windy',
        milestone: 'daily',
        milestoneLabel: '户外活动',
      });

      // 刷新数据
      const babyMoments = await getMomentsByBaby(currentBaby.id);
      setMoments(babyMoments);
      
      showToast('已导入4条示例数据', 'success');
    } catch (error) 
{
      console.error('导入示例数据失败:', error);
      showToast('导入失败', 'error');
    } finally 
{
      setIsImportingSample(false);
    }
  }, [currentBaby, isImportingSample, generateWaveform, setMoments, showToast]);
  
  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);
  const containerRef = useRef(null);
  
  // 初始化编辑资料
  useEffect(() => 
{
    if (currentUser) 
{
      setEditProfile(
{
        nickname: currentUser.nickname || '',
        avatar: currentUser.avatar || '',
        signature: currentUser.signature || ''
      });
    }
  }, [currentUser]);
  
  // 刷新数据
  const refreshData = useCallback(async () => 
{
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try 
{
      // 直接使用import的函数，不要动态import
      const allBabies = await getAllBabies();
      setBabies(allBabies);
      
      if (currentBaby?.id) 
{
        const [moments, capsules] = await Promise.all([
          getMomentsByBaby(currentBaby.id),
          getCapsulesByBaby(currentBaby.id)
        ]);
        setMoments(moments);
        setCapsules(capsules);
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
  }, [currentBaby, isRefreshing, setBabies, setMoments, setCapsules, showToast]);
  
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
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], 
{ type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `宝贝时光备份_$
{new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('导出成功', 'success');
    } catch (error) 
{
      console.error('导出失败:', error);
      showToast('导出失败', 'error');
    }
  }, [showToast]);
  
  // 导入数据
  const handleImport = useCallback(async () => 
{
    if (!importFile) return;
    
    setIsImporting(true);
    try 
{
      const text = await importFile.text();
      const data = JSON.parse(text);
      await importAllData(data, importMode);
      showToast('导入成功', 'success');
      setShowImportModal(false);
      refreshData();
    } catch (error) 
{
      console.error('导入失败:', error);
      showToast('导入失败: ' + error.message, 'error');
    } finally 
{
      setIsImporting(false);
    }
  }, [importFile, importMode, showToast, refreshData]);
  
  // 保存个人资料
  const handleSaveProfile = useCallback(async () => 
{
    try 
{
      await updateUserProfile(editProfile);
      showToast('保存成功', 'success');
      setShowProfileModal(false);
    } catch (error) 
{
      console.error('保存失败:', error);
      showToast('保存失败', 'error');
    }
  }, [editProfile, updateUserProfile, showToast]);
  
  // 退出登录
  const handleLogout = useCallback(() => 
{
    logout();
    navigate('/login');
  }, [logout, navigate]);
  
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
      <header className="bg-gradient-to-b from-primary-400 to-primary-500 text-white safe-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center gap-2 mb-4">
            
{/* 账号头像显示在左上角 */}
            <button 
              onClick=
{() => setShowProfileModal(true)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden"
            >
              
{currentUser?.avatar ? (
                currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http') ? (
                  <img src=
{currentUser.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>
{currentUser.avatar}</span>
                )
              ) : (
                <User className="w-5 h-5" />
              )}
            </button>
            <h1 className="text-xl font-bold">
{currentUser?.nickname || "我的"}</h1>
            <div className="flex-1" />
            
{/* 设置按钮 */}
            <button
              onClick=
{() => setShowSettings(true)}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <Settings className="w-5 h-5" />
            </button>
            
{/* 主题切换 */}
            <button
              onClick=
{toggleTheme}
              className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              
{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>
      
      {/* 账号切换器 */}
      <BabyHeader />
      
      {/* 编辑宝宝信息入口 */}
      <div className="px-4 mt-2">
        <button
          onClick={() => {
            // 获取当前宝宝信息并调用编辑
            const babyInfo = v2AccountInfo || currentBaby;
            if (babyInfo) {
              onEditBaby(babyInfo);
            }
          }}
          className="w-full py-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex items-center justify-center gap-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Edit3 className="w-5 h-5" />
          <span className="font-medium">编辑宝宝信息</span>
        </button>
      </div>
      
      {/* 功能菜单 */}
      <div className="px-4 mt-4 space-y-3">

        
{/* 主题设置 */}
        <button
          onClick=
{() => setShowThemeModal(true)}
          className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
            <Palette className="w-5 h-5 text-pink-500" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium dark:text-white">主题设置</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">自定义应用颜色主题</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        
        
{/* 里程碑自定义 */}
        <button
          onClick=
{() => 
{
            setEditingMilestone(null);
            setMilestoneForm(
{ label: '', emoji: '⭐', color: '#FF7B70' });
            setShowMilestoneModal(true);
          }}
          className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Tag className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium dark:text-white">里程碑自定义（时光轴）</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">管理您的专属成长里程碑</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        
        
{/* 自定义心情标签 */}
        <button
          onClick=
{() => 
{
            setEditingMood(null);
            setMoodForm(
{ label: '', emoji: '😊' });
            setShowMoodModal(true);
          }}
          className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-500" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium dark:text-white">心情标签管理（时光轴）</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">添加和管理自定义心情标签</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        
        
{/* 导入示例数据 */}
        <button
          onClick=
{handleImportSampleData}
          disabled=
{!currentBaby || isImportingSample}
          className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors disabled:opacity-50"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium dark:text-white">导入示例数据（虚拟时光）</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              
{isImportingSample ? '导入中...' : '添加照片、视频、语音、日记示例'}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        
        
{/* 退出登录 */}
        
        {/* 虚拟时光自定义 */}
        <button
          onClick={() => navigate('/virtual-time-categories')}
          className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1 text-left">
            <span className="font-medium dark:text-white">虚拟时光自定义</span>
            <p className="text-xs text-gray-500 dark:text-gray-400">管理虚拟时光分类和内容项</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </button>
        <button
          onClick=
{handleLogout}
          className="w-full bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-gray-500" />
          </div>
          <span className="font-medium dark:text-white">退出登录</span>
        </button>
      </div>
      
      
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">保留现有数据，只添加新内容</p>
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">删除现有数据，完全替换</p>
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
{(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 hover:file:bg-primary-200 file:cursor-pointer dark:file:bg-primary-900/30 dark:file:text-primary-400"
              />
              
{importFile && (
                <p className="text-sm text-green-600 mt-2">已选择: 
{importFile.name}</p>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick=
{() => setShowImportModal(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                onClick=
{handleImport}
                disabled=
{!importFile || isImporting}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium disabled:opacity-50"
              >
                
{isImporting ? '导入中...' : '开始导入'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      
{/* 个人资料编辑弹窗 */}
      
{showProfileModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-6 dark:text-white">编辑个人资料</h3>
            
            
{/* 头像选择 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-3 dark:text-gray-300">选择头像</label>
              <div className="grid grid-cols-6 gap-2 mb-3">
                
{PRESET_AVATARS.slice(0, 12).map((avatar, i) => (
                  <button
                    key=
{i}
                    onClick=
{() => setEditProfile(p => (
{ ...p, avatar }))}
                    className=
{`aspect-square rounded-lg text-2xl flex items-center justify-center transition-all $
{
                      editProfile.avatar === avatar 
                        ? 'bg-primary-100 dark:bg-primary-900/30 ring-2 ring-primary-500' 
                        : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    
{avatar}
                  </button>
                ))}
              </div>
            </div>
            
            
{/* 昵称 */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">昵称</label>
              <input
                type="text"
                value=
{editProfile.nickname}
                onChange=
{(e) => setEditProfile(p => (
{ ...p, nickname: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="请输入昵称"
              />
            </div>
            
            
{/* 个性签名 */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 dark:text-gray-300">个性签名</label>
              <textarea
                value=
{editProfile.signature}
                onChange=
{(e) => setEditProfile(p => (
{ ...p, signature: e.target.value }))}
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white resize-none"
                rows=
{3}
                placeholder="写下你的个性签名..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick=
{() => setShowProfileModal(false)}
                className="flex-1 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium"
              >
                取消
              </button>
              <button
                onClick=
{handleSaveProfile}
                className="flex-1 py-2 bg-primary-500 text-white rounded-lg font-medium"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      
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
      
      
{/* 设置面板抽屉 - 新增 */}
      
{showSettings && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50"
            onClick=
{() => setShowSettings(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-2xl overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold dark:text-white">⚙️ 设置</h3>
                <button onClick=
{() => setShowSettings(false)}>
                  <X className="w-6 h-6 text-gray-400" />
                </button>
              </div>
              
              <div className="space-y-4">
                                
{/* 回收站入口 */}
                <button
                  onClick=
{() => 
{
                    setShowSettings(false);
                    onOpenRecycleBin();
                  }}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center gap-3"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                  <span className="font-medium dark:text-white">回收站</span>
                </button>

                
{/* 导出数据 */}
                <button
                  onClick=
{() => 
{
                    handleExport();
                    setShowSettings(false);
                  }}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center gap-3"
                >
                  <Download className="w-5 h-5 text-blue-500" />
                  <span className="font-medium dark:text-white">导出数据</span>
                </button>

                
{/* 导入数据 */}
                <button
                  onClick=
{() => 
{
                    setShowSettings(false);
                    setShowImportModal(true);
                  }}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center gap-3"
                >
                  <Upload className="w-5 h-5 text-orange-500" />
                  <span className="font-medium dark:text-white">导入数据</span>
                </button>
                
                
{/* 关于 */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    宝贝时光 v1.0
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
                    用心记录每一个成长瞬间
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
