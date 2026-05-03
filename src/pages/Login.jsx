/**
 * 登录页面
 * 温馨可爱的UI风格，与宝贝时光主题一致
 * 支持忘记密码和游客登录功能
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Heart, User, Lock, Eye, EyeOff, Baby, HelpCircle, AlertCircle } from 'lucide-react';
import { loginUser, verifySecurityAnswer, decryptPassword, createGuestAccount, createSampleBaby } from '../utils/db';

export function LoginPage({ onLogin }) {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // 忘记密码模态框
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: 输入用户名, 2: 安全问题, 3: 显示密码
  const [forgotNickname, setForgotNickname] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [revealedPassword, setRevealedPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 简单的表单验证
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginUser(nickname, password);
      
      // 保存登录状态到 localStorage
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // 回调通知父组件
      if (onLogin) {
        onLogin(user);
      }
      
      // 跳转到首页
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码');
    } finally {
      setIsLoading(false);
    }
  };

  // 游客登录
  const handleGuestLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // 创建游客账号
      const guestUser = await createGuestAccount();
      
      // 创建示例宝宝
      await createSampleBaby(guestUser.id);
      
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
      setError(err.message || '游客登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 打开忘记密码模态框
  const handleOpenForgot = () => {
    setShowForgotModal(true);
    setForgotStep(1);
    setForgotNickname('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setRevealedPassword('');
  };

  // 关闭忘记密码模态框
  const handleCloseForgot = () => {
    setShowForgotModal(false);
    setForgotStep(1);
    setForgotNickname('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setRevealedPassword('');
  };

  // 验证用户名（获取安全问题）
  const handleVerifyUsername = async () => {
    if (!forgotNickname.trim()) {
      setError('请输入昵称');
      return;
    }
    
    setIsLoading(true);
    try {
      const { getUserByUsername } = await import('../utils/db');
      const user = await getUserByNickname(forgotNickname);
      
      if (!user) {
        setError('昵称不存在');
        return;
      }
      
      if (!user.securityQuestion) {
        setError('该用户未设置安全问题，请联系客服');
        return;
      }
      
      setSecurityQuestion(user.securityQuestion);
      setForgotStep(2);
      setError('');
    } catch (err) {
      setError('验证失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 验证安全问题答案
  const handleVerifyAnswer = async () => {
    if (!securityAnswer.trim()) {
      setError('请输入答案');
      return;
    }
    
    setIsLoading(true);
    try {
      const user = await verifySecurityAnswer(forgotUsername, securityAnswer);
      const decryptedPwd = decryptPassword(user.password);
      setRevealedPassword(decryptedPwd);
      setForgotStep(3);
      setError('');
    } catch (err) {
      setError(err.message || '答案错误');
    } finally {
      setIsLoading(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-800 mb-2">欢迎回来</h1>
      <p className="text-gray-500 mb-8">记录宝宝成长的美好时光</p>

      {/* 登录表单 */}
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        {/* 用户名输入 */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <User className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            className="input-field pl-12 pr-4"
            autoComplete="username"
            disabled={isLoading}
          />
        </div>

        {/* 密码输入 */}
        <div className="relative">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Lock className="w-5 h-5" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            className="input-field pl-12 pr-12"
            autoComplete="current-password"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* 忘记密码链接 */}
        <div className="text-right -mt-2">
          <button
            type="button"
            onClick={handleOpenForgot}
            className="text-sm text-primary-500 hover:text-primary-600 flex items-center gap-1 ml-auto"
          >
            <HelpCircle className="w-3 h-3" />
            忘记密码？
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl animate-shake">
            {error}
          </div>
        )}

        {/* 登录按钮 */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>登录中...</span>
            </>
          ) : (
            <>
              <Heart className="w-5 h-5" />
              <span>登录</span>
            </>
          )}
        </button>
      </form>

      {/* 注册链接 */}
      <div className="mt-8 flex items-center gap-2 text-sm">
        <span className="text-gray-400">还没有账号？</span>
        <Link
          to="/register"
          className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
        >
          立即注册 →
        </Link>
      </div>

      {/* 游客模式 */}
      <button
        onClick={handleGuestLogin}
        disabled={isLoading}
        className="mt-6 px-6 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        游客体验
      </button>

      {/* 忘记密码模态框 */}
      {showForgotModal && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseForgot}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-6 animate-bounce-in"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-500" />
              找回密码
            </h3>

            {/* 步骤1：输入用户名 */}
            {forgotStep === 1 && (
              <div className="space-y-4">
<p className="text-sm text-gray-500">请输入您注册的昵称</p>
                <input
                  type="text"
                  value={forgotUsername}
                  onChange={e => setForgotUsername(e.target.value)}
placeholder="昵称"
                  className="input-field"
                />
                <button
                  onClick={handleVerifyUsername}
                  disabled={isLoading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {isLoading ? '验证中...' : '下一步'}
                </button>
              </div>
            )}

            {/* 步骤2：安全问题 */}
            {forgotStep === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">请回答以下安全问题</p>
                <div className="p-3 bg-cream-50 dark:bg-gray-700 rounded-xl">
                  <p className="text-sm text-gray-600 dark:text-gray-300">{securityQuestion}</p>
                </div>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={e => setSecurityAnswer(e.target.value)}
                  placeholder="请输入答案"
                  className="input-field"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setForgotStep(1)}
                    className="flex-1 btn-secondary"
                  >
                    上一步
                  </button>
                  <button
                    onClick={handleVerifyAnswer}
                    disabled={isLoading}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {isLoading ? '验证中...' : '验证'}
                  </button>
                </div>
              </div>
            )}

            {/* 步骤3：显示密码 */}
            {forgotStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-green-500" />
                  <p className="text-sm text-green-700 dark:text-green-400">
                    验证成功！您的密码是：
                  </p>
                </div>
                <div className="p-4 bg-cream-50 dark:bg-gray-700 rounded-xl text-center">
                  <p className="text-2xl font-bold text-gray-800 dark:text-white tracking-wider">
                    {revealedPassword}
                  </p>
                </div>
                <p className="text-xs text-gray-400 text-center">
                  建议登录后修改密码
                </p>
                <button
                  onClick={handleCloseForgot}
                  className="btn-primary w-full"
                >
                  完成
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
