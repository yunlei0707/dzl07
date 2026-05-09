/**
 * 月龄神预言全屏页面
 * 基于宝宝月龄展示趣味预言
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { X, Sparkles, RefreshCw } from 'lucide-react';
import { 
  babyPredictions, 
  predictionsByMonth, 
  predictionTypes 
} from '../data/babyPredictions';
import { getCurrentBabyInfo } from '../utils/dbV2';
import { useApp } from '../store/AppContext';

// 根据月龄和种子随机选择
function seededRandom(seed, max) {
  const x = Math.sin(seed) * 10000;
  return Math.floor((x - Math.floor(x)) * max);
}

// 计算宝宝月龄
function calculateBabyMonthAge() {
  try {
    const babyInfo = getCurrentBabyInfo();
    if (!babyInfo?.birthDate) return 12; // 默认12个月
    
    const birthDate = new Date(babyInfo.birthDate);
    const today = new Date();
    const monthsDiff = (today.getFullYear() - birthDate.getFullYear()) * 12 
      + (today.getMonth() - birthDate.getMonth());
    const dayDiff = today.getDate() - birthDate.getDate();
    
    // 如果天数差为负，说明还没到生日那天，月龄要减1
    return dayDiff < 0 ? Math.max(0, monthsDiff - 1) : monthsDiff;
  } catch {
    return 12;
  }
}

// 生成指定月龄的预言（随机抽取3条）
function generatePredictionsForMonth(monthAge, babyId, existingPredictions = []) {
  // 如果已有预言，返回已有预言
  if (existingPredictions.length > 0) {
    return existingPredictions;
  }
  
  const monthPredictions = predictionsByMonth[monthAge] || [];
  if (monthPredictions.length === 0) return [];
  
  // 用月龄和宝宝ID作为种子，确保同一宝宝同月龄看到一样
  const seed = parseInt(babyId?.replace(/\D/g, '') || '1') + monthAge;
  
  // 随机选择3条预言
  const selected = [];
  const usedIndices = new Set();
  
  for (let i = 0; i < Math.min(3, monthPredictions.length); i++) {
    let index;
    do {
      index = seededRandom(seed + i * 7, monthPredictions.length);
    } while (usedIndices.has(index));
    
    usedIndices.add(index);
    selected.push({
      ...monthPredictions[index],
      id: `pred_${babyId}_${monthAge}_${i}`,
      generatedAt: new Date().toISOString().split('T')[0],
      status: 'pending', // pending / fulfilled / failed
    });
  }
  
  return selected;
}

// 预言卡片组件
function PredictionCard({ prediction, babyName, monthAge, onToggleStatus }) {
  const typeConfig = predictionTypes[prediction.type] || predictionTypes.behavior;
  const statusIcons = {
    pending: { icon: '⏳', label: '等待中' },
    fulfilled: { icon: '✅', label: '已应验' },
    failed: { icon: '❌', label: '没应验' },
  };
  const statusInfo = statusIcons[prediction.status] || statusIcons.pending;
  
  const handleCardClick = () => {
    // 循环状态：pending -> fulfilled -> failed -> pending
    const statusOrder = ['pending', 'fulfilled', 'failed'];
    const currentIndex = statusOrder.indexOf(prediction.status);
    const nextStatus = statusOrder[(currentIndex + 1) % 3];
    onToggleStatus(prediction.id, nextStatus);
  };
  
  return (
    <div 
      className={`
        relative p-4 rounded-2xl 
        bg-gradient-to-r ${typeConfig.gradient}
        border-2 ${typeConfig.borderColor}
        cursor-pointer
        transition-all duration-200
        hover:scale-[1.02] hover:shadow-lg
        active:scale-[0.98]
        ${prediction.status === 'fulfilled' ? 'ring-2 ring-green-400' : ''}
        ${prediction.status === 'failed' ? 'opacity-60' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* 类型标签 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{prediction.emoji}</span>
        <span className={`text-sm font-medium ${typeConfig.iconColor} bg-white/50 px-2 py-0.5 rounded-full`}>
          {typeConfig.label}
        </span>
      </div>
      
      {/* 预言内容 */}
      <p className="text-gray-700 text-base leading-relaxed mb-3">
        {prediction.content}
      </p>
      
      {/* 专属标记 */}
      <div className="text-xs text-gray-400 mb-3">
        {babyName} · {monthAge}个月专属
      </div>
      
      {/* 状态切换 */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-1.5 text-sm ${prediction.status === 'fulfilled' ? 'text-green-600' : prediction.status === 'failed' ? 'text-red-400' : 'text-gray-500'}`}>
          <span className="text-lg">{statusIcons[prediction.status].icon}</span>
          <span>{statusInfo.label}</span>
        </div>
        <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
          点击切换
        </span>
      </div>
    </div>
  );
}

export function PredictionPage({ onClose }) {
  const { showToast } = useApp();
  const [currentMonthAge, setCurrentMonthAge] = useState(() => calculateBabyMonthAge());
  const [predictions, setPredictions] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthAge);
  const [isLoading, setIsLoading] = useState(true);
  
  // 获取宝宝信息
  const babyInfo = useMemo(() => {
    try {
      return getCurrentBabyInfo();
    } catch {
      return null;
    }
  }, []);
  
  const babyName = babyInfo?.name || '宝宝';
  const babyId = babyInfo?.id || 'default';
  
  // 计算宝宝当前月龄
  useEffect(() => {
    const monthAge = calculateBabyMonthAge();
    setCurrentMonthAge(monthAge);
    if (selectedMonth === currentMonthAge) {
      setSelectedMonth(monthAge);
    }
  }, []);
  
  // 从localStorage加载预言
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      try {
        const storageKey = `babyPredictions_${babyId}`;
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const allPredictions = JSON.parse(stored);
          const monthPredictions = allPredictions.filter(p => p.monthAge === selectedMonth);
          setPredictions(monthPredictions);
        } else {
          setPredictions([]);
        }
      } catch (e) {
        console.error('[PredictionPage] 加载预言失败:', e);
        setPredictions([]);
      }
      setIsLoading(false);
    }, 100); // 100ms防抖，避免快速切换时频繁读取
    
    return () => clearTimeout(timer);
  }, [babyId, selectedMonth]);
  
  // 生成新预言
  const handleGenerate = useCallback(() => {
    // 检查是否已有该月龄的预言（换一组时重新生成）
    const storageKey = `babyPredictions_${babyId}`;
    let existing = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const all = JSON.parse(stored);
        existing = all.filter(p => p.monthAge === selectedMonth);
      }
    } catch {}
    
    // 从预言池中随机抽取3条（换一组时传空数组以强制重新生成）
    const newPredictions = generatePredictionsForMonth(selectedMonth, babyId, []);
    
    if (newPredictions.length === 0) {
      showToast('该月龄暂无可用预言', 'error');
      return;
    }
    
    // 保存到localStorage
    try {
      const storageKey = `babyPredictions_${babyId}`;
      const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      // 移除该月龄的旧预言
      const filtered = existing.filter(p => p.monthAge !== selectedMonth);
      
      // 添加新预言
      const updated = [...filtered, ...newPredictions];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      
      setPredictions(newPredictions);
      showToast('✨ 预言已生成，看看准不准！');
    } catch (e) {
      console.error('[PredictionPage] 保存预言失败:', e);
      showToast('生成失败', 'error');
    }
  }, [selectedMonth, babyId, showToast]);
  
  // 切换预言状态
  const handleToggleStatus = useCallback((predictionId, newStatus) => {
    try {
      const storageKey = `babyPredictions_${babyId}`;
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      
      const allPredictions = JSON.parse(stored);
      const updated = allPredictions.map(p => 
        p.id === predictionId ? { ...p, status: newStatus } : p
      );
      
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setPredictions(prev => prev.map(p => 
        p.id === predictionId ? { ...p, status: newStatus } : p
      ));
    } catch (e) {
      console.error('[PredictionPage] 更新状态失败:', e);
    }
  }, [babyId]);
  
  // 统计数据
  const stats = useMemo(() => {
    const total = predictions.length;
    const fulfilled = predictions.filter(p => p.status === 'fulfilled').length;
    const rate = total > 0 ? Math.round((fulfilled / total) * 100) : 0;
    return { total, fulfilled, rate };
  }, [predictions]);
  
  // 月龄选择范围（精简显示）
  const monthOptions = useMemo(() => {
    const options = new Set();
    // 0-12月每月显示
    for (let i = 0; i <= 12; i++) options.add(i);
    // 13-24月每3月
    for (let i = 15; i <= 24; i += 3) options.add(i);
    // 25-36月每6月
    for (let i = 30; i <= 36; i += 6) options.add(i);
    // 确保当前月龄在列表中
    options.add(currentMonthAge);
    return [...options].sort((a, b) => a - b);
  }, [currentMonthAge]);
  
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-indigo-50 via-purple-50 to-pink-50 z-[70] flex flex-col animate-fade-in">
      {/* 顶部导航栏 */}
      <div className="bg-white/80 backdrop-blur-md border-b border-purple-100 safe-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <h1 className="text-lg font-bold text-gray-800">月龄神预言</h1>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-purple-100 transition-colors"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* 月龄选择器 */}
      <div className="px-4 py-3 bg-white/50">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
          <span className="text-sm text-gray-500 flex-shrink-0">月龄：</span>
          {monthOptions.map(month => (
            <button
              key={month}
              onClick={() => setSelectedMonth(month)}
              className={`
                px-3 py-1.5 rounded-full text-sm font-medium flex-shrink-0 transition-all
                ${selectedMonth === month 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                  : 'bg-white text-gray-600 hover:bg-purple-50'}
              `}
            >
              {month}月
            </button>
          ))}
        </div>
      </div>
      
      {/* 当前月龄大字展示 */}
      <div className="px-4 py-6 text-center">
        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg">
          <span className="text-4xl">👶</span>
          <div className="text-left">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {selectedMonth}个月
            </div>
            <div className="text-sm text-gray-500">
              {babyName}的成长预言
            </div>
          </div>
        </div>
      </div>
      
      {/* 预言列表 */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center">
              <span className="text-5xl">🔮</span>
            </div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              还没有关于{selectedMonth}个月的预言
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              点击下方按钮，看看{selectedMonth}个月的宝宝会有什么神奇表现！
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all active:scale-95"
            >
              <Sparkles className="w-5 h-5" />
              生成神预言
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 重新生成按钮 */}
            <button
              onClick={handleGenerate}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/80 hover:bg-white rounded-xl text-purple-600 text-sm font-medium transition-colors border border-purple-200"
            >
              <RefreshCw className="w-4 h-4" />
              换一组预言
            </button>
            
            {/* 预言卡片列表 */}
            <div className="space-y-4">
              {predictions.map(prediction => (
                <PredictionCard
                  key={prediction.id}
                  prediction={prediction}
                  babyName={babyName}
                  monthAge={selectedMonth}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 底部统计 */}
      {predictions.length > 0 && (
        <div className="px-4 py-4 bg-white/80 backdrop-blur-md border-t border-purple-100 safe-bottom">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                <div className="text-xs text-gray-500">总预言</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.fulfilled}</div>
                <div className="text-xs text-gray-500">已应验</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.rate}%</div>
                <div className="text-xs text-gray-500">命中率</div>
              </div>
            </div>
            
            {stats.fulfilled > 0 && (
              <div className="text-sm text-green-600 font-medium animate-bounce">
                🎉 太准了！
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
