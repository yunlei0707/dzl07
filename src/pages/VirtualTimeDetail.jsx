/**
 * 虚拟时光详情页
 * 展示单个专题的详细内容，支持添加用户内容
 */

import { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Clock, Plus, Edit3, Trash2, X } from 'lucide-react';
import { virtualTimeTopics } from '../data/virtualTimeData';
import { BabyHeader } from '../components/BabyHeader';
import { useApp } from '../store/AppContext';
import {
  getVirtualTimeContents,
  addVirtualTimeContent,
  getCurrentV2Account,
  getCurrentBabyInfo,
  isSystemAccount as checkIsSystemAccount,
  getVirtualTimeCategories,
} from '../utils/dbV2';

export function VirtualTimeDetail() {
  const { topicId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useApp();
  
  const [userContents, setUserContents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContent, setNewContent] = useState({ title: '', content: '', emoji: '📝' });
  const [isSystemAccount, setIsSystemAccount] = useState(false);
  
  // 获取专题信息
  const topic = virtualTimeTopics.find(t => t.id === topicId);
  
  // 加载用户内容（使用专题ID作为itemId）
  const loadContents = useCallback(() => {
    if (!topicId) return;
    
    const contents = getVirtualTimeContents(topicId, topicId);
    setUserContents(contents || []);
    setIsLoading(false);
  }, [topicId]);
  
  // 监听账号切换
  useEffect(() => {
    const updateInfo = () => {
      const babyInfo = getCurrentBabyInfo();
      const isV2 = !!babyInfo;
      const isSystem = isV2 && checkIsSystemAccount();
      setIsSystemAccount(isSystem);
      loadContents();
    };
    
    updateInfo();
    const interval = setInterval(updateInfo, 500);
    return () => clearInterval(interval);
  }, [loadContents]);
  
  // 添加内容
  const handleAddContent = useCallback(() => {
    if (!newContent.title.trim()) {
      showToast('请输入标题', 'error');
      return;
    }
    if (isSystemAccount) {
      showToast('系统账号不可修改', 'error');
      return;
    }
    
    addVirtualTimeContent(topicId, topicId, {
      title: newContent.title.trim(),
      content: newContent.content.trim(),
      emoji: newContent.emoji,
      date: new Date().toLocaleDateString('zh-CN')
    });
    
    showToast('已添加内容');
    setNewContent({ title: '', content: '', emoji: '📝' });
    setShowAddForm(false);
    loadContents();
  }, [topicId, newContent, isSystemAccount, showToast, loadContents]);
  
  // 删除内容
  const handleDeleteContent = useCallback((contentId) => {
    if (!confirm('确定要删除这条内容吗？')) return;
    // TODO: 添加删除功能
    showToast('已删除');
    loadContents();
  }, [showToast, loadContents]);
  
  if (!topic) {
    return (
      <div className="min-h-screen pb-20 bg-cream-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">专题不存在</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
          >
            返回
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-20 bg-cream-50 dark:bg-gray-900">
      {/* 头部 */}
      <header className={`bg-gradient-to-b ${topic.coverGradient} text-white safe-top relative`}>
        <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center opacity-20">
          <span className="text-[150px]">{topic.coverEmoji}</span>
        </div>
        
        <div className="relative px-4 pt-4 pb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">虚拟时光</span>
          </div>
          
          <h1 className="text-2xl font-bold mb-2">{topic.title}</h1>
          <p className="text-white/80 text-sm">{topic.description}</p>
        </div>
      </header>
      
      {/* 账号切换器 */}
      <BabyHeader />
      
      {/* 添加按钮 */}
      {!isSystemAccount && (
        <div className="px-4 py-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-primary-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            添加{topic.title}记录
          </button>
        </div>
      )}
      
      {/* 添加表单 */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-3xl p-4 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">添加{topic.title}记录</h3>
              <button onClick={() => setShowAddForm(false)} className="p-2">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">标题</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="记录标题..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">内容</label>
                <textarea
                  value={newContent.content}
                  onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="详细记录..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">图标</label>
                <div className="flex gap-2 flex-wrap">
                  {['📝', '📖', '🎨', '🎵', '🏃', '📸', '🎁', '⭐', '🌟', '💫', '❤️', '👏'].map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setNewContent(prev => ({ ...prev, emoji }))}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center ${
                        newContent.emoji === emoji
                          ? 'bg-primary-100 dark:bg-primary-900/50 border-2 border-primary-500'
                          : 'bg-gray-100 dark:bg-gray-700 border-2 border-transparent'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleAddContent}
                disabled={!newContent.title.trim()}
                className="w-full py-3 bg-primary-500 text-white rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 内容列表 */}
      <main className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* 用户添加的内容 */}
        {userContents.length > 0 && (
          <>
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2">我的记录</h3>
            {userContents.map((item, index) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">{item.emoji || '📝'}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 dark:text-white">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                        {item.content || '暂无详细描述'}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-xs text-gray-400">{item.date || '刚刚'}</span>
                        <div className="flex-1" />
                        <button
                          onClick={() => handleDeleteContent(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        
        {/* 预置内容 */}
        {topic.items && topic.items.length > 0 && (
          <>
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 mt-4">推荐记录</h3>
            {topic.items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${topic.coverGradient} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-2xl">{item.emoji || topic.coverEmoji}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 dark:text-white">{item.title}</h3>
                      <p className="text-gray-600 dark:text-gray-300 mt-2 text-sm leading-relaxed">
                        {item.description || item.content || '暂无描述'}
                      </p>
                      {item.date && (
                        <div className="flex items-center gap-2 mt-3">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-xs text-gray-400">{item.date}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        
        {/* 空状态 */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full mx-auto" />
          </div>
        ) : (!userContents.length && (!topic.items || !topic.items.length)) && (
          <div className="text-center py-12">
            <span className="text-6xl block mb-4 opacity-30">{topic.coverEmoji}</span>
            <p className="text-gray-500 dark:text-gray-400">还没有记录哦</p>
            {!isSystemAccount && (
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-lg"
              >
                添加第一条记录
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
