/**
 * 宝贝时光 - 主应用组件
 * 记录宝宝成长点滴的移动端单页应用
 */

import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { LoadingSkeleton } from './components/LoadingSkeleton';
// 懒加载页面组件 - 减小首屏体积
const TimelinePage = lazy(() => import('./pages/TimelinePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const VirtualTimePage = lazy(() => import('./pages/VirtualTimePage'));
const CapsulesPage = lazy(() => import('./pages/CapsulesPage'));
// 弹窗组件保持立即加载（相对较小）
import { ErrorBoundary } from './components/ErrorBoundary';
import { MomentForm } from './components/MomentForm';
import { CapsuleForm } from './components/CapsuleForm';
import { BabyForm } from './components/BabyForm';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
// 非核心组件懒加载 - 点击时才加载
const RecycleBin = lazy(() => import('./components/RecycleBin'));
const MonthlyReport = lazy(() => import('./components/MonthlyReport'));
import { 
  addMoment, 
  updateMoment, 
  softDeleteMoment,
  addCapsule, 
  updateCapsule, 
  addBaby, 
  updateBaby,
  getMomentsByBaby,
  getCapsulesByBaby,
  getAllBabies,
  updateSettings
} from './utils/db';

// 登录保护组件
function AuthGuard({ children }) {
  const { isLoggedIn, isLoading } = useApp();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// 主应用内容
function AppContent() {
  const { 
    isLoading, 
    currentBaby,
    setCurrentBaby,
    moments,
    setMoments,
    setCapsules,
    setBabies,
    switchBaby,
    showToast,
    login,
    babies
  } = useApp();
  
  const [activeTab, setActiveTab] = useState('timeline');
  
  // 统计页面跳转筛选状态
  const [filterType, setFilterType] = useState(''); // photo/video/diary/audio
  const [filterMood, setFilterMood] = useState(''); // happy/excited等
  const [filterMilestone, setFilterMilestone] = useState(''); // first/growth等
  
  // 弹窗状态
  const [showMomentForm, setShowMomentForm] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [showCapsulesPage, setShowCapsulesPage] = useState(false);
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [showBabyForm, setShowBabyForm] = useState(false);
  const [editingBaby, setEditingBaby] = useState(null);
  
  // 回收站状态
  const [showRecycleBin, setShowRecycleBin] = useState(false);
  
  // Service Worker 更新检测和缓存清理
  useEffect(() => {
    // 检查并更新 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update();
        }
      });
    }
    
    // 清理旧缓存
    const clearOldCaches = async () => {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        cacheNames.forEach((name) => {
          if (name !== 'baby-time-v3' && name.startsWith('baby-time')) {
            caches.delete(name);
          }
        });
      }
    };
    clearOldCaches();
  }, []);
  // 月度报告状态
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);
  
  // 统计卡片点击处理
  const handleStatClick = (action) => {
    // 重置所有筛选条件
    setFilterType('');
    setFilterMood('');
    setFilterMilestone('');
    
    switch (action.type) {
      case 'timeline':
        setActiveTab('timeline');
        break;
      case 'filter':
        setActiveTab('timeline');
        if (action.filterType) setFilterType(action.filterType);
        if (action.filterMood) setFilterMood(action.filterMood);
        if (action.filterMilestone) setFilterMilestone(action.filterMilestone);
        break;
      case 'capsules':
        setShowCapsulesPage(true);
        break;
      case 'profile':
        setActiveTab('profile');
        if (action.baby) {
          setEditingBaby(action.baby);
          setShowBabyForm(true);
        }
        break;
      case 'moment':
        setActiveTab('timeline');
        break;
      default:
        break;
    }
  };
  
  // 清除筛选条件
  const clearFilters = () => {
    setFilterType('');
    setFilterMood('');
    setFilterMilestone('');
  };
  
  // 添加动态
  const handleAddMoment = () => {
    if (!currentBaby) {
      showToast('请先创建宝宝档案', 'error');
      return;
    }
    setEditingMoment(null);
    setShowMomentForm(true);
  };
  
  // 编辑动态
  const handleEditMoment = (moment) => {
    setEditingMoment(moment);
    setShowMomentForm(true);
  };
  
  // 保存动态
  const handleSaveMoment = async (momentData) => {
    try {
      if (!momentData.babyId) {
        momentData.babyId = currentBaby?.id;
      }
      
      if (!momentData.babyId) {
        showToast('请先创建宝宝档案', 'error');
        return;
      }
      
      let savedMoment;
      if (momentData.id) {
        savedMoment = await updateMoment(momentData.id, momentData);
        showToast('已更新');
      } else {
        savedMoment = await addMoment(momentData);
        showToast('记录成功！🎉');
      }
      
      // 刷新动态列表
      const updatedMoments = await getMomentsByBaby(momentData.babyId);
      setMoments(updatedMoments);
      
      // 关闭表单
      setShowMomentForm(false);
      setEditingMoment(null);
      
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
    }
  };
  
  // 删除动态（软删除）
  const handleDeleteMoment = async (momentId) => {
    try {
      await softDeleteMoment(momentId);
      
      // 刷新动态列表
      if (currentBaby?.id) {
        const updatedMoments = await getMomentsByBaby(currentBaby.id);
        setMoments(updatedMoments);
      }
      
      showToast('已删除');
    } catch (error) {
      showToast('删除失败: ' + error.message, 'error');
    }
  };
  
  // 添加胶囊
  const handleAddCapsule = () => {
    if (!currentBaby) {
      showToast('请先创建宝宝档案', 'error');
    }
    setShowCapsulesPage(false);
    setEditingCapsule(null);
    setShowCapsuleForm(true);
  };
  
  // 编辑胶囊
  const handleEditCapsule = (capsule) => {
    setEditingCapsule(capsule);
    setShowCapsuleForm(true);
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
      
      // 刷新胶囊列表
      if (currentBaby?.id) {
        const updatedCapsules = await getCapsulesByBaby(currentBaby.id);
        setCapsules(updatedCapsules);
      }
      
      setShowCapsuleForm(false);
      setEditingCapsule(null);
      
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
    }
  };
  
  // 添加宝宝（最多2个）
  const handleAddBaby = () => {
    if (babies.length >= 2) {
      showToast('最多只能添加2个宝宝哦', 'info');
      return;
    }
    setEditingBaby(null);
    setShowBabyForm(true);
  };
  
  // 编辑宝宝
  const handleEditBaby = (baby) => {
    setEditingBaby(baby);
    setShowBabyForm(true);
  };
  
  // 保存宝宝
  const handleSaveBaby = async (babyData) => {
    let savedBaby;
    try {
      if (babyData.id) {
        savedBaby = await updateBaby(babyData.id, babyData);
        showToast('已更新');
      } else {
        savedBaby = await addBaby(babyData);
        showToast('宝宝档案创建成功！👶');
      }
      
      // 立即关闭表单
      setShowBabyForm(false);
      setEditingBaby(null);
      
      // 后台刷新数据
      getAllBabies().then(babies => {
        setBabies(babies);
        if (!babyData.id && savedBaby?.id) {
          const newBaby = babies.find(b => b.id === savedBaby.id);
          if (newBaby) {
            updateSettings({ currentBabyId: newBaby.id });
            setCurrentBaby(newBaby);
            getMomentsByBaby(newBaby.id).then(setMoments);
            getCapsulesByBaby(newBaby.id).then(setCapsules);
          }
        } else if (babyData.id) {
          setCurrentBaby(prev => babies.find(b => b.id === prev?.id) || prev);
        }
      });
      
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
      throw error;
    }
  };
  
  // 切换宝宝
  const handleSwitchBaby = async (babyId) => {
    await switchBaby(babyId);
    showToast('已切换宝宝档案');
  };
  
  // 渲染页面 - 懒加载组件用 Suspense 包裹
  const renderPage = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <TimelinePage
              onAddMoment={handleAddMoment}
              onEditMoment={handleEditMoment}
              onDeleteMoment={handleDeleteMoment}
              onSwitchBaby={handleSwitchBaby}
              onAddBaby={handleAddBaby}
              filterType={filterType}
              filterMood={filterMood}
              filterMilestone={filterMilestone}
              onClearFilters={clearFilters}
            />
          </Suspense>
        );
      case 'stats':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <StatsPage
              onOpenCapsules={() => setShowCapsulesPage(true)}
              onStatClick={handleStatClick}
              onOpenMonthlyReport={() => setShowMonthlyReport(true)}
            />
          </Suspense>
        );
      case 'virtual':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <VirtualTimePage />
          </Suspense>
        );
      case 'profile':
        return (
          <Suspense fallback={<LoadingSkeleton />}>
            <ProfilePage
              onEditBaby={handleEditBaby}
              onAddBaby={handleAddBaby}
              onOpenRecycleBin={() => setShowRecycleBin(true)}
            />
          </Suspense>
        );
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900">
      {/* 页面内容 */}
      {renderPage()}
      
      {/* 底部导航 */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Toast 提示 */}
      <Toast />
      
      {/* 动态表单 */}
      {showMomentForm && (
        <MomentForm
          moment={editingMoment}
          babyId={currentBaby?.id}
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
          onAddCapsule={handleAddCapsule}
          onEditCapsule={handleEditCapsule}
        />
      )}
      
      {/* 胶囊表单 */}
      {showCapsuleForm && (
        <CapsuleForm
          capsule={editingCapsule}
          babyId={currentBaby?.id}
          onSave={handleSaveCapsule}
          onCancel={() => {
            setShowCapsuleForm(false);
            setEditingCapsule(null);
          }}
        />
      )}
      
      {/* 宝宝表单 */}
      {showBabyForm && (
        <BabyForm
          baby={editingBaby}
          onSave={handleSaveBaby}
          onCancel={() => {
            setShowBabyForm(false);
            setEditingBaby(null);
          }}
        />
      )}
      
      {/* 回收站 - 懒加载 */}
      {showRecycleBin && (
        <Suspense fallback={<LoadingSkeleton />}>
          <RecycleBin onClose={() => setShowRecycleBin(false)} />
        </Suspense>
      )}
      
      {/* 月度报告 - 懒加载 */}
      {showMonthlyReport && (
        <Suspense fallback={<LoadingSkeleton />}>
          <MonthlyReport onClose={() => setShowMonthlyReport(false)} />
        </Suspense>
      )}
    </div>
  );
}

// 路由配置
function AppRoutes() {
  const { isLoggedIn, isLoading, login } = useApp();
  
  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  return (
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
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}
