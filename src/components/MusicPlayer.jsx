/**
 * 音乐播放器组件
 * 纯本地上传，支持分类管理
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, 
  Plus, Music, X, ChevronDown, Tag, Trash2, Settings
} from 'lucide-react';
import { useMusic } from '../store/MusicContext';

export function MusicPlayer() {
  const { 
    playlist, 
    filteredPlaylist,
    currentMusic, 
    isPlaying, 
    volume,
    isMuted,
    selectedCategory,
    allCategories,
    togglePlay,
    playPrev,
    playNext,
    playMusic,
    addLocalMusic,
    deleteMusic,
    updateMusicCategory,
    addCustomCategory,
    setVolume,
    toggleMute,
    setSelectedCategory,
  } = useMusic();

  const fileInputRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(null);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // 处理文件选择
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('audio/')) {
        addLocalMusic(file, selectedCategory === 'all' ? 'piano' : selectedCategory);
      }
    });
    e.target.value = '';
  };

  // 快速添加分类
  const handleAddCategory = () => {
    if (newCategoryName.trim()) {
      addCustomCategory(newCategoryName.trim());
      setNewCategoryName('');
      setShowAddCategory(false);
    }
  };

  return (
    <>
      {/* 底部播放器条 */}
      <div className="fixed bottom-16 left-0 right-0 z-40 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border-t border-gray-100 dark:border-gray-700">
        {currentMusic ? (
          <div className="max-w-lg mx-auto px-4 py-2">
            <div className="flex items-center gap-3">
              {/* 播放/暂停 */}
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white shadow-md flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              
              {/* 音乐信息 */}
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setIsExpanded(true)}
              >
                <p className="text-sm font-medium text-gray-800 dark:text-white truncate">
                  {currentMusic.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {allCategories.find(c => c.id === currentMusic.category)?.name || '其他'}
                </p>
              </div>
              
              {/* 上一首/下一首 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button 
                  onClick={playPrev}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary-500"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button 
                  onClick={playNext}
                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-primary-500"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (selectedCategory !== 'all' ? (
          /* 没有音乐且不是全部分类时显示上传按钮 */
          <div className="max-w-lg mx-auto px-4 py-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 bg-gradient-to-r from-primary-500 to-pink-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" />
              添加音乐
            </button>
          </div>
        ) : null)}
      </div>

      {/* 展开的播放器面板 */}
      {isExpanded && currentMusic && (
        <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900">
          {/* 顶部栏 */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <button 
              onClick={() => setIsExpanded(false)}
              className="w-10 h-10 flex items-center justify-center"
            >
              <ChevronDown className="w-6 h-6 text-gray-500" />
            </button>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              播放列表
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-10 h-10 flex items-center justify-center text-primary-500"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* 唱片封面+播放控制 */}
          <div className="px-8 py-8 flex flex-col items-center border-b border-gray-100 dark:border-gray-800">
            <div className="w-40 h-40 rounded-full bg-gradient-to-br from-primary-400 to-pink-500 flex items-center justify-center shadow-2xl mb-6">
              <span className="text-5xl">{currentMusic.cover}</span>
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center mb-6">
              {currentMusic.title}
            </h3>
            <div className="flex items-center justify-center gap-8">
              <button 
                onClick={playPrev}
                className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-500"
              >
                <SkipBack className="w-6 h-6" />
              </button>
              <button 
                onClick={togglePlay}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center text-white shadow-xl"
              >
                {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
              </button>
              <button 
                onClick={playNext}
                className="w-12 h-12 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-500"
              >
                <SkipForward className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* 分类标签 */}
          <div className="px-4 mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {allCategories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
              <button
                onClick={() => setShowAddCategory(true)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500"
              >
                <Plus className="w-4 h-4 inline mr-1" /> 新建
              </button>
            </div>
          </div>

          {/* 播放列表 */}
          <div className="flex-1 overflow-y-auto px-4">
            {filteredPlaylist.length > 0 ? (
              <div className="space-y-1">
                {filteredPlaylist.map(music => (
                  <div
                    key={music.id}
                    onClick={() => playMusic(music.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all ${
                      music.id === currentMusic.id
                        ? 'bg-primary-50 dark:bg-primary-900/30'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <p className={`text-sm font-medium truncate ${
                      music.id === currentMusic.id
                        ? 'text-primary-600 dark:text-primary-400'
                        : 'text-gray-800 dark:text-gray-200'
                    }`}>
                      {music.title}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Music className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">该分类暂无音乐</p>
                {selectedCategory !== 'all' && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm"
                  >
                    添加音乐
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 添加分类弹窗 */}
      {showAddCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowAddCategory(false)}>
          <div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">新建分类</h3>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="输入分类名称..."
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl mb-4 dark:bg-gray-700 dark:text-white"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddCategory(false)}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-xl font-medium"
              >
                取消
              </button>
              <button
                onClick={handleAddCategory}
                className="flex-1 py-3 bg-gradient-to-r from-primary-500 to-pink-500 text-white rounded-xl font-medium"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
