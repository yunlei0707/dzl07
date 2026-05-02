import React, { useRef, useState } from 'react';
import { useApp } from '../store/AppContext';
import html2canvas from 'html2canvas';

export function ShareCard({ visible, onClose, item }) {
  const cardRef = useRef(null);
  const { user } = useApp();
  const [generating, setGenerating] = useState(false);

  if (!visible) return null;

  const formatTime = (time) => {
    const date = new Date(time);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  const formatType = (type) => {
    const typeMap = {
      video: '视频记录',
      voice: '语音记录',
      diary: '日记记录',
      singleImage: '照片记录',
      multiImage: '相册记录',
    };
    return typeMap[type] || type;
  };

  const handleGenerateImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);
    
    try {
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });
      
      const link = document.createElement('a');
      link.download = `宝贝时光-${item.title || '分享'}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (err) {
      console.error('生成分享图失败:', err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">分享卡片</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          {/* 分享卡片预览 */}
          <div 
            ref={cardRef}
            className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border border-pink-100"
          >
            {/* 头部 */}
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">👶✨</div>
              <h2 className="text-xl font-bold text-pink-600 mb-1">宝贝时光</h2>
              <p className="text-xs text-gray-500">记录成长的每一个瞬间</p>
            </div>
            
            {/* 分割线 */}
            <div className="border-t border-pink-200 my-4"></div>
            
            {/* 记录类型标签 */}
            <div className="text-center mb-3">
              <span className="inline-block bg-pink-100 text-pink-600 text-xs px-3 py-1 rounded-full">
                {formatType(item.type)}
              </span>
            </div>
            
            {/* 标题 */}
            <h3 className="text-lg font-bold text-gray-800 text-center mb-3">
              {item.title || '未命名记录'}
            </h3>
            
            {/* 内容预览 */}
            {item.content && (
              <p className="text-gray-600 text-sm text-center mb-4 line-clamp-3">
                {item.content}
              </p>
            )}
            
            {/* 图片预览 */}
            {item.thumbnail && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img 
                  src={item.thumbnail} 
                  alt={item.title}
                  className="w-full h-40 object-cover"
                />
              </div>
            )}
            
            {/* 时间信息 */}
            <div className="text-center text-sm text-gray-500 mb-2">
              {formatTime(item.date)}
            </div>
            
            {/* 宝宝信息 */}
            {user?.babyName && (
              <div className="text-center text-xs text-gray-400">
                👶 {user.babyName}
              </div>
            )}
            
            {/* 底部水印 */}
            <div className="text-center mt-4 pt-4 border-t border-pink-100">
              <p className="text-xs text-pink-400">
                💝 用爱记录 · 用心珍藏
              </p>
            </div>
          </div>
          
          {/* 操作按钮 */}
          <div className="mt-4 space-y-2">
            <button
              onClick={handleGenerateImage}
              disabled={generating}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium rounded-xl hover:opacity-90 transition disabled:opacity-50"
            >
              {generating ? '生成中...' : '📸 保存分享图片'}
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
