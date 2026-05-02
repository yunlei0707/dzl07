/**
 * 音乐播放器组件
 * 右下角悬浮播放器，支持全屏展示、拖拽、折叠/展开
 */

import { useRef, useState, useCallback, useEffect } from 'react';
import { useMusic } from '../store/MusicContext';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, X, Music, Plus, ChevronUp, ChevronDown, Disc3, Expand, Minimize2, LayoutGrid } from 'lucide-react';
import { MUSIC_CATEGORIES } from '../store/MusicContext';

export function MusicPlayer() {
  const {
    playlist,
    currentIndex,
    currentMusic,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isExpanded,
    isFullscreen,
    localFile,
    hasUserInteracted,
    togglePlay,
    handlePrevious,
    handleNext,
    addLocalMusic,
    setVolume,
    toggleMute,
    setIsExpanded,
    toggleFullscreen,
    selectedCategory,
    setSelectedCategory,
    isMinimized,
    toggleMinimize,
    floatPosition,
    setFloatPos,
    formatTime,
    progress,
    getFilteredPlaylist,
    getCategoryCount,
  } = useMusic();

  const fileInputRef = useRef(null);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const positionRef = useRef({ x: floatPosition.x, y: floatPosition.y });
  const playerRef = useRef(null);

  // 初始化位置
  useEffect(() => {
    positionRef.current = { x: floatPosition.x, y: floatPosition.y };
  }, [floatPosition]);

  // 处理本地文件选择
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      addLocalMusic(file);
    }
  };

  // 切换展开/收起
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      setShowPlaylist(false);
    }
  };

  // 进度条点击
  const handleProgressClick = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const audio = document.querySelector('audio');
    if (audio) {
      audio.currentTime = percent * duration;
    }
  };

  // 播放列表项点击
  const handlePlaylistItemClick = (index) => {
    const audio = document.querySelector('audio');
    if (audio) {
      window.dispatchEvent(new CustomEvent('musicSelect', { detail: { index } }));
    }
  };

  // 拖拽开始
  const handleDragStart = useCallback((e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      x: clientX - (positionRef.current.x || 0),
      y: clientY - (positionRef.current.y || 0)
    };
  }, []);

  // 拖拽移动
  const handleDragMove = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    
    const newX = clientX - dragStartRef.current.x;
    const newY = clientY - dragStartRef.current.y;
    
    // 限制在屏幕范围内
    const maxX = window.innerWidth - 80;
    const maxY = window.innerHeight - 100;
    const boundedX = Math.max(0, Math.min(maxX, newX));
    const boundedY = Math.max(0, Math.min(maxY, newY));
    
    positionRef.current = { x: boundedX, y: boundedY };
    setFloatPos({ x: boundedX, y: boundedY });
  }, [isDragging, setFloatPos]);

  // 拖拽结束
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // 添加拖拽事件监听
  useEffect(() => {
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);

  // 如果没有音乐且没有本地文件，显示迷你按钮
  const hasMusic = currentMusic || localFile;

  const displayMusic = localFile 
    ? { title: localFile.name.replace(/\.[^/.]+$/, ''), artist: '本地音乐', cover: '📁' }
    : currentMusic;

  const filteredPlaylist = getFilteredPlaylist();
  const currentFilteredIndex = filteredPlaylist.findIndex(m => m.id === playlist[currentIndex]?.id);

  // 全屏播放器
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[70] bg-gradient-to-b from-gray-900 to-gray-800 overflow-y-auto">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-4 text-white">
          <button onClick={toggleFullscreen} className="p-2 hover:bg-white/10 rounded-full">
            <ChevronDown className="w-6 h-6" />
          </button>
          <span className="text-sm font-medium">音乐播放器</span>
          <button onClick={toggleMinimize} className="p-2 hover:bg-white/10 rounded-full">
            <Minimize2 className="w-5 h-5" />
          </button>
        </div>

        {/* 唱片区域 */}
        <div className="flex flex-col items-center pt-8 px-6">
          <div 
            className={`w-56 h-56 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-2xl ${isPlaying ? 'animate-spin' : ''}`} 
            style={{ animationDuration: '8s' }}
          >
            <div className="w-44 h-44 rounded-full bg-black/20 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-white/10 flex items-center justify-center">
                <span className="text-6xl">{displayMusic?.cover || '🎵'}</span>
              </div>
            </div>
          </div>

          {/* 曲目信息 */}
          <div className="text-center mt-8">
            <h3 className="text-xl font-bold text-white">{displayMusic?.title || '未知曲目'}</h3>
            <p className="text-gray-400 mt-1">{displayMusic?.artist || '未知艺术家'}</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="px-6 mt-8">
          <div 
            className="h-1 bg-gray-700 rounded-full cursor-pointer"
            onClick={handleProgressClick}
          >
            <div 
              className="h-full bg-primary-500 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 控制按钮 */}
        <div className="flex items-center justify-center gap-8 mt-8">
          <button onClick={handlePrevious} className="p-3 text-white/80 hover:text-white">
            <SkipBack className="w-8 h-8" />
          </button>
          
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600"
          >
            {isPlaying ? <Pause className="w-7 h-7" /> : <Play className="w-7 h-7 ml-1" />}
          </button>
          
          <button onClick={handleNext} className="p-3 text-white/80 hover:text-white">
            <SkipForward className="w-8 h-8" />
          </button>
        </div>

        {/* 音量控制 */}
        <div className="px-6 mt-6 flex items-center gap-3">
          <button onClick={toggleMute} className="p-1 text-gray-400">
            {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
          />
        </div>

        {/* 音乐分类 */}
        <div className="px-6 mt-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {MUSIC_CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === cat.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {cat.label} ({getCategoryCount(cat.value)})
              </button>
            ))}
          </div>
        </div>

        {/* 播放列表 */}
        <div className="px-6 mt-4 flex-1 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 520px)' }}>
          <div className="space-y-2">
            {filteredPlaylist.map((music, index) => (
              <div
                key={music.id}
                onClick={() => handlePlaylistItemClick(playlist.findIndex(m => m.id === music.id))}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                  playlist[currentIndex]?.id === music.id 
                    ? 'bg-primary-500/20 border border-primary-500/30' 
                    : 'bg-gray-800 hover:bg-gray-700'
                }`}
              >
                <span className="text-2xl">{music.cover}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{music.title}</p>
                  <p className="text-gray-400 text-sm truncate">{music.artist}</p>
                </div>
                {playlist[currentIndex]?.id === music.id && isPlaying && (
                  <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 添加本地音乐 */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 flex items-center justify-center gap-2 hover:border-primary-500 hover:text-primary-400"
          >
            <Plus className="w-5 h-5" />
            添加本地音乐
          </button>
        </div>

        <input
          ref={fileInputRef}
          id="local-music-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  // 如果没有音乐，返回迷你按钮
  if (!hasMusic) {
    return (
      <div 
        className="fixed bottom-20 right-4 z-50"
        style={{ right: 16, bottom: 80 }}
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-500 hover:text-primary-500 transition-colors"
          title="添加音乐"
        >
          <Plus className="w-5 h-5" />
        </button>
        <input
          ref={fileInputRef}
          id="local-music-input"
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    );
  }

  // 悬浮播放器
  return (
    <div 
      ref={playerRef}
      className="fixed z-50 select-none"
      style={{ 
        right: floatPosition.x !== null ? undefined : 16,
        bottom: floatPosition.y !== null ? undefined : 80,
        left: floatPosition.x !== null ? floatPosition.x : undefined,
        top: floatPosition.y !== null ? floatPosition.y : undefined,
      }}
    >
      {/* 展开状态：完整播放器 */}
      {isExpanded && !isMinimized ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-72 overflow-hidden border border-gray-100 dark:border-gray-700">
          {/* 顶部栏 */}
          <div 
            className="bg-gradient-to-r from-primary-400 to-primary-500 px-4 py-3 flex items-center justify-between cursor-move"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            <div className="flex items-center gap-2 text-white">
              <Disc3 className="w-5 h-5 animate-spin" style={{ animationDuration: '3s', animationPlayState: isPlaying ? 'running' : 'paused' }} />
              <span className="font-medium text-sm">背景音乐</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleFullscreen}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
                title="全屏"
              >
                <Expand className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* 唱片区域 */}
          <div className="flex flex-col items-center py-6 px-4">
            <div 
              className={`w-28 h-28 rounded-full bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center shadow-lg mb-4 ${isPlaying ? 'animate-spin' : ''}`} 
              style={{ animationDuration: '8s' }}
            >
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-white/30 flex items-center justify-center">
                  <span className="text-3xl">{displayMusic?.cover || '🎵'}</span>
                </div>
              </div>
            </div>

            <h3 className="font-bold text-gray-800 dark:text-white text-center">{displayMusic?.title || '未知曲目'}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{displayMusic?.artist || '未知艺术家'}</p>
          </div>

          {/* 进度条 */}
          <div className="px-4 mb-2">
            <div 
              className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer"
              onClick={handleProgressClick}
            >
              <div 
                className="h-full bg-primary-400 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* 控制按钮 */}
          <div className="flex items-center justify-center gap-6 px-4 pb-4">
            <button onClick={handlePrevious} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-500">
              <SkipBack className="w-6 h-6" />
            </button>
            
            <button
              onClick={togglePlay}
              className="w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </button>
            
            <button onClick={handleNext} className="p-2 text-gray-600 dark:text-gray-300 hover:text-primary-500">
              <SkipForward className="w-6 h-6" />
            </button>
          </div>

          {/* 音量控制 */}
          <div className="px-4 pb-4 flex items-center gap-3">
            <button onClick={toggleMute} className="p-1 text-gray-500 dark:text-gray-400">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-500"
            />
          </div>

          {/* 分类标签 */}
          <div className="px-4 pb-2">
            <div className="flex gap-1 overflow-x-auto">
              {MUSIC_CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap ${
                    selectedCategory === cat.value
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* 播放列表 */}
          <div className="border-t border-gray-100 dark:border-gray-700">
            <div 
              className="px-4 py-2 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => setShowPlaylist(!showPlaylist)}
            >
              <span className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <Music className="w-4 h-4" />
                播放列表 ({playlist.length})
              </span>
              <ChevronUp className={`w-4 h-4 text-gray-400 transition-transform ${showPlaylist ? '' : 'rotate-180'}`} />
            </div>
            
            {showPlaylist && (
              <div className="max-h-48 overflow-y-auto">
                {playlist.map((music, index) => (
                  <div
                    key={music.id}
                    onClick={() => handlePlaylistItemClick(index)}
                    className={`px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      index === currentIndex ? 'bg-primary-50 dark:bg-primary-900/30' : ''
                    }`}
                  >
                    <span className="text-lg">{music.cover}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-200 truncate">{music.title}</p>
                      <p className="text-xs text-gray-400 truncate">{music.artist}</p>
                    </div>
                    {index === currentIndex && isPlaying && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 添加本地音乐 */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-gray-500 dark:text-gray-400 text-sm flex items-center justify-center gap-2 hover:border-primary-400 hover:text-primary-500"
            >
              <Plus className="w-4 h-4" />
              添加本地音乐
            </button>
          </div>
        </div>
      ) : (
        /* 收起/最小化状态：圆形按钮 */
        <div className="flex items-end gap-3">
          {/* 展开按钮 */}
          <button
            onClick={toggleMinimize}
            className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-500 hover:text-primary-500"
            title="展开播放器"
          >
            <ChevronUp className="w-5 h-5" />
          </button>

          {/* 迷你播放器 */}
          <div 
            className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-2xl pl-1 pr-3 py-1 border border-gray-100 dark:border-gray-700"
            onMouseDown={handleDragStart}
            onTouchStart={handleDragStart}
          >
            {/* 旋转唱片 */}
            <button
              onClick={toggleFullscreen}
              className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-md ${
                isPlaying ? 'animate-spin' : ''
              }`}
              style={{ animationDuration: '8s' }}
            >
              <span className="text-xl">{displayMusic?.cover || '🎵'}</span>
            </button>

            {/* 控制按钮 */}
            <div className="flex items-center gap-1">
              <button onClick={handlePrevious} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-500">
                <SkipBack className="w-4 h-4" />
              </button>
              
              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md hover:bg-primary-600"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
              
              <button onClick={handleNext} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-primary-500">
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            {/* 折叠按钮 */}
            <button
              onClick={toggleMinimize}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        id="local-music-input"
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={handleFileSelect}
      />
    </div>
  );
}

export default MusicPlayer;
