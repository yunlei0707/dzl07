/**
 * 月度报告组件
 * 显示当月统计、里程碑事件、生成分享卡片
 */

import { useState, useEffect, useMemo } from 'react';
import { X, ChevronLeft, ChevronRight, Camera, Video, FileText, Mic, Star, Share2, Download } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { getMonthlyStats } from '../utils/db';

export function MonthlyReport({ onClose }) {
  const { currentBaby, showToast } = useApp();
  
  // 当前查看的年月
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // 加载月度数据
  useEffect(() => {
    loadMonthlyData();
  }, [currentBaby, year, month]);
  
  const loadMonthlyData = async () => {
    if (!currentBaby?.id) return;
    
    setIsLoading(true);
    try {
      const data = await getMonthlyStats(currentBaby.id, year, month);
      setStats(data);
    } catch (error) {
      showToast('加载报告失败', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  // 月份名称
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
  
  // 导航月份
  const goToPrevMonth = () => {
    if (month === 1) {
      setYear(y => y - 1);
      setMonth(12);
    } else {
      setMonth(m => m - 1);
    }
  };
  
  const goToNextMonth = () => {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    
    if (!isCurrentMonth) {
      if (month === 12) {
        setYear(y => y + 1);
        setMonth(1);
      } else {
        setMonth(m => m + 1);
      }
    }
  };
  
  // 心情Emoji
  const moodEmojis = {
    happy: '😊',
    excited: '🎉',
    touched: '🥰',
    sleepy: '😴',
    crying: '😢',
    angry: '😠',
  };
  
  // 里程碑emoji
  const milestoneEmojis = {
    first: '👶',
    growth: '🌱',
    health: '💪',
    achievement: '🏆',
    memory: '📸',
  };
  
  // 判断是否是当前月份
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
  
  // 分享卡片内容
  const shareContent = useMemo(() => {
    if (!stats || !currentBaby) return '';
    
    return `${currentBaby.nickname || currentBaby.name}的${year}年${monthNames[month - 1]}成长报告

📸 照片: ${stats.photoCount}张
🎬 视频: ${stats.videoCount}个
📝 日记: ${stats.diaryCount}篇
🎤 语音: ${stats.audioCount}条
⭐ 里程碑: ${stats.milestones.length}个

感谢使用 #宝贝时光 记录成长~`;
  }, [stats, currentBaby, year, month]);
  
  // 复制分享内容
  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(shareContent);
      showToast('已复制到剪贴板');
    } catch (error) {
      showToast('分享失败', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end">
      <div 
        className="w-full bg-white dark:bg-gray-800 rounded-t-3xl max-h-[90vh] overflow-hidden flex flex-col animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-cream-100 dark:border-gray-700">
          <h2 className="font-bold text-lg text-gray-800 dark:text-white">月度报告</h2>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 月份选择 */}
        <div className="flex items-center justify-between px-4 py-3 bg-cream-50 dark:bg-gray-900/50">
          <button 
            onClick={goToPrevMonth}
            className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <span className="text-lg font-bold text-gray-800 dark:text-white">
              {year}年 {monthNames[month - 1]}
            </span>
            {isCurrentMonth && (
              <span className="ml-2 px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs rounded-full">
                本月
              </span>
            )}
          </div>
          <button 
            onClick={goToNextMonth}
            disabled={isCurrentMonth}
            className={`p-2 ${isCurrentMonth ? 'text-gray-300' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* 统计卡片 */}
              <div className="bg-gradient-to-br from-primary-400 to-primary-500 rounded-2xl p-4 text-white">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  {monthNames[month - 1]}成长数据
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white/20 rounded-xl p-3 text-center">
                    <Camera className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.photoCount}</p>
                    <p className="text-xs opacity-80">照片</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3 text-center">
                    <Video className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.videoCount}</p>
                    <p className="text-xs opacity-80">视频</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3 text-center">
                    <FileText className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.diaryCount}</p>
                    <p className="text-xs opacity-80">日记</p>
                  </div>
                  <div className="bg-white/20 rounded-xl p-3 text-center">
                    <Mic className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-2xl font-bold">{stats.audioCount}</p>
                    <p className="text-xs opacity-80">语音</p>
                  </div>
                </div>
              </div>

              {/* 里程碑事件 */}
              {stats.milestones.length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    里程碑事件
                  </h3>
                  <div className="space-y-2">
                    {stats.milestones.map((m, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 bg-cream-50 dark:bg-gray-700/50 rounded-xl">
                        <span className="text-2xl">
                          {m.milestoneEmoji || milestoneEmojis[m.milestone] || '⭐'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 dark:text-white">
                            {m.milestoneLabel || '里程碑'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(m.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 心情分布 */}
              {Object.keys(stats.moodStats).length > 0 && (
                <div className="card">
                  <h3 className="font-bold text-gray-800 dark:text-white mb-3">心情分布</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.moodStats).map(([mood, count]) => (
                      <span 
                        key={mood}
                        className="px-3 py-1.5 bg-cream-100 dark:bg-gray-700 rounded-full text-sm flex items-center gap-1"
                      >
                        {moodEmojis[mood] || '😊'} {count}次
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 空状态 */}
              {stats.totalMoments === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p>本月还没有记录哦~</p>
                  <p className="text-sm mt-1">快去创造美好的回忆吧！</p>
                </div>
              )}

              {/* 分享按钮 */}
              {stats.totalMoments > 0 && (
                <div className="pt-2">
                  <button
                    onClick={handleShare}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    <Share2 className="w-5 h-5" />
                    分享报告
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
