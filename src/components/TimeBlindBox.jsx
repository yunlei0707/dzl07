/**
 * 时光盲盒组件
 * 随机从时光轴弹出一条历史记录的精美卡片
 * 支持摇一摇（APP用jsBridge加速度计，浏览器用DeviceMotionEvent）
 * 加权随机：照片x3权重、语音x2、时间越久越容易被选中、50%概率命中"去年今日"
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { isInApp } from '../utils/jsBridge';

// 格式化日期显示
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  
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
  
  // 计算权重
  const weighted = moments.map(m => {
    let weight = 1;
    
    // 照片记录权重x3
    if (m.type === 'photo' || (m.photos && m.photos.length > 0)) weight *= 3;
    // 语音记录权重x2
    if (m.type === 'audio') weight *= 2;
    // 里程碑权重x2
    if (m.milestone) weight *= 2;
    // 时间越久越容易被选中
    const ageDays = Math.floor((now - new Date(m.date || m.createdAt)) / 86400000);
    weight *= (1 + ageDays / 365);
    
    return { moment: m, weight };
  });
  
  // 加权随机
  const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const { moment, weight } of weighted) {
    random -= weight;
    if (random <= 0) return moment;
  }
  
  return weighted[weighted.length - 1].moment;
};

export function TimeBlindBox({ moments, onOpen }) {
  const [showCard, setShowCard] = useState(false);
  const [selectedMoment, setSelectedMoment] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const shakeTimerRef = useRef(null);
  const lastShakeRef = useRef(0);
  const accelStopRef = useRef(null);

  // 上一帧加速度值（用于计算变化量）
  const lastAccRef = useRef({ x: 0, y: 0, z: 0, time: 0 });

  // 摇一摇检测 - APP环境
  const startAppAccelerometer = useCallback(() => {
    if (!isInApp()) return false;
    
    try {
      const jsBridge = window.jsBridge;
      if (!jsBridge?.accelerometer || typeof jsBridge.accelerometer.start !== 'function') {
        console.log('[TimeBlindBox] APP环境但accelerometer不可用');
        return false;
      }

      // 检查是否支持
      if (typeof jsBridge.accelerometer.support === 'function') {
        jsBridge.accelerometer.support((supported) => {
          if (!supported) {
            console.log('[TimeBlindBox] 加速度计不支持');
            return;
          }
        });
      }

      // 用变化量检测摇晃，和shake.js原理一致
      // 静止时x+y+z ≈ 10（重力），摇动时变化量会很大
      const SHAKE_THRESHOLD = 3.0; // 变化量阈值（g），约3倍重力加速度变化
      
      jsBridge.accelerometer.start(function(x, y, z) {
        const last = lastAccRef.current;
        const now = Date.now();
        
        // 计算与上一帧的变化量
        const deltaX = Math.abs(x - last.x);
        const deltaY = Math.abs(y - last.y);
        const deltaZ = Math.abs(z - last.z);
        
        // 任意两个轴变化超过阈值即为摇晃
        if ((deltaX > SHAKE_THRESHOLD && deltaY > SHAKE_THRESHOLD) ||
            (deltaX > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD) ||
            (deltaY > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD)) {
          if (now - lastShakeRef.current > 3000) {
            lastShakeRef.current = now;
            console.log('[TimeBlindBox] APP摇一摇触发, delta:', deltaX.toFixed(2), deltaY.toFixed(2), deltaZ.toFixed(2));
            handleShake();
          }
        }
        
        lastAccRef.current = { x, y, z, time: now };
      });

      // 保存停止函数
      accelStopRef.current = () => {
        try {
          if (typeof jsBridge.accelerometer.stop === 'function') {
            jsBridge.accelerometer.stop();
          }
        } catch (e) {
          console.log('[TimeBlindBox] stop accelerometer error:', e);
        }
      };
      
      return true;
    } catch (e) {
      console.log('[TimeBlindBox] accelerometer error:', e);
      return false;
    }
  }, []);

  // 摇一摇检测 - 浏览器环境
  useEffect(() => {
    if (isInApp()) return; // APP环境用jsBridge

    const SHAKE_THRESHOLD = 3.0;
    const browserLastAcc = { x: 0, y: 0, z: 0 };

    const handleMotion = (e) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      
      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;
      
      const deltaX = Math.abs(x - browserLastAcc.x);
      const deltaY = Math.abs(y - browserLastAcc.y);
      const deltaZ = Math.abs(z - browserLastAcc.z);
      
      if ((deltaX > SHAKE_THRESHOLD && deltaY > SHAKE_THRESHOLD) ||
          (deltaX > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD) ||
          (deltaY > SHAKE_THRESHOLD && deltaZ > SHAKE_THRESHOLD)) {
        const now = Date.now();
        if (now - lastShakeRef.current > 3000) {
          lastShakeRef.current = now;
          console.log('[TimeBlindBox] 浏览器摇一摇触发, delta:', deltaX.toFixed(2), deltaY.toFixed(2), deltaZ.toFixed(2));
          handleShake();
        }
      }
      
      browserLastAcc.x = x;
      browserLastAcc.y = y;
      browserLastAcc.z = z;
    };

    // iOS 13+ 需要请求权限
    if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
      DeviceMotionEvent.requestPermission().then(state => {
        if (state === 'granted') {
          window.addEventListener('devicemotion', handleMotion);
        }
      }).catch(() => {});
    } else if (typeof DeviceMotionEvent !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion);
    }

    return () => {
      window.removeEventListener('devicemotion', handleMotion);
    };
  }, []);

  // APP环境启动加速度计
  useEffect(() => {
    startAppAccelerometer();
    return () => {
      if (accelStopRef.current) {
        accelStopRef.current();
        accelStopRef.current = null;
      }
    };
  }, []);

  // 摇一摇/点击触发开盲盒
  const handleShake = useCallback(() => {
    if (!moments || moments.length === 0) return;
    if (showCard) return; // 已经开了一个
    
    setIsShaking(true);
    
    // 模拟摇晃动画
    setTimeout(() => {
      const selected = weightedRandom(moments);
      setSelectedMoment(selected);
      setShowCard(true);
      setIsShaking(false);
    }, 600);
  }, [moments, showCard]);

  // 点击按钮开盲盒
  const handleClick = useCallback(() => {
    if (!moments || moments.length === 0) return;
    handleShake();
  }, [moments, handleShake]);

  // 再来一次
  const handleAgain = useCallback(() => {
    setShowCard(false);
    setSelectedMoment(null);
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
  }, []);

  const hasMoments = moments && moments.length > 0;

  return (
    <>
      {/* 盲盒按钮 - 右上角内嵌小按钮 */}
      <button
        onClick={handleClick}
        disabled={!hasMoments}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          hasMoments 
            ? 'bg-white/25 hover:bg-white/40 active:scale-90' 
            : 'bg-white/10 opacity-50'
        }`}
        title="时光盲盒"
      >
        <span className="text-sm">🎁</span>
      </button>

      {/* 摇晃提示动画 */}
      {isShaking && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60] pointer-events-none">
          <div className="animate-bounce text-5xl">🎁</div>
        </div>
      )}

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
            {/* 卡片头部 */}
            <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 px-5 py-4">
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
                    {selectedMoment.mood === 'happy' ? '😊' : selectedMoment.mood === 'excited' ? '🎉' : selectedMoment.mood === 'touched' ? '🥰' : selectedMoment.mood === 'sleepy' ? '😴' : selectedMoment.mood === 'crying' ? '😢' : selectedMoment.mood === 'angry' ? '😠' : '😊'} 心情
                  </span>
                )}
              </div>

              {/* 文字内容 */}
              {selectedMoment.content && (
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {selectedMoment.content}
                </p>
              )}

              {/* 无内容提示 */}
              {!selectedMoment.content && (!selectedMoment.photos || selectedMoment.photos.length === 0) && (
                <p className="text-gray-400 text-sm italic">这条记录没有文字描述</p>
              )}
            </div>

            {/* 底部操作 */}
            <div className="px-5 pb-5 flex gap-3">
              <button
                onClick={handleAgain}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium text-sm active:scale-95 transition-transform"
              >
                ✨ 再来一次
              </button>
              <button
                onClick={handleClose}
                className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-xl text-sm active:scale-95 transition-transform"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
