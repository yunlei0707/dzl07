/**
 * 登录页面（极简版，直接登录）
 * 温馨可爱的UI风格，与宝贝时光主题一致
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, Baby } from 'lucide-react';

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // 直接登录，不需要用户名和密码
    setTimeout(() => {
      const user = {
        id: 'user-1',
        name: '爸爸',
        role: 'father',
      };

      // 保存登录状态到 localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));

      // 回调通知父组件
      if (onLogin) {
        onLogin(user);
      }

      // 跳转到首页
      navigate('/', { replace: true });
      setIsLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-cream-50 to-orange-50 flex flex-col items-center justify-center px-4 safe-top safe-bottom">
      {/* 装饰元素 */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-primary-200/30 rounded-full blur-2xl" />
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-orange-200/30 rounded-full blur-3xl" />
      
      {/* Logo 区域 */}
      <div className="mb-8 animate-bounce-in">
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
      <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎来到宝贝时光</h1>
      <p className="text-gray-500 mb-8">记录宝宝成长的美好时光</p>

      {/* 登录按钮 */}
      <button
        onClick={handleSubmit}
        disabled={isLoading}
        className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed px-12 py-4 text-lg"
      >
        {isLoading ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>登录中...</span>
          </>
        ) : (
          <>
            <Heart className="w-5 h-5" />
            <span>一键登录</span>
          </>
        )}
      </button>
    </div>
  );
}

export default LoginPage;
