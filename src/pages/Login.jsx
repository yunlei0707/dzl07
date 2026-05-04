/**
 * 登录页面 - 亲属角色选择版
 * 温馨可爱的UI风格，与宝贝时光主题一致
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Baby, Camera, Upload } from 'lucide-react';
import { createGuestAccount, createSampleBaby } from '../utils/db';

// 亲属角色配置
const FAMILY_ROLES = [
  { id: 'dad', label: '无敌奶爸', emoji: '👨', buttonText: '欢迎爸爸光临' },
  { id: 'mom', label: '温柔宝妈', emoji: '👩', buttonText: '欢迎妈妈光临' },
  { id: 'grandpa', label: '慈祥姥爷', emoji: '👴', buttonText: '欢迎姥爷光临' },
  { id: 'grandma', label: '和蔼姥姥', emoji: '👵', buttonText: '欢迎姥姥光临' },
  { id: 'uncle', label: '帅气老舅', emoji: '🧔', buttonText: '欢迎舅舅光临' },
  { id: 'aunt', label: '漂亮小姨', emoji: '👧', buttonText: '欢迎小姨光临' },
  { id: 'grandpa_pat', label: '慈祥爷爷', emoji: '👴', buttonText: '欢迎爷爷光临' },
  { id: 'baby', label: '宝宝本人', emoji: '👶', buttonText: '欢迎宝宝回来' },
  { id: 'guest', label: '访客参观', emoji: '👀', buttonText: '欢迎访客参观' },
];

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [customBackground, setCustomBackground] = useState(null);

  // 初始化时从localStorage读取自定义背景
  useEffect(() => {
    const savedBg = localStorage.getItem('loginBackground');
    if (savedBg) {
      setCustomBackground(savedBg);
    }
  }, []);

  // 处理背景图上传
  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target.result;
        setCustomBackground(base64);
        localStorage.setItem('loginBackground', base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // 重置背景图
  const handleResetBackground = () => {
    setCustomBackground(null);
    localStorage.removeItem('loginBackground');
  };

  // 登录处理
  const handleLogin = async () => {
    if (!selectedRole) {
      return;
    }

    setIsLoading(true);
    
    try {
      // 创建游客账号（复用现有逻辑）
      const guestUser = await createGuestAccount();
      
      // 创建示例宝宝
      await createSampleBaby(guestUser.id);

      // 保存亲属角色信息
      localStorage.setItem('familyRole', JSON.stringify(selectedRole));
      
      // 保存登录状态
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(guestUser));
      
      // 回调通知父组件
      if (onLogin) {
        onLogin(guestUser);
      }
      
      // 跳转到首页
      navigate('/', { replace: true });
    } catch (err) {
      console.error('登录失败:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取当前选择的角色
  const currentRole = FAMILY_ROLES.find(r => r.id === selectedRole);

  // 背景图样式
  const backgroundStyle = customBackground
    ? { backgroundImage: `url(${customBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-primary-50 via-cream-50 to-orange-50 flex flex-col items-center justify-center px-4 safe-top safe-bottom relative overflow-hidden"
      style={backgroundStyle}
    >
      {/* 背景遮罩（当有自定义背景时显示） */}
      {customBackground && (
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      )}

      {/* 装饰元素 */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200/30 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl" />
      
      {/* 内容容器 */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo 区域 */}
        <div className="mb-6 animate-bounce-in">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl flex items-center justify-center shadow-lg shadow-primary-200/50">
              <Baby className="w-8 h-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full flex items-center justify-center shadow-sm animate-wiggle">
              <Heart className="w-2.5 h-2.5 text-white fill-current" />
            </div>
          </div>
        </div>
        
        {/* 标题 */}
        <h1 className="text-xl font-bold text-gray-800 mb-1">你是宝宝的</h1>
        <p className="text-gray-500 text-sm mb-6">选择你的身份，开启记录之旅</p>

        {/* 亲属角色选择 */}
        <div className="grid grid-cols-3 gap-3 mb-8 w-full">
          {FAMILY_ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => setSelectedRole(role.id)}
              className={`
                flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-200
                ${selectedRole === role.id
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-200 scale-105'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white hover:shadow-md'
                }
              `}
            >
              <span className="text-2xl mb-1">{role.emoji}</span>
              <span className="text-xs font-medium">{role.label}</span>
            </button>
          ))}
        </div>

        {/* 自定义背景图上传 */}
        <div className="mb-6 w-full">
          <label className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            {customBackground ? (
              <>
                <Camera className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-primary-500">更换背景图</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500">上传自定义背景图</span>
              </>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleBackgroundUpload}
              className="hidden"
            />
          </label>
          {customBackground && (
            <button
              onClick={handleResetBackground}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 mx-auto block"
            >
              重置为默认背景
            </button>
          )}
        </div>

        {/* 登录按钮 */}
        <button
          onClick={handleLogin}
          disabled={!selectedRole || isLoading}
          className={`
            w-full py-3.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-all duration-200
            ${selectedRole && !isLoading
              ? 'bg-gradient-to-r from-primary-400 to-primary-500 text-white shadow-lg shadow-primary-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>进入中...</span>
            </>
          ) : (
            <>
              <Heart className="w-5 h-5" />
              <span>{currentRole ? currentRole.buttonText : '请选择你的身份'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
