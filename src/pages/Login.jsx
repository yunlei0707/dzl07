/**
 * 登录页面 - 亲属角色选择模式
 * 温馨可爱的UI风格，与宝贝时光主题一致
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Baby, Camera, X, User, Users, UserCircle, Grandpa, Grandma, Uncle, Aunt, Smile, Eye } from 'lucide-react';

// 亲属角色配置
const FAMILY_ROLES = [
  { id: 'dad', name: '无敌奶爸', icon: '👨', color: 'from-blue-400 to-blue-500', welcome: '欢迎爸爸光临' },
  { id: 'mom', name: '温柔宝妈', icon: '👩', color: 'from-pink-400 to-pink-500', welcome: '欢迎妈妈光临' },
  { id: 'grandpa', name: '慈祥姥爷', icon: '👴', color: 'from-amber-400 to-amber-500', welcome: '欢迎姥爷光临' },
  { id: 'grandma', name: '和蔼姥姥', icon: '👵', color: 'from-rose-400 to-rose-500', welcome: '欢迎姥姥光临' },
  { id: 'uncle', name: '帅气老舅', icon: '🧔', color: 'from-indigo-400 to-indigo-500', welcome: '欢迎舅舅光临' },
  { id: 'aunt', name: '漂亮小姨', icon: '💃', color: 'from-fuchsia-400 to-fuchsia-500', welcome: '欢迎小姨光临' },
  { id: 'grandpa-father', name: '慈祥爷爷', icon: '👴🏻', color: 'from-orange-400 to-orange-500', welcome: '欢迎爷爷光临' },
  { id: 'baby', name: '宝宝本人', icon: '👶', color: 'from-yellow-400 to-yellow-500', welcome: '欢迎宝宝光临' },
  { id: 'guest', name: '访客参观', icon: '👀', color: 'from-gray-400 to-gray-500', welcome: '欢迎您来参观' },
];

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [customBg, setCustomBg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // 从 localStorage 恢复状态
  useEffect(() => {
    const savedRole = localStorage.getItem('selectedFamilyRole');
    const savedBg = localStorage.getItem('customBackground');
    if (savedRole) {
      const role = FAMILY_ROLES.find(r => r.id === savedRole);
      if (role) setSelectedRole(role);
    }
    if (savedBg) {
      setCustomBg(savedBg);
    }
  }, []);

  // 保存选择的角色
  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    localStorage.setItem('selectedFamilyRole', role.id);
  };

  // 处理背景图上传
  const handleBgUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const bgData = event.target.result;
        setCustomBg(bgData);
        localStorage.setItem('customBackground', bgData);
      };
      reader.readAsDataURL(file);
    }
  };

  // 清除自定义背景
  const clearCustomBg = () => {
    setCustomBg(null);
    localStorage.removeItem('customBackground');
  };

  // 登录处理
  const handleLogin = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    
    // 创建用户对象
    const user = {
      id: selectedRole.id,
      username: selectedRole.name,
      role: selectedRole.id,
      avatar: selectedRole.icon,
    };

    // 保存登录状态
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('currentUser', JSON.stringify(user));

    // 回调通知父组件
    if (onLogin) {
      onLogin(user);
    }

    // 模拟加载效果
    setTimeout(() => {
      setIsLoading(false);
      navigate('/', { replace: true });
    }, 800);
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary-50 via-cream-50 to-orange-50 flex flex-col items-center justify-center px-4 safe-top safe-bottom relative overflow-hidden"
      style={customBg ? { backgroundImage: `url(${customBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      {/* 背景遮罩 - 当有自定义背景时显示 */}
      {customBg && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      )}

      {/* 装饰元素 */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200/30 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl" />

      {/* 背景图上传按钮 */}
      <button
        onClick={() => document.getElementById('bg-upload').click()}
        className="absolute top-4 right-4 z-20 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-105"
      >
        <Camera className="w-5 h-5 text-gray-600" />
      </button>
      <input
        id="bg-upload"
        type="file"
        accept="image/*"
        onChange={handleBgUpload}
        className="hidden"
      />

      {/* 清除背景按钮 */}
      {customBg && (
        <button
          onClick={clearCustomBg}
          className="absolute top-4 right-16 z-20 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all hover:scale-105"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      )}

      {/* Logo 区域 */}
      <div className="mb-6 animate-bounce-in z-10">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-500 rounded-3xl flex items-center justify-center shadow-lg shadow-primary-200/50">
            <Baby className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex items-center justify-center shadow-sm animate-wiggle">
            <Heart className="w-3 h-3 text-white fill-current" />
          </div>
        </div>
      </div>

      {/* 标题 */}
      <h1 className="text-2xl font-bold text-gray-800 mb-2 z-10" style={customBg ? { color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' } : {}}>
        欢迎来到宝贝时光
      </h1>
      <p className="text-gray-500 mb-6 z-10" style={customBg ? { color: 'rgba(255,255,255,0.9)' } : {}}>
        请选择您的身份
      </p>

      {/* 角色选择网格 */}
      <div className="w-full max-w-md z-10 mb-6">
        <div className="grid grid-cols-3 gap-3">
          {FAMILY_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => handleRoleSelect(role)}
              className={`relative flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-300 ${
                selectedRole?.id === role.id
                  ? `bg-gradient-to-br ${role.color} text-white shadow-lg scale-105`
                  : customBg
                  ? 'bg-white/90 text-gray-700 hover:bg-white hover:shadow-md'
                  : 'bg-white text-gray-700 hover:shadow-md hover:scale-102'
              }`}
            >
              <span className="text-3xl mb-2">{role.icon}</span>
              <span className="text-xs font-medium">{role.name}</span>
              {selectedRole?.id === role.id && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* 登录按钮 */}
      <button
        onClick={handleLogin}
        disabled={!selectedRole || isLoading}
        className={`btn-primary w-full max-w-sm flex items-center justify-center gap-2 z-10 ${
          !selectedRole ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        style={selectedRole ? {
          background: `linear-gradient(to right, var(--tw-gradient-stops))`,
        } : {}}
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>进入中...</span>
          </>
        ) : (
          <>
            <Heart className="w-5 h-5" />
            <span>{selectedRole ? selectedRole.welcome : '请选择您的身份'}</span>
          </>
        )}
      </button>

      {/* 底部提示 */}
      <p className="mt-6 text-sm text-gray-400 z-10" style={customBg ? { color: 'rgba(255,255,255,0.7)' } : {}}>
        选择角色后即可开始记录美好时光
      </p>
    </div>
  );
}
