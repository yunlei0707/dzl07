/**
 * 时光盲盒组件
 * 功能：随机弹出一条历史记录，像开盲盒一样有惊喜感
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Play, Pause, RefreshCw } from 'lucide-react';

// 格式化时间
const formatTime2 = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 计算日期差
const getDaysAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays >= 365) {
    const years = Math.floor(diffDays / 365);
    const days = diffDays % 365;
    return `这是 ${years} 年${days > 0 ? ` ${days} 天` : ''}前的回忆`;
  }
  return `这是 ${diffDays} 天前的回忆`;
};

// 加权随机选择算法
function pickRandomMoment(moments) {
  if (!moments || moments.length === 0) return null;
  
  const today = new Date();
  const month = today.getMonth() + 1;
  const day = today.getDate();
  
  // 1. 检查"去年今日"是否有匹配
  const sameDayMoments = moments.filter(m => {
    const d = new Date(m.date);
    return d.getMonth() + 1 === month && d.getDate() === day && d.getFullYear() !== today.getFullYear();
  });
  
  // 2. 如果有"去年今日"的记录，50%概率选它
  if (sameDayMoments.length > 0 && Math.random() < 0.5) {
    const selected = sameDayMoments[Math.floor(Math.random() * sameDayMoments.length)];
    return { moment: selected, isAnniversary: true };
  }
  
  // 3. 加权随机
  const now = Date.now();
  const weighted = moments.map(m => {
    let weight = 1;
    
    // 有照片加权 x3
    if (m.photos && m.photos.length > 0) weight *= 3;
    // 有语音加权 x2
    if (m.audios && m.audios.length > 0) weight *= 2;
    // 有视频加权 x2
    if (m.videos && m.videos.length > 0) weight *= 2;
    
    // 时间越久加权（每30天+1，最多+12）
    const daysDiff = (now - new Date(m.date).getTime()) / (1000 * 60 * 60 * 24);
    weight += Math.min(12, Math.floor(daysDiff / 30));
    
    return { moment: m, weight };
  });
  
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const w of weighted) {
    random -= w.weight;
    if (random <= 0) return { moment: w.moment, isAnniversary: false };
  }
  
  return { moment: weighted[weighted.length - 1].moment, isAnniversary: false };
}

// 音频播放条组件
function AudioPlayer({ audio }) {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);
  
  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(audio.url);
      audioRef.current.onended = () => setPlaying(false);
    }
    
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play();
      setPlaying(true);
    }
  };
  
  return (
    <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 mt-3">
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary-600 transition-colors"
        >
          {playing ? (
            <Pause className="w-5 h-5 text-white" />
          ) : (
            <Play className="w-5 h-5 text-white ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">🎤 语音日记</span>
          </div>
          {/* 简化波形 */}
          <div className="h-4 flex items-center gap-0.5 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary-300 dark:bg-primary-600 rounded-full animate-pulse"
                style={{ 
                  height: `${20 + Math.sin(i * 0.5) * 15 + Math.random() * 30}%`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        </div>
        <span className="text-xs text-gray-500 flex-shrink-0">
          {formatTime2(audio.duration || 0)}
        </span>
      </div>
    </div>
  );
}

// 盲盒卡片组件
function BlindBoxCard({ data, onClose, onRetry, onPhotoClick }) {
  const { moment, isAnniversary } = data;
  
  if (!moment) return null;
  
  // 获取类型图标
  const typeIcons = {
    photo: '📷',
    video: '🎬',
    audio: '🎙️',
    diary: '📝',
  };
  
  // 获取类型标签
  const getTypeLabel = () => {
    const labels = {
      photo: '照片日记',
      video: '视频日记',
      audio: '语音日记',
      diary: '日记'
    };
    return labels[moment.type] || '成长记录';
  };
  
  // 格式化日期
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };
  
  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      
      {/* 卡片 */}
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-blindbox-in"
        onClick={e => e.stopPropagation()}
      >
        {/* 顶部标记 */}
        <div className={`px-4 py-3 text-center ${isAnniversary ? 'bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30' : 'bg-cream-50 dark:bg-gray-700/50'}`}>
          {isAnniversary ? (
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl">🎯</span>
              <span className="text-amber-600 dark:text-amber-400 font-bold text-lg">去年今日</span>
              <span className="text-2xl">🎯</span>
            </div>
          ) : (
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {getDaysAgo(moment.date)}
            </span>
          )}
        </div>
        
        {/* 内容区域 */}
        <div className="p-4">
          {/* 照片 */}
          {(moment.type === 'photo' || moment.photos?.length > 0) && moment.photos?.[0] && (
            <div 
              className="relative rounded-2xl overflow-hidden bg-cream-100 dark:bg-gray-700 aspect-video cursor-pointer group mb-3"
              onClick={() => onPhotoClick && onPhotoClick(moment.photos)}
            >
              <img
                src={moment.photos[0]}
                alt="回忆照片"
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {moment.photos.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  +{moment.photos.length - 1}
                </div>
              )}
            </div>
          )}
          
          {/* 视频封面 */}
          {moment.type === 'video' && moment.videos?.[0] && (
            <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-video mb-3">
              <img
                src={moment.videos[0].cover || moment.videos[0].url}
                alt="视频封面"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-8 h-8 text-white ml-1" />
                </div>
              </div>
            </div>
          )}
          
          {/* 语音 */}
          {moment.audios?.[0] && (
            <AudioPlayer audio={moment.audios[0]} />
          )}
          
          {/* 文字内容 */}
          {moment.content && (
            <div className="mt-3">
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed line-clamp-3">
                {moment.content}
              </p>
            </div>
          )}
          
          {/* 日期和类型 */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-400 dark:text-gray-500">
            <span>{formatDate(moment.date)}</span>
            <span className="flex items-center gap-1">
              {typeIcons[moment.type]} {getTypeLabel()}
            </span>
          </div>
          
          {/* 按钮 */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={onRetry}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-primary-500 to-warm-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform hover:shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
              <span>✨ 再来一次</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 浮动按钮组件
function FloatingButton({ onClick, hasData }) {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    // 延迟显示动画
    const timer = setTimeout(() => setShow(true), 1000);
    return () => clearTimeout(timer);
  }, []);
  
  if (!hasData) return null;
  
  return (
    <button
      onClick={onClick}
      className={`fixed right-4 bottom-28 w-14 h-14 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 rounded-full shadow-lg flex items-center justify-center z-50 active:scale-90 transition-all group
        ${show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      title="时光盲盒"
    >
      {/* 脉冲动画 */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 animate-ping opacity-30" />
      
      {/* 主图标 */}
      <span className="text-2xl relative z-10 animate-bounce-subtle">🎁</span>
      
      {/* Tooltip */}
      <div className="absolute right-full mr-3 px-3 py-1.5 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        时光盲盒
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 border-4 border-transparent border-l-gray-800 dark:border-l-gray-700" />
      </div>
    </button>
  );
}

// 空状态组件
function EmptyState({ onClose }) {
  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />
      
      <div 
        className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 text-center animate-blindbox-in"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">🌱</div>
        <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
          还没有回忆
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          快去记录第一个瞬间吧~<br/>
          未来某天打开盲盒，<br/>
          会收获意想不到的惊喜哦！
        </p>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
        >
          我知道了
        </button>
      </div>
    </div>
  );
}

// 主组件
export function TimeBlindBox({ moments, onPhotoClick }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [isEmpty, setIsEmpty] = useState(false);
  
  // 摇一摇检测
  const shakeRef = useRef({ lastTime: 0, lastX: 0, lastY: 0, lastZ: 0 });
  const debounceRef = useRef(false);
  
  const handleOpen = useCallback(() => {
    if (!moments || moments.length === 0) {
      setIsEmpty(true);
      return;
    }
    
    const result = pickRandomMoment(moments);
    if (result) {
      setSelectedMoment(result);
      setIsOpen(true);
      document.body.style.overflow = 'hidden';
    }
  }, [moments]);
  
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSelectedMoment(null);
    setIsEmpty(false);
    document.body.style.overflow = '';
  }, []);
  
  const handleRetry = useCallback(() => {
    if (!moments || moments.length === 0) return;
    
    // 关闭当前动画
    setIsOpen(false);
    
    // 短暂延迟后重新打开
    setTimeout(() => {
      const result = pickRandomMoment(moments);
      if (result) {
        setSelectedMoment(result);
        setIsOpen(true);
      }
    }, 200);
  }, [moments]);
  
  // 摇一摇检测
  useEffect(() => {
    const shake = shakeRef.current;
    
    // 通用摇一摇处理逻辑
    const handleShakeData = (x, y, z) => {
      if (debounceRef.current) return;
      
      const speed = Math.abs(x - shake.lastX) + Math.abs(y - shake.lastY) + Math.abs(z - shake.lastZ);
      const now = Date.now();
      
      if (speed > 20 && now - shake.lastTime > 500) {
        shake.lastTime = now;
        shake.lastX = x;
        shake.lastY = y;
        shake.lastZ = z;
        
        // 触发摇一摇
        debounceRef.current = true;
        handleOpen();
        
        setTimeout(() => {
          debounceRef.current = false;
        }, 3000);
      } else {
        shake.lastX = x;
        shake.lastY = y;
        shake.lastZ = z;
      }
    };
    
    // 一门APP环境：jsBridge.accelerometer.start(callback) / .stop()
    if (window.jsBridge && window.jsBridge.accelerometer && typeof window.jsBridge.accelerometer.start === 'function') {
      try {
        jsBridge.accelerometer.start(function(x, y, z) {
          handleShakeData(x, y, z);
        });
        return () => {
          try { jsBridge.accelerometer.stop(); } catch(e) {}
        };
      } catch(e) {
        console.warn('[TimeBlindBox] jsBridge.accelerometer.start 失败:', e);
      }
    }
    
    // 浏览器环境：DeviceMotionEvent
    if (typeof DeviceMotionEvent !== 'undefined') {
      // iOS 13+ 需要请求权限
      const handleMotion = (event) => {
        const acc = event.accelerationIncludingGravity;
        if (!acc) return;
        handleShakeData(acc.x || 0, acc.y || 0, acc.z || 0);
      };
      
      window.addEventListener('devicemotion', handleMotion);
      return () => {
        window.removeEventListener('devicemotion', handleMotion);
      };
    }
  }, [handleOpen]);
  
  // 清理
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);
  
  const hasData = moments && moments.length > 0;
  
  return (
    <>
      {/* 浮动按钮 */}
      <FloatingButton onClick={handleOpen} hasData={hasData} />
      
      {/* 盲盒卡片 */}
      {isOpen && selectedMoment && (
        <BlindBoxCard 
          data={selectedMoment} 
          onClose={handleClose} 
          onRetry={handleRetry}
          onPhotoClick={onPhotoClick}
        />
      )}
      
      {/* 空状态 */}
      {isEmpty && <EmptyState onClose={handleClose} />}
    </>
  );
}
