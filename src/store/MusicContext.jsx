/**
 * 音乐上下文 - 全局音乐状态管理
 * 纯本地上传音乐，支持分类存储，状态全局共享
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

// 默认分类标签
export const MUSIC_CATEGORIES = [
  { id: 'all', name: '全部', icon: '🎵' },
  { id: 'piano', name: '钢琴', icon: '🎹' },
  { id: 'nature', name: '自然声', icon: '🌿' },
  { id: 'sleep', name: '助眠', icon: '🌙' },
  { id: 'children', name: '儿歌', icon: '👶' },
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
  CUSTOM_CATEGORIES: 'babytime_custom_categories',
};

// 示例音乐数据 - 使用真实可访问的URL
const SAMPLE_MUSIC = [
  {
    title: "轻柔钢琴曲 - 月光",
    artist: "古典音乐",
    url: "https://www.w3schools.com/html/horse.ogg",
    cover: "🎹",
    category: "piano"
  },
  {
    title: "自然雨声 - 森林",
    artist: "自然声",
    url: "https://www.w3schools.com/html/horse.ogg",
    cover: "🌿",
    category: "nature"
  },
  {
    title: "助眠音乐 - 星空",
    artist: "轻音乐",
    url: "https://www.w3schools.com/html/horse.ogg",
    cover: "🌙",
    category: "sleep"
  },
  {
    title: "儿歌 - 小星星",
    artist: "儿童音乐",
    url: "https://www.w3schools.com/html/horse.ogg",
    cover: "👶",
    category: "children"
  },
];


export function MusicProvider({ children }) {
  const audioRef = useRef(null);
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customCategories, setCustomCategories] = useState([]);

  // 从localStorage恢复数据
  useEffect(() => {
    const savedPlaylist = localStorage.getItem(STORAGE_KEYS.PLAYLIST);
    const savedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_INDEX);
    const savedVolume = localStorage.getItem(STORAGE_KEYS.VOLUME);
    const savedIsMuted = localStorage.getItem(STORAGE_KEYS.IS_MUTED);
    const savedCategory = localStorage.getItem(STORAGE_KEYS.SELECTED_CATEGORY);
    const savedCustomCategories = localStorage.getItem(STORAGE_KEYS.CUSTOM_CATEGORIES);
    
    if (savedPlaylist) {
      try {
        const parsed = JSON.parse(savedPlaylist);
        setPlaylist(parsed);
        // 确保索引在有效范围内
        const savedIndexNum = parseInt(savedIndex);
        if (!isNaN(savedIndexNum) && savedIndexNum >= 0 && savedIndexNum < parsed.length) {
          setCurrentIndex(savedIndexNum);
        } else if (parsed.length > 0) {
          setCurrentIndex(0);
        }
      } catch (e) {
        console.error('Failed to restore playlist:', e);
      }
    } else if (savedIndex) {
      setCurrentIndex(parseInt(savedIndex));
    }
    if (savedVolume) setVolumeState(parseFloat(savedVolume));
    if (savedIsMuted) setIsMuted(savedIsMuted === 'true');
    if (savedCategory) setSelectedCategory(savedCategory);
    if (savedCustomCategories) {
      try {
        setCustomCategories(JSON.parse(savedCustomCategories));
      } catch (e) {
        console.error('Failed to restore custom categories:', e);
      }
    }
  }, []);

  // 持久化到localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PLAYLIST, JSON.stringify(playlist));
  }, [playlist]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_INDEX, currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VOLUME, volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IS_MUTED, isMuted.toString());
  }, [isMuted]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_CATEGORY, selectedCategory);
  }, [selectedCategory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_CATEGORIES, JSON.stringify(customCategories));
  }, [customCategories]);

  // 当前播放的音乐
  const currentMusic = playlist[currentIndex] || null;

  // 按分类过滤的播放列表
  const filteredPlaylist = selectedCategory === 'all'
    ? playlist
    : playlist.filter(m => m.category === selectedCategory);

  // 播放
  const play = useCallback(async () => {
    if (!audioRef.current || playlist.length === 0) return;
    try {
      audioRef.current.volume = isMuted ? 0 : volume;
      await audioRef.current.play().catch(e => console.error("播放失败:", e));
      setIsPlaying(true);
    } catch (error) {
      console.error('播放失败:', error);
      setIsPlaying(false);
    }
  }, [playlist.length, volume, isMuted]);

  // 暂停
  const pause = useCallback(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  }, []);

  // 播放/暂停切换
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // 上一首
  const playPrev = useCallback(() => {
    const filtered = filteredPlaylist;
    if (filtered.length === 0) return;
    const currentInFiltered = filtered.findIndex(m => m.id === currentMusic?.id);
    const newIndex = currentInFiltered > 0 ? currentInFiltered - 1 : filtered.length - 1;
    const originalIndex = playlist.findIndex(m => m.id === filtered[newIndex].id);
    setCurrentIndex(originalIndex);
  }, [filteredPlaylist, currentMusic, playlist]);

  // 下一首
  const playNext = useCallback(() => {
    const filtered = filteredPlaylist;
    if (filtered.length === 0) return;
    const currentInFiltered = filtered.findIndex(m => m.id === currentMusic?.id);
    const newIndex = currentInFiltered < filtered.length - 1 ? currentInFiltered + 1 : 0;
    const originalIndex = playlist.findIndex(m => m.id === filtered[newIndex].id);
    setCurrentIndex(originalIndex);
  }, [filteredPlaylist, currentMusic, playlist]);

  // 播放指定音乐
  const playMusic = useCallback((musicId) => {
    const index = playlist.findIndex(m => m.id === musicId);
    if (index !== -1) {
      setCurrentIndex(index);
      setIsPlaying(true);
      // 确保音频元素已初始化
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      // 强制设置 src 并播放
      setTimeout(() => {
        if (audioRef.current && playlist[index]?.url) {
          audioRef.current.src = playlist[index].url;
          audioRef.current.volume = isMuted ? 0 : volume;
          audioRef.current.load();
          audioRef.current.play().catch(e => console.log("播放失败:", e));
        }
      }, 30);
    }
  }, [playlist, volume, isMuted]);

  // 添加本地音乐
  const addLocalMusic = useCallback((file, category = 'piano') => {
    const url = URL.createObjectURL(file);
    const localMusic = {
      id: 'local_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: '本地音乐',
      url: url,
      cover: '🎵',
      isLocal: true,
      category: category,
      addedAt: new Date().toISOString(),
    };
    
    setPlaylist(prev => [localMusic, ...prev]);
    setCurrentIndex(0);
    
    // 自动播放
    setTimeout(() => play(), 300);
  }, [play]);

  // 导入示例音乐
  const importSampleMusic = useCallback(() => {
    const sampleWithIds = SAMPLE_MUSIC.map((music, index) => ({
      id: "sample_" + Date.now() + "_" + index,
      ...music,
      isSample: true,
      addedAt: new Date().toISOString(),
    }));
    setPlaylist(prev => [...sampleWithIds, ...prev]);
    setCurrentIndex(0);
    setTimeout(() => play(), 300);
  }, [play]);


  // 删除音乐
  const deleteMusic = useCallback((musicId) => {
    const music = playlist.find(m => m.id === musicId);
    if (music?.url?.startsWith('blob:')) {
      URL.revokeObjectURL(music.url);
    }
    setPlaylist(prev => prev.filter(m => m.id !== musicId));
    if (currentIndex >= playlist.length - 1 && playlist.length > 1) {
      setCurrentIndex(playlist.length - 2);
    }
  }, [playlist, currentIndex]);

  // 修改音乐分类
  const updateMusicCategory = useCallback((musicId, newCategory) => {
    setPlaylist(prev => prev.map(m => 
      m.id === musicId ? { ...m, category: newCategory } : m
    ));
  }, []);

  // 更新音乐封面
  const updateMusicCover = useCallback((musicId, coverUrl) => {
    setPlaylist(prev => prev.map(m => 
      m.id === musicId ? { ...m, cover: coverUrl } : m
    ));
  }, []);

  // 添加自定义分类
  const addCustomCategory = useCallback((name, icon = '🏷️') => {
    const newCategory = {
      id: 'custom_' + Date.now(),
      name: name,
      icon: icon,
      isCustom: true,
    };
    setCustomCategories(prev => [...prev, newCategory]);
    return newCategory;
  }, []);

  // 删除自定义分类
  const deleteCustomCategory = useCallback((categoryId) => {
    // 把该分类的音乐移动到"钢琴"分类
    setPlaylist(prev => prev.map(m => 
      m.category === categoryId ? { ...m, category: 'piano' } : m
    ));
    setCustomCategories(prev => prev.filter(c => c.id !== categoryId));
  }, []);

  // 音量
  const setVolume = useCallback((newVolume) => {
    setVolumeState(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
  }, [isMuted]);

  // 静音切换
  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    if (audioRef.current) {
      audioRef.current.volume = newMuted ? 0 : volume;
    }
  }, [isMuted, volume]);

  // 自动播放下一首
  useEffect(() => {
    if (!audioRef.current) return;
    
    const handleEnded = () => {
      playNext();
    };
    
    audioRef.current.addEventListener('ended', handleEnded);
    return () => audioRef.current?.removeEventListener('ended', handleEnded);
  }, [playNext]);

  // 初始化audio元素
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 切换音乐时更新src
  useEffect(() => {
    if (audioRef.current && currentMusic?.url) {
      audioRef.current.src = currentMusic.url;
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("播放失败:", e)).catch(() => {});
      }
    }
  }, [currentMusic, isPlaying]);

  const value = {
    // 状态
    playlist,
    filteredPlaylist,
    currentIndex,
    currentMusic,
    isPlaying,
    volume,
    isMuted,
    selectedCategory,
    customCategories,
    
    // 分类
    allCategories: [...MUSIC_CATEGORIES, ...customCategories],
    
    // 方法
    play,
    pause,
    togglePlay,
    playPrev,
    playNext,
    playMusic,
    addLocalMusic,
    deleteMusic,
    importSampleMusic,
    updateMusicCategory,
    updateMusicCover,
    addCustomCategory,
    deleteCustomCategory,
    setVolume,
    toggleMute,
    setSelectedCategory,
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
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
