/**
 * 宝贝时光 - 主应用组件
 * ✅ 稳定极简版本 - 只保留核心功能，确保构建通过
 */

import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { TimelinePage } from './pages/TimelinePage';
import { StatsPage } from './pages/StatsPage';
import { ProfilePage } from './pages/ProfilePage';
import { VirtualTimePage } from './pages/VirtualTimePage';
import { VirtualTimeDetail } from './pages/VirtualTimeDetail';
import { VirtualTimeCategoriesPage } from './pages/VirtualTimeCategoriesPage';
import { CapsulesPage } from './pages/CapsulesPage';
import { MomentForm } from './components/MomentForm';
import { CapsuleForm } from './components/CapsuleForm';
import { BabyForm } from './components/BabyForm';
import { MonthlyReport } from './components/MonthlyReport';
import { RecycleBin } from './components/RecycleBin';

import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { addMoment, updateMoment, addCapsule, updateCapsule, addBaby, updateBaby, addGrowthRecord, updateGrowthRecord, getLatestGrowthRecord } from './utils/db';
import { isSystemAccount, getCurrentBabyInfo, addMomentToCurrentAccount, updateMomentInCurrentAccount, updateCurrentBabyInfo } from './utils/dbV2';
import { initializeApp } from './utils/dbV2';
import { handleRecordLink } from './utils/linkService';
import { FloatingButton } from './components/FloatingButton';
import { AIChoiceModal } from './components/AIChoiceModal';
import { GrowthRecordForm } from './components/GrowthRecordForm';
import { checkGrowthMilestones, GROWTH_ICONS } from './utils/growthMilestones';

// 登录保护
function AuthGuard({ children }) {
  const { isLoggedIn } = useApp();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 路由持久化组件
function RoutePersistence({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // 页面加载时恢复上次路由
  useEffect(() => {
    const savedPath = localStorage.getItem('lastRoute');
    if (savedPath && savedPath !== location.pathname) {
      // 只有当当前路径是默认页面时才跳转
      if (location.pathname === '/' || location.pathname === '/timeline') {
        navigate(savedPath, { replace: true });
      }
    }
  }, []);
  
  // 路由变化时保存
  useEffect(() => {
    if (location.pathname && location.pathname !== '/login' && location.pathname !== '/register') {
      localStorage.setItem('lastRoute', location.pathname);
    }
  }, [location.pathname]);
  
  return children;
}

// 主应用内容
function AppContent() {
  const { showToast, babies, currentBaby, setCurrentBaby, setMoments, setCapsules, setBabies, currentUser, refreshGrowthRecords } = useApp();
  
  const [activeTab, setActiveTab] = useState('timeline');
  const [showMomentForm, setShowMomentForm] = useState(false);
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [showBabyForm, setShowBabyForm] = useState(false);
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [editingBaby, setEditingBaby] = useState(null);
  const [showCapsulesPage, setShowCapsulesPage] = useState(false);
  const [showGrowthReport, setShowGrowthReport] = useState(false);
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [editingGrowthRecord, setEditingGrowthRecord] = useState(null);
  
  // AI 选择弹窗状态
  const [showAIChoice, setShowAIChoice] = useState(false);
  const [aiChoiceContent, setAIChoiceContent] = useState('');

  // v2 双账号系统初始化
  useEffect(() => {
    if (currentUser && currentUser.name) {
      initializeApp(currentUser.name).then(result => {
        if (result.isNewUser) {
          console.log('已为新用户初始化双账号系统');
        }
      }).catch(err => {
        console.error('v2 初始化失败:', err);
      });
    }
  }, [currentUser]);

  // 添加宝宝
  const handleAddBaby = () => {
    if (babies.length >= 2) {
      showToast('最多只能添加2个宝宝哦', 'info');
      return;
    }
    setEditingBaby(null);
    setShowBabyForm(true);
  };

  // 保存宝宝
  const handleSaveBaby = async (babyData) => {
    let savedBaby;
    try {
      // 检查是否是 v2 账号系统
      const v2BabyInfo = getCurrentBabyInfo();
      
      if (v2BabyInfo) {
        // v2 账号系统更新
        const updated = updateCurrentBabyInfo({
          name: babyData.name,
          nickname: babyData.nickname,
          birthDate: babyData.birthday || babyData.birthDate,
          gender: babyData.gender,
          avatar: babyData.avatar
        });
        
        if (updated) {
          showToast('已更新');
          setShowBabyForm(false);
          setEditingBaby(null);
          return;
        }
      }
      
      // 原 IndexedDB 逻辑（兼容旧数据）
      if (babyData.id) {
        savedBaby = await updateBaby(babyData.id, babyData);
        setBabies(prev => prev.map(b => b.id === savedBaby.id ? savedBaby : b));
        showToast('已更新');
      } else {
        savedBaby = await addBaby(babyData);
        setBabies(prev => [...prev, savedBaby]);
        showToast('宝宝档案创建成功！👶');
      }
      
      setCurrentBaby(savedBaby);
      setShowBabyForm(false);
      setEditingBaby(null);
      
    } catch (error) {
      console.error('[GrowthRecord] Save error:', error); showToast('保存失败: ' + error.message, 'error');
    }
  };

  // 保存动态
  const handleSaveMoment = async (momentData) => {
    try {
      // 获取当前宝宝信息
      const babyInfo = getCurrentBabyInfo();
      
      // 如果没有 babyId，使用当前账号的宝宝 ID
      if (!momentData.babyId) {
        momentData.babyId = babyInfo?.id || currentBaby?.id || 'user';
      }
      
      // 确保有 babyId
      if (!momentData.babyId) {
        momentData.babyId = 'user';
      }
      
      // 根据账号类型使用不同的添加方法
      if (babyInfo?.isSystem) {
        // 系统账号不支持添加
        showToast('系统账号不可添加记录', 'error');
        return;
      }
      
      if (momentData.id) {
        // 更新操作
        if (babyInfo) {
          await updateMomentInCurrentAccount(momentData.id, momentData);
        } else {
          await updateMoment(momentData.id, momentData);
        }
        showToast('已更新');
      } else {
        // 新增操作
        let savedMoment;
        if (babyInfo) {
          savedMoment = await addMomentToCurrentAccount(momentData);
        } else {
          savedMoment = await addMoment(momentData);
        }
        showToast('记录已保存！🎉');
        
        // 保存成功后显示 AI 选择弹窗
        console.log('[App] 保存成功，准备显示 AI 选择弹窗, content:', momentData.content);
        setAIChoiceContent(momentData.content || '');
        setShowAIChoice(true);
        
        // 异步触发联动（不阻塞用户操作）
        setTimeout(() => {
          try {
            // 构造 record 对象，包含：id、type、title、content、tags等信息
            const record = {
              id: savedMoment?.id || `temp_${Date.now()}`,
              type: momentData.type || 'moment',
              title: momentData.content?.title || momentData.milestoneLabel || '',
              content: momentData.content?.text || momentData.content || '',
              tags: momentData.tags || [],
              date: momentData.date || new Date().toISOString(),
              mood: momentData.mood,
              milestoneLabel: momentData.milestoneLabel
            };
            
            // 触发联动
            handleRecordLink(record).then(linkedResult => {
              // 如果有联动结果，给个轻提示
              if (linkedResult) {
                showToast('✨ 已生成未来宝宝回响', 'success');
              }
            });
            
          } catch (e) {
            // 静默失败，不影响主流程
            console.error('[App] 联动处理失败:', e);
          }
        }, 0);
      }
      
      // 通知 TimelinePage 刷新数据
      window.dispatchEvent(new Event('v2-moment-updated'));
      
      setShowMomentForm(false);
      setEditingMoment(null);
      
    } catch (error) {
      console.error('[GrowthRecord] Save error:', error); showToast('保存失败: ' + error.message, 'error');
    }
  };

  // 保存胶囊
  const handleSaveCapsule = async (capsuleData) => {
    try {
      if (!capsuleData.babyId) {
        capsuleData.babyId = currentBaby?.id;
      }
      
      if (capsuleData.id) {
        await updateCapsule(capsuleData.id, capsuleData);
        showToast('已更新');
      } else {
        await addCapsule(capsuleData);
        showToast('胶囊创建成功！🎁');
      }
      
      setShowCapsuleForm(false);
      setEditingCapsule(null);
      // 刷新胶囊列表
      refreshCapsules(currentBaby?.id);
      
    } catch (error) {
      console.error('[GrowthRecord] Save error:', error); showToast('保存失败: ' + error.message, 'error');
    }
  };

  // 保存成长记录
  const handleSaveGrowthRecord = async (recordData) => {
    try {
      const babyId = recordData.babyId || currentBaby?.id || getCurrentBabyInfo()?.id;
      console.log('[GrowthRecord] Saving with babyId:', babyId, 'recordData:', recordData);
      
      // 获取宝宝昵称
      const babyInfo = getCurrentBabyInfo() || currentBaby;
      const babyName = babyInfo?.nickname || babyInfo?.name || '宝宝';
      
      let savedRecord;
      
      if (recordData.id) {
        // 更新
        savedRecord = await updateGrowthRecord(recordData.id, recordData);
        showToast('已更新');
      } else {
        // 新增
        // 获取之前的最新记录用于里程碑检测
        const previousRecord = await getLatestGrowthRecord(babyId);
        
        savedRecord = await addGrowthRecord({
          ...recordData,
          babyId,
        });
        showToast('成长记录已保存！📏');
        
        // 检查里程碑触发
        const triggered = checkGrowthMilestones(savedRecord, previousRecord);
        
        if (triggered.length > 0) {
          // 通知刷新成长记录列表
          window.dispatchEvent(new Event('v2-moment-updated'));
          
          // 为每个触发的里程碑创建时光轴记录
          for (const milestone of triggered) {
            try {
              const momentData = {
                babyId,
                date: savedRecord.date,
                type: 'milestone',
                content: `${GROWTH_ICONS[milestone.field]} ${babyName}${milestone.label}！`,
                milestone: 'growth',
                milestoneLabel: milestone.label,
                milestoneEmoji: GROWTH_ICONS[milestone.field],
              };
              
              // 根据账号系统选择不同的添加方法
              if (babyInfo?.isSystem) {
                // 系统账号不支持添加
                continue;
              }
              
              if (babyInfo) {
                await addMomentToCurrentAccount(momentData);
              } else {
                await addMoment(momentData);
              }
            } catch (e) {
              console.error('创建里程碑时光轴记录失败:', e);
            }
          }
          
          // 通知页面刷新
          window.dispatchEvent(new Event('v2-moment-updated'));
        }
      }
      
      setShowGrowthForm(false);
      setEditingGrowthRecord(null);
      // 刷新成长记录列表
      refreshGrowthRecords(currentBaby?.id);
      
    } catch (error) {
      console.error('[GrowthRecord] Save error:', error); showToast('保存失败: ' + error.message, 'error');
    }
  };

  // 渲染当前页面
  const handleAddMoment = useCallback(() => setShowMomentForm(true), []);
  const handleEditMoment = useCallback((moment) => {
    setEditingMoment(moment);
    setShowMomentForm(true);
  }, []);

  const renderPage = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <TimelinePage
            onAddMoment={handleAddMoment}
            onEditMoment={handleEditMoment}
            onAddBaby={handleAddBaby}
          />
        );
      case 'stats':
        return (
          <StatsPage
            onOpenCapsules={() => setShowCapsulesPage(true)}
            onAddCapsule={() => setShowCapsuleForm(true)}
            onOpenMonthlyReport={() => setShowGrowthReport(true)}
            onAddGrowthRecord={() => { setEditingGrowthRecord(null); setShowGrowthForm(true); }}
            onEditGrowthRecord={(record) => { setEditingGrowthRecord(record); setShowGrowthForm(true); }}
          />
        );
      case 'virtual':
        return <VirtualTimePage />;
      case 'profile':
        return (
          <ProfilePage
            onEditBaby={(baby) => {
              setEditingBaby(baby);
              setShowBabyForm(true);
            }}
            onAddBaby={handleAddBaby}
            onOpenRecycleBin={() => setShowRecycleBin(true)}
            onOpenCapsules={() => setShowCapsulesPage(true)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      {/* 页面内容 */}
      {renderPage()}
      
      {/* 底部导航 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Toast 提示 */}
      <Toast />
      
      {/* SDK 初始化组件（只初始化，用SDK自带按钮） */}
      <FloatingButton />
      
      {/* AI 创作提示弹窗 */}
      <AIChoiceModal
        show={showAIChoice}
        onCancel={() => {
          console.log('[App] 用户关闭 AI 提示弹窗');
          setShowAIChoice(false);
        }}
      />
      
      {/* 动态表单 */}
      {showMomentForm && (
        <MomentForm
          moment={editingMoment}
          babyId={currentBaby?.id || "user"}
          onSave={handleSaveMoment}
          onCancel={() => {
            setShowMomentForm(false);
            setEditingMoment(null);
          }}
        />
      )}
      
      {/* 时空胶囊页面 */}
      {showCapsulesPage && (
        <CapsulesPage
          onClose={() => setShowCapsulesPage(false)}
          onAddCapsule={() => setShowCapsuleForm(true)}
          onEditCapsule={(capsule) => {
            setEditingCapsule(capsule);
            setShowCapsuleForm(true);
          }}
        />
      )}
      
      {/* 胶囊表单 */}
      {showCapsuleForm && (
        <CapsuleForm
          capsule={editingCapsule}
          babyId={currentBaby?.id || "user"}
          onSave={handleSaveCapsule}
          onCancel={() => {
            setShowCapsuleForm(false);
            setEditingCapsule(null);
          }}
        />
      )}
      
      {/* 成长记录表单 */}
      {showGrowthForm && (
        <GrowthRecordForm
          record={editingGrowthRecord}
          babyId={currentBaby?.id || "user"}
          onSave={handleSaveGrowthRecord}
          onCancel={() => {
            setShowGrowthForm(false);
            setEditingGrowthRecord(null);
          }}
        />
      )}
      
      {/* 宝宝表单 */}
      {showBabyForm && (
        <BabyForm
          baby={editingBaby}
          isSystem={isSystemAccount()}
          onSave={handleSaveBaby}
          onCancel={() => {
            setShowBabyForm(false);
            setEditingBaby(null);
          }}
        />
      )}
      
      {/* 回收站 */}
      {showRecycleBin && (
        <RecycleBin onClose={() => setShowRecycleBin(false)} />
      )}
      
      {/* 宝宝成长档案 */}
      {showGrowthReport && (
        <MonthlyReport onClose={() => setShowGrowthReport(false)} />
      )}
    </div>
  );
}

// 路由配置
function AppRoutes() {
  const { isLoggedIn, login } = useApp();
  
  return (
    <RoutePersistence>
      <Routes>
      {/* 公开路由 */}
      <Route 
        path="/login" 
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <LoginPage onLogin={login} />
          )
        } 
      />
      <Route 
        path="/register" 
        element={
          isLoggedIn ? (
            <Navigate to="/" replace />
          ) : (
            <RegisterPage onRegister={login} />
          )
        } 
      />
      
      {/* 受保护的路由 */}
      <Route
        path="/*"
        element={
          <AuthGuard>
            <AppContent />
          </AuthGuard>
        }
      />
      
      {/* 未来宝宝详情页 */}
      <Route
        path="/virtual/topic/:topicId"
        element={
          <AuthGuard>
            <VirtualTimeDetail />
          </AuthGuard>
        }
      />
      
      {/* 未来宝宝目录管理 */}
      <Route
        path="/virtual-time-categories"
        element={
          <AuthGuard>
            <VirtualTimeCategoriesPage />
          </AuthGuard>
        }
      />
    </Routes>
    </RoutePersistence>
  );
}

// 根应用组件
export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
