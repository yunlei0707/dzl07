/**
 * 动态编辑表单组件 - 极简测试版
 */

import { useState } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../store/AppContext';

export function MomentForm({ moment, onSave, onCancel, babyId }) {
  const [content, setContent] = useState(moment?.content || '');
  
  const handleSubmit = () => {
    onSave({
      babyId,
      type: 'photo',
      date: new Date().toISOString(),
      content,
      photos: [],
      videos: [],
      audios: [],
    });
  };

  return (
    <div className="fixed inset-0 bg-white z-50">
      <div className="flex items-center justify-between px-4 h-14 border-b">
        <button onClick={onCancel} className="p-2">
          <X className="w-6 h-6" />
        </button>
        <span className="font-medium">添加动态</span>
        <button onClick={handleSubmit} className="px-4 py-1.5 bg-blue-500 text-white rounded-lg">
          保存
        </button>
      </div>
      <div className="p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写点什么..."
          className="w-full h-40 p-3 border rounded-xl"
        />
      </div>
    </div>
  );
}
