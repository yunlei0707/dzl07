/**
 * 音乐上下文 - 全局音乐状态管理
 * 支持预设音乐和本地音乐文件，状态全局共享
 * 内置10首无版权纯音乐
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// 内置免费背景音乐列表（使用无版权音乐CDN）
// 类别：轻音乐/钢琴曲、白噪音/自然声、摇篮曲/助眠音乐
const BUILTIN_MUSIC = [
  {
    id: 'builtin_1',
    title: '温暖摇篮曲',
    category: 'sleep',
    artist: 'Sweet Dreams',
    url: 'https://cdn.pixabay.com/audio/2022/10/25/audio_946bc3eb4c.mp3',
    cover: '🌙'
  },
  {
    id: 'builtin_2',
    title: '童趣时光',
    category: 'piano',
    artist: 'Happy Children',
    url: 'https://cdn.pixabay.com/audio/2022/08/02/audio_2dde668d05.mp3',
    cover: '🎶'
  },
  {
    id: 'builtin_3',
    title: '宁静午后',
    category: 'piano',
    artist: 'Peaceful Afternoon',
    url: 'https://cdn.pixabay.com/audio/2023/07/30/audio_e5b6e7e054.mp3',
    cover: '🌸'
  },
  {
    id: 'builtin_4',
    title: '温馨时刻',
    category: 'piano',
    artist: 'Cozy Moments',
    url: 'https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3',
    cover: '💝'
  },
  {
    id: 'builtin_5',
    title: '快乐成长',
    category: 'piano',
    artist: 'Growing Up',
    url: 'https://cdn.pixabay.com/audio/2022/12/07/audio_3b3f760e9b.mp3',
    cover: '✨'
  },
  {
    id: 'builtin_6',
    title: '森林鸟鸣',
    category: 'nature',
    artist: 'Forest Birds',
    url: 'https://cdn.pixabay.com/audio/2022/06/07/audio_b9a500b0e8.mp3',
    cover: '🐦'
  },
  {
    id: 'builtin_7',
    title: '海浪声',
    category: 'nature',
    artist: 'Ocean Waves',
    url: 'https://cdn.pixabay.com/audio/2021/08/09/audio_dc39bde8e2.mp3',
    cover: '🌊'
  },
  {
    id: 'builtin_8',
    title: '雨后清晨',
    category: 'nature',
    artist: 'Rainy Morning',
    url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_8cb749d484.mp3',
    cover: '🌧️'
  },
  {
    id: 'builtin_9',
    title: '星空下的梦',
    category: 'sleep',
    artist: 'Dreamland',
    url: 'https://cdn.pixabay.com/audio/2022/05/27/audio_1808fbf07a.mp3',
    cover: '⭐'
  },
  {
    id: 'builtin_10',
    title: '月光奏鸣曲',
    category: 'piano',
    artist: 'Moonlight',
    url: 'https://cdn.pixabay.com/audio/2021/10/13/audio_1ad5028e54.mp3',
    cover: '🎹'
  },
];

// 分类标签
export const MUSIC_CATEGORIES = [
  { value: 'all', label: '全部' },
  { value: 'piano', label: '钢琴曲' },
  { value: 'nature', label: '自然声' },
  { value: 'sleep', label: '助眠' },
];

const MusicContext = createContext(null);

// localStorage keys
const STORAGE_KEYS = {
  PLAYLIST: 'babytime_playlist',
  CURRENT_INDEX: 'babytime_current_index',
  VOLUME: 'babytime_volume',
  IS_PLAYING: 'babytime_is_playing',
  IS_MUTED: 'babytime_is_muted',
  SELECTED_CATEGORY: 'babytime_selected_category',
};

export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const [playlist, setPlaylist] = useState(BUILTIN_MUSIC);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [localFile, setLocalFile] = useState(null);
  const [localFileUrl, setLocalFileUrl] = useState(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isMinimized, setIsMinimized] = useState(false); // 悬浮窗折叠状态
  const [floatPosition, setFloatPosition] = useState({ x: null, y: null }); // 悬浮窗位置

  // 当前音乐
  const currentMusic = playlist[currentIndex] || null;

  // 初始化音频元素
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    audioRef.current.muted = isMuted;

    audioRef.current.addEventListener('timeupdate', () => {
      setCurrentTime(audioRef.current?.currentTime || 0);
    });

    audioRef.current.addEventListener('loadedmetadata', () => {
      setDuration(audioRef.current?.duration || 0);
    });

    audioRef.current.addEventListener('ended', () => {
      handleNext();
    });

    audioRef.current.addEventListener('play', () => {
      setIsPlaying(true);
    });

    audioRef.current.addEventListener('pause', () => {
      setIsPlaying(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // 从localStorage恢复状态
  useEffect(() => {
    try {
      const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
      const savedMuted = localStorage.getItem(STORAGE_KEYS.IS_MUTED);
      const savedCurrentIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
      const savedCategory = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORY);
      const savedPlaylist = localStorage.getItem(STORAGE_KEYS.PLAYLIST);
      const savedPosition = localStorage.getItem('babytime_float_position');

      if (savedVolume !== null) {
        const vol = parseFloat(savedVolume);
        setVolumeState(vol);
        if (audioRef.current) audioRef.current.volume = vol;
      }

      if (savedMuted !== null) {
        const muted = savedMuted === 'true';
        setIsMuted(muted);
        if (audioRef.current) audioRef.current.muted = muted;
      }

      if (savedCurrentIndex !== null) {
        setCurrentIndex(parseInt(savedCurrentIndex, 10));
      }

      if (savedCategory !== null) {
        setSelectedCategory(savedCategory);
      }

      if (savedPlaylist) {
        const parsed = JSON.parse(savedPlaylist);
        setPlaylist([...BUILTIN_MUSIC, ...parsed.filter(p => p.isLocal)]);
      }

      if (savedPosition) {
        setFloatPosition(JSON.parse(savedPosition));
      }
    } catch (e) {
      console.error('Failed to restore music state:', e);
    }
  }, []);

  // 监听用户交互
  useEffect(() => {
    const handleUserInteraction = () => {
      setHasUserInteracted(true);
    };
    
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  // 加载当前音乐
  useEffect(() => {
    if (audioRef.current && currentMusic) {
      audioRef.current.src = localFileUrl || currentMusic.url;
      audioRef.current.load();
      
      if (hasUserInteracted && isPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [currentMusic, localFileUrl]);

  // 保存状态到localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_MUTED, isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORY, selectedCategory);
  }, [selectedCategory]);

  // 播放
  const play = useCallback(async () => {
    if (!currentMusic && !localFile) return;
    
    try {
      if (audioRef.current) {
        setHasUserInteracted(true);
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Play failed:', error);
    }
  }, [currentMusic, localFile]);

  // 暂停
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    setHasUserInteracted(true);
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // 上一首
  const handlePrevious = useCallback(() => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : playlist.length - 1;
    setCurrentIndex(newIndex);
    setLocalFile(null);
    setLocalFileUrl(null);
    setIsPlaying(true);
    
    const fileInput = document.getElementById('local-music-input');
    if (fileInput) fileInput.value = '';
  }, [currentIndex, playlist.length]);

  // 下一首
  const handleNext = useCallback(() => {
    const newIndex = currentIndex < playlist.length - 1 ? currentIndex + 1 : 0;
    setCurrentIndex(newIndex);
    setLocalFile(null);
    setLocalFileUrl(null);
    setIsPlaying(true);
    
    const fileInput = document.getElementById('local-music-input');
    if (fileInput) fileInput.value = '';
  }, [currentIndex, playlist.length]);

  // 选择特定音乐
  const selectMusic = useCallback((index) => {
    setCurrentIndex(index);
    setLocalFile(null);
    setLocalFileUrl(null);
    setIsPlaying(true);
    
    const fileInput = document.getElementById('local-music-input');
    if (fileInput) fileInput.value = '';
  }, []);

  // 添加本地音乐
  const addLocalMusic = useCallback((file) => {
    if (!file) return;
    
    if (localFileUrl) {
      URL.revokeObjectURL(localFileUrl);
    }
    
    const url = URL.createObjectURL(file);
    setLocalFile(file);
    setLocalFileUrl(url);
    
    const localMusic = {
      id: `local_${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: '本地音乐',
      url: url,
      cover: '📁',
      isLocal: true,
    };
    
    setPlaylist(prev => [...prev, localMusic]);
    setCurrentIndex(playlist.length);
    setIsPlaying(true);
    
    const localMusicList = playlist.filter(p => p.isLocal);
    localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify([...localMusicList, localMusic]));
  }, [localFileUrl, playlist]);

  // 设置音量
  const setVolume = useCallback((vol) => {
    const newVolume = Math.max(0, Math.min(1, vol));
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  // 静音切换
  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      if (audioRef.current) {
        audioRef.current.muted = newMuted;
      }
      return newMuted;
    });
  }, []);

  // 格式化时间
  const formatTime = (time) => {
    if (!time || !isFinite(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 进度
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // 全屏切换
  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
    setIsExpanded(prev => !prev);
  }, []);

  // 折叠/展开悬浮窗
  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  // 设置悬浮窗位置
  const setFloatPos = useCallback((pos) => {
    setFloatPosition(pos);
    localStorage.setItem('babytime_float_position', JSON.stringify(pos));
  }, []);

  // 按分类筛选音乐
  const getFilteredPlaylist = useCallback(() => {
    if (selectedCategory === 'all') return playlist;
    return playlist.filter(m => m.category === selectedCategory);
  }, [playlist, selectedCategory]);

  // 获取分类下的音乐数量
  const getCategoryCount = useCallback((category) => {
    if (category === 'all') return playlist.length;
    return playlist.filter(m => m.category === category).length;
  }, [playlist]);

  const value = {
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
    selectedCategory,
    isMinimized,
    floatPosition,
    
    play,
    pause,
    togglePlay,
    handlePrevious,
    handleNext,
    selectMusic,
    addLocalMusic,
    setVolume,
    toggleMute,
    setIsExpanded,
    setIsFullscreen,
    toggleFullscreen,
    toggleMinimize,
    setFloatPos,
    setSelectedCategory,
    formatTime,
    progress,
    getFilteredPlaylist,
    getCategoryCount,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusic must be used within MusicProvider');
  }
  return context;
}

export { BUILTIN_MUSIC };
