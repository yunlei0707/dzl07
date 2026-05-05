/**
 * 宝贝时光 - 主应用组件
 * ✅ 稳定极简版本 - 只保留核心功能，确保构建通过
 */

import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import { TabBar } from './components/TabBar';
import { Toast } from './components/Toast';
import { TimelinePage } from './pages/TimelinePage';
import { StatsPage } from './pages/StatsPage';
import { ProfilePage } from './pages/ProfilePage';
import { VirtualTimePage } from './pages/VirtualTimePage';
import { CapsulesPage } from './pages/CapsulesPage';
import { MomentForm } from './components/MomentForm';
import { CapsuleForm } from './components/CapsuleForm';
import { BabyForm } from './components/BabyForm';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { addMoment, updateMoment, addCapsule, updateCapsule, addBaby, updateBaby } from './utils/db';

// 登录保护
function AuthGuard({ children }) {
  const { isLoggedIn } = useApp();
  
  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// 主应用内容
function AppContent() {
  const { showToast, babies, currentBaby, setCurrentBaby, setMoments, setCapsules, setBabies } = useApp();
  
  const [activeTab, setActiveTab] = useState('timeline');
  const [showMomentForm, setShowMomentForm] = useState(false);
  const [showCapsuleForm, setShowCapsuleForm] = useState(false);
  const [showBabyForm, setShowBabyForm] = useState(false);
  const [editingMoment, setEditingMoment] = useState(null);
  const [editingCapsule, setEditingCapsule] = useState(null);
  const [editingBaby, setEditingBaby] = useState(null);
  const [showCapsulesPage, setShowCapsulesPage] = useState(false);

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
      showToast('保存失败: ' + error.message, 'error');
    }
  };

  // 保存动态
  const handleSaveMoment = async (momentData) => {
    try {
      if (!momentData.babyId) {
        momentData.babyId = currentBaby?.id;
      }
      
      if (momentData.id) {
        await updateMoment(momentData.id, momentData);
        showToast('已更新');
      } else {
        await addMoment(momentData);
        showToast('记录已保存！🎉');
      }
      
      setShowMomentForm(false);
      setEditingMoment(null);
      
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
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
      
    } catch (error) {
      showToast('保存失败: ' + error.message, 'error');
    }
  };

  // 渲染当前页面
  const renderPage = () => {
    switch (activeTab) {
      case 'timeline':
        return (
          <TimelinePage
            onAddMoment={() => setShowMomentForm(true)}
            onEditMoment={(moment) => {
              setEditingMoment(moment);
              setShowMomentForm(true);
            }}
            onAddBaby={handleAddBaby}
          />
        );
      case 'stats':
        return (
          <StatsPage
            onOpenCapsules={() => setShowCapsulesPage(true)}
            onAddCapsule={() => setShowCapsuleForm(true)}
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
    </div>
  );
}

// 路由配置
function AppRoutes() {
  const { isLoggedIn, login } = useApp();
  
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
