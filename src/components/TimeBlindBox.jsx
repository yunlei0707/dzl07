/**
 * 时光盲盒组件
 * 随机从时光轴弹出一条历史记录的精美卡片
 * 加权随机：照片x3权重、语音x2、时间越久越容易被选中、50%概率命中"去年今日"
 * 支持生成分享图片（html2canvas）
 */

import { useState, useCallback, useRef } from 'react';
import html2canvas from 'html2canvas';
import { X, Download, Image as ImageIcon } from 'lucide-react';

// 格式化日期显示
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays}天前`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
  
  const years = Math.floor(diffDays / 365);
  const remainMonths = Math.floor((diffDays % 365) / 30);
  return remainMonths > 0 ? `${years}年${remainMonths}个月前` : `${years}年前`;
};

const formatFullDate = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
};

// 加权随机选择
const weightedRandom = (moments) => {
  if (!moments || moments.length === 0) return null;
  
  const now = new Date();
  
  // 50%概率尝试命中"去年今日"附近（±3天）
  if (Math.random() < 0.5) {
    const lastYear = now.getFullYear() - 1;
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();
    
    const nearbyMoments = moments.filter(m => {
      const d = new Date(m.date || m.createdAt);
      return d.getFullYear() === lastYear &&
             Math.abs(d.getMonth() - todayMonth) <= 0 &&
             Math.abs(d.getDate() - todayDate) <= 3;
    });
    
    if (nearbyMoments.length > 0) {
      return nearbyMoments[Math.floor(Math.random() * nearbyMoments.length)];
    }
  }
  
  const weighted = moments.map(m => {
    let weight = 1;
    if (m.type === 'photo' || (m.photos && m.photos.length > 0)) weight *= 3;
    if (m.type === 'audio') weight *= 2;
    if (m.milestone) weight *= 2;
    const ageDays = Math.floor((now - new Date(m.date || m.createdAt)) / 86400000);
    weight *= (1 + ageDays / 365);
    return { moment: m, weight };
  });
  
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { moment, weight } of weighted) {
    random -= weight;
    if (random <= 0) return moment;
  }
  
  return weighted[weighted.length - 1].moment;
};

// 心情图标映射
const moodIcons = {
  happy: '😊', excited: '🎉', touched: '🥹', calm: '😌',
  sad: '😢', angry: '😠', surprised: '😲', love: '❤️',
};

export function TimeBlindBox({ moments, babyName = '宝宝' }) {
  const [showCard, setShowCard] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [shareImage, setShareImage] = useState(null);
  const [generating, setGenerating] = useState(false);
  const shareCardRef = useRef(null);

  // 点击按钮开盲盒
  const handleClick = useCallback(() => {
    if (!moments || moments.length === 0) return;
    if (showCard) return;
    
    const selected = weightedRandom(moments);
    setSelectedMoment(selected);
    setShowCard(true);
    setShareImage(null);
  }, [moments, showCard]);

  // 再来一次
  const handleAgain = useCallback(() => {
    setShowCard(false);
    setSelectedMoment(null);
    setShareImage(null);
    setTimeout(() => {
      const selected = weightedRandom(moments);
      setSelectedMoment(selected);
      setShowCard(true);
    }, 300);
  }, [moments]);

  // 关闭弹窗
  const handleClose = useCallback(() => {
    setShowCard(false);
    setSelectedMoment(null);
    setShareImage(null);
  }, []);

  // 生成分享图片
  const generateShareImage = async () => {
    if (!shareCardRef?.current) return;
    
    setGenerating(true);
    try {
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
        logging: false
      });
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setShareImage(dataUrl);
    } catch (error) {
      console.error('生成分享图片失败:', error);
    } finally {
      setGenerating(false);
    }
  };

  // 下载图片
  const downloadImage = () => {
    if (!shareImage) return;
    const link = document.createElement('a');
    link.download = `时光盲盒_${Date.now()}.png`;
    link.href = shareImage;
    link.click();
  };

  const hasMoments = moments && moments.length > 0;

  return (
    <>
      {/* 盲盒按钮 - 右上角带文字 */}
      <button
        onClick={handleClick}
        disabled={!hasMoments}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
          hasMoments 
            ? 'bg-white/25 hover:bg-white/40 active:scale-95' 
            : 'bg-white/10 opacity-50'
        }`}
      >
        <span className="text-sm">🎁</span>
        <span className="text-xs font-medium text-white">时光盲盒</span>
      </button>

      {/* 盲盒卡片弹窗 */}
      {showCard && selectedMoment && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6 animate-fade-in"
          onClick={handleClose}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
            onClick={e => e.stopPropagation()}
          >
            {/* 关闭按钮 - 右上角X */}
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 w-7 h-7 rounded-full bg-black/30 flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 用于截图的卡片区域 */}
            <div ref={shareCardRef}>
              {/* 卡片头部 */}
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-5 py-4 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/80 text-xs">✨ 时光盲盒</p>
                    <p className="text-white font-bold text-lg mt-0.5">{formatFullDate(selectedMoment.date || selectedMoment.createdAt)}</p>
                  </div>
                  <div className="text-white/60 text-xs">{formatDate(selectedMoment.date || selectedMoment.createdAt)}</div>
                </div>
                {selectedMoment.milestone && selectedMoment.milestoneLabel && (
                  <div className="mt-2">
                    <span className="inline-block bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
                      🏆 {selectedMoment.milestoneLabel}
                    </span>
                  </div>
                )}
              </div>

              {/* 卡片内容 */}
              <div className="p-5">
                {/* 照片展示 */}
                {selectedMoment.photos && selectedMoment.photos.length > 0 && (
                  <div className={`grid gap-2 mb-3 ${
                    selectedMoment.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                  }`}>
                    {selectedMoment.photos.slice(0, 4).map((photo, idx) => (
                      <div key={idx} className="relative rounded-xl overflow-hidden aspect-square">
                        <img 
                          src={photo} 
                          alt="" 
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                        {idx === 3 && selectedMoment.photos.length > 4 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold">
                            +{selectedMoment.photos.length - 4}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 类型标识 */}
                <div className="flex items-center gap-2 mb-2">
                  {selectedMoment.type === 'audio' && (
                    <span className="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                      🎙️ 语音
                    </span>
                  )}
                  {selectedMoment.type === 'video' && (
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                      🎬 视频
                    </span>
                  )}
                  {selectedMoment.mood && (
                    <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                      {moodIcons[selectedMoment.mood] || '😊'} 心情
                    </span>
                  )}
                </div>

                {/* 文字内容 */}
                {selectedMoment.content && (
                  <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                    {selectedMoment.content}
                  </p>
                )}

                {!selectedMoment.content && (!selectedMoment.photos || selectedMoment.photos.length === 0) && (
                  <p className="text-gray-400 text-sm italic">这条记录没有文字描述</p>
                )}

                {/* 水印 */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 text-center">
                  <span className="text-xs text-gray-400">✨ 宝贝时光 - 用心记录每一个成长瞬间</span>
                </div>
              </div>
            </div>

            {/* 底部操作区 */}
            <div className="px-5 pb-5 space-y-2">
              {/* 分享图片区 */}
              {shareImage ? (
                <div className="space-y-2">
                  <div className="relative rounded-xl overflow-hidden bg-gray-100">
                    <img src={shareImage} alt="分享图片" className="w-full h-auto" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAgain}
                      className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm active:scale-95 transition-transform"
                    >
                      ✨ 再来一次
                    </button>
                    <button
                      onClick={downloadImage}
                      className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform flex items-center justify-center gap-1"
                    >
                      <Download className="w-4 h-4" />
                      下载图片
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleAgain}
                    className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform"
                  >
                    ✨ 再来一次
                  </button>
                  <button
                    onClick={generateShareImage}
                    disabled={generating}
                    className="flex-1 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform flex items-center justify-center gap-1 disabled:opacity-50"
                  >
                    {generating ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        生成中...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        生成图片
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
