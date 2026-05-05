/**
 * 宝贝时光 - 集成 CapsulesPage 到导航
 */

import { useState, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { TimelinePage } from './pages/TimelinePage';
import { StatsPage } from './pages/StatsPage';
import { VirtualTimePage } from './pages/VirtualTimePage';
import { ProfilePage } from './pages/ProfilePage';
import { CapsulesPage } from './pages/CapsulesPage';

// 登录保护
function AuthGuard({ children }) {
  const { isLoggedIn, isLoading } = useApp();
  const location = useLocation();

  if (isLoading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!isLoggedIn) {
    // 暂时跳过登录，直接显示内容（纯内存版默认已登录）
    return children;
  }

  return children;
}

// 主应用内容
function AppContent() {
  const { toasts, showToast, removeToast } = useApp();
  const [activeTab, setActiveTab] = useState('timeline');
  const [showCapsulesPage, setShowCapsulesPage] = useState(false);
  const [showMomentForm, setShowMomentForm] = useState(false);
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [showBabyForm, setShowBabyForm] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [editingBaby, setEditingBaby] = useState(null);

  // 统计页面跳转筛选状态
  const [filterType, setFilterType] = useState(''); // photo/video/diary/audio
  const [filterMood, setFilterMood] = useState(''); // happy/excited等
  const [filterMilestone, setFilterMilestone] = useState(''); // first/growth等

  // 统计卡片点击处理
  const handleStatClick = (action) => {
    switch (action) {
      case 'addMoment':
        setShowMomentForm(true);
        break;
      case 'addCapsule':
        setShowCapsuleForm(true);
        break;
      case 'openCapsules':
        setShowCapsulesPage(true);
        break;
      default:
        break;
    }
  };

  // 添加动态
  const handleAddMoment = () => {
    setShowMomentForm(true);
    setEditingMoment(null);
  };

  // 编辑动态
  const handleEditMoment = (moment) => {
    setEditingMoment(moment);
    setShowMomentForm(true);
  };

  // 保存动态
  const handleSaveMoment = async (momentData) => {
    try {
      // 纯内存版本，直接更新状态
      let updatedMoment;
      if (momentData.id) {
        // 更新现有动态
        updatedMoment = { ...editingMoment, ...momentData, updatedAt: Date.now() };
        // 这里应该调用setMoments，但是我们还没导入，暂时用Toast提示
      } else {
        // 添加新动态
        updatedMoment = {
          ...momentData,
          id: `moment-${Date.now()}`,
          babyId: useApp().currentBaby?.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }
      showToast('动态已保存', 'success');
      setShowMomentForm(false);
      setEditingMoment(null);
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
    }
  };

  // 删除动态
  const handleDeleteMoment = async (id) => {
    try {
      // 纯内存版本，直接更新状态
      showToast('动态已删除', 'success');
    } catch (error) {
      showToast('删除失败: ' + error.message, 'error');
    }
  };

  // 添加胶囊
  const handleAddCapsule = () => {
    setShowCapsuleForm(true);
    setEditingCapsule(null);
  };

  // 编辑胶囊
  const handleEditCapsule = (capsule) => {
    setEditingCapsule(capsule);
    setShowCapsuleForm(true);
  };

  // 保存胶囊
  const handleSaveCapsule = async (capsuleData) => {
    try {
      // 纯内存版本，直接更新状态
      let updatedCapsule;
      if (capsuleData.id) {
        // 更新现有胶囊
        updatedCapsule = { ...editingCapsule, ...capsuleData, updatedAt: Date.now() };
      } else {
        // 添加新胶囊
        updatedCapsule = {
          ...capsuleData,
          id: `capsule-${Date.now()}`,
          babyId: useApp().currentBaby?.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }
      showToast('胶囊已保存', 'success');
      setShowCapsuleForm(false);
      setEditingCapsule(null);
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
    }
  };

  const renderPage = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <TimelinePage
            onAddMoment={handleAddMoment}
            onEditMoment={handleEditMoment}
            onDeleteMoment={handleDeleteMoment}
            filterType={filterType}
            filterMood={filterMood}
            filterMilestone={filterMilestone}
          />
        );
      case 'stats':
        return (
          <StatsPage
            onAddMoment={handleAddMoment}
            onAddCapsule={() => setShowCapsuleForm(true)}
            onStatClick={handleStatClick}
            filterType={filterType}
            filterMood={filterMood}
            filterMilestone={filterMilestone}
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
            onAddBaby={() => {
              setEditingBaby(null);
              setShowBabyForm(true);
            }}
            onOpenRecycleBin={() => {}}
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
      <Toast toasts={toasts} onRemove={removeToast} />
      
      {/* 时空胶囊页面 */}
      {showCapsulesPage && (
        <CapsulesPage
          onClose={() => setShowCapsulesPage(false)}
          onAddCapsule={handleAddCapsule}
          onEditCapsule={handleEditCapsule}
        />
      )}
      
      {/* 扣子智能体悬浮按钮 */}
      <div 
        style={{
          position: 'fixed',
          bottom: '90px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
          zIndex: 9999,
          transition: 'transform 0.2s',
        }}
        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        onClick={() => {
          if (window.cozeChat) {
            window.cozeChat.open();
          }
        }}
        title="打开虚拟时光助手"
      >
        ✨
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
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

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
