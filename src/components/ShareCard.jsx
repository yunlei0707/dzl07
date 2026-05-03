/**
 * 分享卡片组件
 * 使用html2canvas生成分享图片
 */

import React, { useRef, useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import html2canvas from 'html2canvas';
import { Download, X, Share2 } from 'lucide-react';

export function ShareCard({ 
  visible, 
  onClose, 
  data,
  title,
  content,
  babyName,
  date,
  type,
  thumbnail,
  mood,
  milestone 
}) {
  const cardRef = useRef(null);
  const [generating, setGenerating] = useState(false);

  // 格式化日期
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  // 获取类型标签
  const getTypeLabel = (type) => {
    const typeMap = {
      photo: '📷 照片记录',
      video: '🎬 视频记录',
      audio: '🎙️ 语音记录',
      diary: '📝 日记记录',
    };
    return typeMap[type] || '📝 成长记录';
  };

  // 获取心情emoji
  const getMoodEmoji = (moodId) => {
    const moodMap = {
      happy: '😊',
      excited: '🎉',
      touched: '🥰',
      sleepy: '😴',
      crying: '😢',
      angry: '😠',
    };
    return moodMap[moodId] || '';
  };

  // 生成分享图片
  const handleGenerateImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `宝贝时光-${babyName || '分享'}-${formatDate(date || new Date())}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('生成分享图失败:', err);
    } finally {
      setGenerating(false);
    }
  };

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-sm w-full max-h-[90vh] overflow-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-pink-500" />
            分享卡片
          </h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        
        <div className="p-4">
          {/* 分享卡片预览 - 这个div会被html2canvas捕获 */}
          <div 
            ref={cardRef}
            className="bg-gradient-to-br from-pink-50 via-white to-purple-50 rounded-xl p-5 border border-pink-100 shadow-sm"
          >
            {/* 头部品牌 */}
            <div className="text-center mb-4">
              <div className="text-2xl mb-1">👶✨</div>
              <h2 className="text-xl font-bold text-pink-500">宝贝时光</h2>
              <p className="text-xs text-gray-400">记录成长的每一个瞬间</p>
            </div>
            
            {/* 分割线 */}
            <div className="border-t border-pink-200 my-4" />
            
            {/* 类型标签 */}
            <div className="text-center mb-3">
              <span className="inline-block bg-gradient-to-r from-pink-100 to-purple-100 text-pink-600 text-xs px-3 py-1 rounded-full font-medium">
                {getTypeLabel(type)}
              </span>
            </div>
            
            {/* 宝宝名称 */}
            {babyName && (
              <div className="text-center mb-2">
                <span className="text-sm font-medium text-gray-600">
                  👶 {babyName}
                </span>
              </div>
            )}
            
            {/* 标题 */}
            {(title || data?.title) && (
              <h3 className="text-base font-bold text-gray-800 text-center mb-3">
                {title || data?.title}
              </h3>
            )}
            
            {/* 内容预览 */}
            {(content || data?.content) && (
              <p className="text-sm text-gray-600 text-center mb-4 leading-relaxed">
                {content || data?.content}
              </p>
            )}
            
            {/* 图片预览 */}
            {(thumbnail || data?.thumbnail || data?.photos?.[0]) && (
              <div className="mb-4 rounded-lg overflow-hidden shadow-sm">
                <img 
                  src={thumbnail || data?.thumbnail || data?.photos?.[0]} 
                  alt="分享图片"
                  className="w-full h-36 object-cover"
                  crossOrigin="anonymous"
                />
              </div>
            )}
            
            {/* 心情和里程碑标签 */}
            {(mood || data?.mood || milestone || data?.milestone) && (
              <div className="flex justify-center gap-2 mb-3">
                {mood || data?.mood ? (
                  <span className="inline-flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs px-2 py-1 rounded-full">
                    {getMoodEmoji(mood || data?.mood)} 心情
                  </span>
                ) : null}
                {milestone || data?.milestone ? (
                  <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-600 text-xs px-2 py-1 rounded-full">
                    ⭐ {data?.milestoneLabel || milestone}
                  </span>
                ) : null}
              </div>
            )}
            
            {/* 日期信息 */}
            <div className="text-center text-sm text-gray-500 mb-2">
              {formatDate(date || data?.date || new Date())}
            </div>
            
            {/* 底部水印 */}
            <div className="text-center mt-4 pt-3 border-t border-pink-100">
              <p className="text-xs text-pink-400 flex items-center justify-center gap-1">
                💝 用爱记录 · 用心珍藏
              </p>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleGenerateImage}
              disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              {generating ? '生成中...' : '保存分享图片'}
            </button>
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 text-gray-600 font-medium rounded-xl hover:bg-gray-200 transition"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShareCard;
