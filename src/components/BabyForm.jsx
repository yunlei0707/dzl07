/**
 * 宝宝档案表单组件
 * 支持系统账号只读模式
 */

import { useState } from 'react';
import { X, User, Camera } from 'lucide-react';

export function BabyForm({ baby, onSave, onCancel, isSystem = false }) {
  // 处理 birthDate 和 birthday 两种字段名
  const initialBirthday = baby?.birthday 
    ? new Date(baby.birthday).toISOString().split('T')[0]
    : baby?.birthDate
      ? new Date(baby.birthDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

  const [name, setName] = useState(baby?.name || '');
  const [nickname, setNickname] = useState(baby?.nickname || '');
  const [gender, setGender] = useState(baby?.gender || 'girl');
  const [birthDate, setBirthDate] = useState(initialBirthday);
  const [avatar, setAvatar] = useState(baby?.avatar || '');
  const [saving, setSaving] = useState(false);
  
  const handleAvatarUpload = (e) => {
    if (isSystem) return;
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAvatar(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSubmit = async () => {
    if (isSystem) return;
    
    if (!name.trim()) {
      alert('请输入宝宝姓名');
      return;
    }
    
    if (saving) return;
    
    setSaving(true);
    
    const babyData = {
      id: baby?.id,
      name: name.trim(),
      nickname: nickname.trim() || name.trim(),
      gender,
      birthday: new Date(birthDate).toISOString(),
      avatar,
    };
    
    try {
      if (typeof onSave === 'function') {
        await onSave(babyData);
      }
      setSaving(false);
    } catch (error) {
      alert('保存失败: ' + error.message);
      setSaving(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-cream-50 dark:bg-gray-900 z-50 overflow-y-auto">
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-cream-200 dark:border-gray-700 z-10 safe-top">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={onCancel} className="p-2 -ml-2">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="font-bold text-gray-800 dark:text-white">
            {isSystem ? '查看宝宝信息' : (baby ? '编辑宝宝信息' : '添加宝宝')}
          </h2>
          {isSystem ? (
            <div className="w-16" />
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-1.5 bg-primary-500 text-white rounded-lg font-medium text-sm hover:bg-primary-600 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          )}
        </div>
      </div>
      
      {/* 系统账号提示 */}
      {isSystem && (
        <div className="mx-4 mt-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
          <p className="text-sm text-amber-700 dark:text-amber-400 text-center">
            ⚠️ 系统账号不可编辑，此为示例数据
          </p>
        </div>
      )}
      
      <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        <div className="flex flex-col items-center">
          <div className={`relative ${!isSystem ? 'cursor-pointer group' : ''}`}>
            <div className="w-28 h-28 rounded-full overflow-hidden bg-cream-100 dark:bg-gray-700 border-4 border-white dark:border-gray-600 shadow-lg">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-300" />
                </div>
              )}
            </div>
            {!isSystem && (
              <>
                <div className="absolute bottom-1 right-1 w-9 h-9 bg-primary-500 rounded-full flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </>
            )}
          </div>
          <p className={`text-sm mt-2 ${isSystem ? 'text-gray-400' : 'text-gray-500'}`}>
            {isSystem ? '系统示例' : '点击更换头像'}
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            宝宝姓名 *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入宝宝姓名"
            disabled={isSystem}
            className={`input-field ${isSystem ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' : ''}`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            小名/昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="输入宝宝小名（选填）"
            disabled={isSystem}
            className={`input-field ${isSystem ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' : ''}`}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            性别
          </label>
          <div className="flex gap-3">
            <button
              onClick={() => !isSystem && setGender('girl')}
              disabled={isSystem}
              className={`flex-1 py-4 rounded-xl font-medium transition-all flex flex-col items-center ${
                gender === 'girl'
                  ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-2 border-pink-400'
                  : 'bg-cream-100 dark:bg-gray-700 text-gray-500 border-2 border-transparent'
              } ${isSystem ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="text-2xl mb-1">👧</span>
              女宝宝
            </button>
            <button
              onClick={() => !isSystem && setGender('boy')}
              disabled={isSystem}
              className={`flex-1 py-4 rounded-xl font-medium transition-all flex flex-col items-center ${
                gender === 'boy'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-400'
                  : 'bg-cream-100 dark:bg-gray-700 text-gray-500 border-2 border-transparent'
              } ${isSystem ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              <span className="text-2xl mb-1">👦</span>
              男宝宝
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            出生日期 *
          </label>
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isSystem}
            className={`input-field ${isSystem ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
