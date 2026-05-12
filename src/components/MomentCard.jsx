/**
 * 动态卡片组件
 * ✅ 性能优化：图片懒加载 + 占位符
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { formatDateFriendly, formatTime } from '../utils/dateUtils';
import { Smile, CloudSun, MapPin, MoreHorizontal, Trash2, Edit3, Play, Pause, Mic, Share2 } from 'lucide-react';
import { readVideoFromOPFS } from '../utils/opfs';
import { readPhotoFromFS } from '../utils/photoFS';

// 懒加载图片组件
function LazyImage({ src, alt, className }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // 进入视口时才开始加载
          const img = new Image();
          img.onload = () => setLoaded(true);
          img.onerror = () => setError(true);
          img.src = src;
          observer.disconnect();
        }
      },
      { rootMargin: '100px' } // 提前100px预加载
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return (
    <div ref={imgRef} className={`relative w-full h-full ${className || ''}`}>
      {!loaded && !error && (
        <div className="absolute inset-0 bg-cream-100 dark:bg-gray-700 animate-pulse flex items-center justify-center">
          <span className="text-2xl opacity-50">📷</span>
        </div>
      )}
      {loaded && (
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
      )}
      {error && (
        <div className="absolute inset-0 bg-cream-100 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-xl opacity-50">❌</span>
        </div>
      )}
    </div>
  );
}

// 格式化时间
const formatTime2 = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// 心情表情映射
const moodEmojis = {
  happy: '😊',
  excited: '🎉',
  touched: '🥰',
  sleepy: '😴',
  crying: '😢',
  angry: '😠',
  thinking: '🤔',
};

// 天气图标映射
const weatherIcons = {
  sunny: '☀️',
  cloudy: '⛅',
  rainy: '🌧️',
  snowy: '❄️',
  windy: '💨',
  stormy: '⛈️',
};

// 名场面标签类型
const milestoneTypes = {
  first: { label: '名场面', className: 'first', emoji: '⭐' },
  growth: { label: '成长', className: 'growth', emoji: '🌱' },
  health: { label: '健康', className: 'health', emoji: '💪' },
  learning: { label: '学习', className: 'learning', emoji: '📚' },
  daily: { label: '日常', className: 'daily', emoji: '✨' },
};

// 照片子组件 - 支持FS和Base64两种模式
function PhotoItem({ photo, alt, className }) {
  const [photoUrl, setPhotoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // 根据照片类型加载
  useEffect(() => {
    if (typeof photo === 'string') {
      // Base64模式：直接使用
      setPhotoUrl(photo);
    } else if (photo && typeof photo === 'object' && photo.filename) {
      // FS模式：从文件系统加载
      loadFSPhoto();
    }
  }, [photo]);

  const loadFSPhoto = async () => {
    try {
      setLoading(true);
      setError(false);
      const base64 = await readPhotoFromFS(photo.filename);
      if (base64) {
        setPhotoUrl(base64);
      } else {
        setError(true);
      }
    } catch (e) {
      console.error('[MomentCard] FS照片加载失败:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`relative rounded-xl overflow-hidden bg-cream-100 dark:bg-gray-700 ${className || ''}`}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-cream-100 dark:bg-gray-700">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-cream-100 dark:bg-gray-700">
          <span className="text-3xl mb-1">⚠️</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">加载失败</span>
        </div>
      )}
      {photoUrl && (
        <LazyImage
          src={photoUrl}
          alt={alt || '照片'}
        />
      )}
    </div>
  );
}

// 视频子组件 - 支持OPFS和Base64两种模式
function VideoItem({ video }) {
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const objectUrlRef = useRef(null);

  // 根据视频类型加载
  useEffect(() => {
    if (video.url) {
      // Base64模式：直接使用url
      setVideoUrl(video.url);
    } else if (video.filename) {
      // OPFS模式：从文件系统加载
      loadOPFSVideo();
    }

    // 清理：组件卸载时释放Blob URL
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, [video.url, video.filename]);

  const loadOPFSVideo = async () => {
    try {
      setLoading(true);
      const file = await readVideoFromOPFS(video.filename);
      const url = URL.createObjectURL(file);
      objectUrlRef.current = url;
      setVideoUrl(url);
    } catch (e) {
      console.error('[MomentCard] OPFS视频加载失败:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative rounded-xl overflow-hidden bg-gray-800 aspect-video">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-white border-t-transparent"></div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <span className="text-3xl mb-2">⚠️</span>
          <span className="text-sm">视频加载失败</span>
        </div>
      )}
      {videoUrl && (
        <video
          src={videoUrl}
          poster={video.cover}
          controls
          className="w-full h-full object-cover"
          playsInline
          preload="metadata"
        />
      )}
    </div>
  );
}

export function MomentCard({ moment, onEdit, onDelete, onClick, onShare }) {
  const [showMenu, setShowMenu] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const audioRef = useRef(null);
  
  const typeIcons = {
    photo: '📷',
    video: '🎬',
    audio: '🎤',
    diary: '📝',
    podcast: '🎙️',
  };
  
  const handleDelete = () => {
    if (confirm('确定要删除这条记录吗？')) {
      onDelete(moment.id);
    }
    setShowMenu(false);
  };

  const handleShare = () => {
    if (onShare) {
      onShare(moment);
    }
    setShowMenu(false);
  };
  
  // 播放/暂停音频/播客
  const togglePlayAudio = (index) => {
    if (playingIndex === index) {
      audioRef.current?.pause();
      setPlayingIndex(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // 播客模式 (index = -1)
      if (index === -1 && moment.podcast && moment.podcast.url) {
        console.log('[MomentCard] 播放播客:', moment.podcast.title);
        audioRef.current = new Audio(moment.podcast.url);
      }
      // 普通音频模式
      else if (index >= 0 && moment.audios && moment.audios[index]) {
        console.log('[MomentCard] 播放音频:', moment.audios[index].fileName);
        audioRef.current = new Audio(moment.audios[index].url);
      }
      if (audioRef.current) {
        audioRef.current.onended = () => setPlayingIndex(null);
        audioRef.current.play().catch(e => {
          console.error('[MomentCard] 播放失败:', e);
        });
        setPlayingIndex(index);
      }
    }
  };
  
  return (
    <div className="card mb-4 animate-fade-in">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-lg">{typeIcons[moment.type]}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {formatDateFriendly(moment.date)} {formatTime(moment.createdAt)}
          </span>
          {/* 记录人信息 */}
          {moment.createdBy && (
            <span className="flex items-center gap-1 text-xs text-primary-500 bg-primary-50 px-2 py-0.5 rounded-full">
              <span>{moment.createdBy.avatar}</span>
              <span>{moment.createdBy.name}</span>
            </span>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 rounded-full hover:bg-cream-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
          
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 flex flex-col bg-white dark:bg-gray-800 rounded-xl shadow-card z-20 overflow-hidden animate-scale-in min-w-[120px]">
                <button
                  onClick={() => {
                    onEdit(moment);
                    setShowMenu(false);
                  }}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-cream-100 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-100 dark:border-gray-700"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>编辑</span>
                </button>
                {onShare && (
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-pink-50 dark:hover:bg-pink-900/20 text-sm text-pink-500 border-b border-gray-100 dark:border-gray-700"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>分享</span>
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {moment.milestone && moment.milestoneLabel && (
        <div className="mb-3">
          <span className={`milestone-tag ${milestoneTypes[moment.milestone]?.className || 'daily'}`}>
            {milestoneTypes[moment.milestone]?.emoji} {moment.milestoneLabel}
          </span>
        </div>
      )}
      
      {/* 视频 - 使用videos字段，支持OPFS和Base64两种模式 */}
      {moment.type === 'video' && moment.videos && moment.videos.length > 0 && (
        <div className="mb-3 space-y-2">
          {moment.videos.map((video, index) => (
            <VideoItem key={index} video={video} />
          ))}
        </div>
      )}
      
      {/* 语音 */}
      {moment.type === 'audio' && moment.audios && moment.audios.length > 0 && (
        <div className="mb-3 space-y-2">
          {moment.audios.map((audio, index) => (
            <div 
              key={index} 
              className="bg-cream-50 dark:bg-gray-800 rounded-xl p-3"
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePlayAudio(index)}
                  className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary-600 transition-colors"
                >
                  {playingIndex === index ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Mic className="w-4 h-4 text-primary-500 flex-shrink-0" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {audio.fileName || '语音记录'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatTime2(audio.duration)}
                    </span>
                  </div>
                  {/* 波形显示 */}
                  <div className="h-6 flex items-center gap-0.5 overflow-hidden">
                    {audio.waveform?.length > 0 ? (
                      audio.waveform.slice(-40).map((frame, i) => (
                        <div key={i} className="flex items-center gap-px h-full">
                          {/* 兼容：一维数组（frame是数字）或二维数组（frame是数组） */}
                          {(Array.isArray(frame) ? frame.slice(0, 6) : [frame]).map((v, j) => (
                            <div
                              key={j}
                              className="w-1 bg-primary-300 dark:bg-primary-600 rounded-full"
                              style={{ height: `${Math.max(10, ((v || 0) / 255) * 100)}%` }}
                            />
                          ))}
                        </div>
                      ))
                    ) : (
                      <div className="w-full h-2 bg-primary-200 dark:bg-primary-700 rounded" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* 播客 */}
      {moment.type === 'podcast' && moment.podcast && (
        <div className="mb-3">
          <div className="bg-cream-50 dark:bg-gray-800 rounded-xl overflow-hidden">
            {/* 播客封面 */}
            {moment.podcast.cover && (
              <div className="relative aspect-video bg-cream-100 dark:bg-gray-700">
                <LazyImage
                  src={moment.podcast.cover}
                  alt={moment.podcast.title || '播客封面'}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={() => togglePlayAudio(-1)}
                    className="w-16 h-16 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center hover:bg-white dark:hover:bg-gray-700 transition-colors shadow-lg"
                  >
                    {playingIndex === -1 ? (
                      <Pause className="w-8 h-8 text-primary-500" />
                    ) : (
                      <Play className="w-8 h-8 text-primary-500 ml-1" />
                    )}
                  </button>
                </div>
              </div>
            )}
            {/* 播客信息 */}
            <div className="p-3">
              <h4 className="text-base font-medium text-gray-800 dark:text-gray-100 mb-1 truncate">
                {moment.podcast.title || '播客记录'}
              </h4>
              {moment.podcast.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {moment.podcast.description}
                </p>
              )}
              {/* 播放控制 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => togglePlayAudio(-1)}
                  className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0 hover:bg-primary-600 transition-colors"
                >
                  {playingIndex === -1 ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-400">
                      {moment.podcast.duration ? formatTime2(moment.podcast.duration) : '--:--'}
                    </span>
                  </div>
                  {/* 波形显示 */}
                  <div className="h-4 flex items-center gap-0.5 overflow-hidden">
                    {moment.podcast.waveform?.length > 0 ? (
                      moment.podcast.waveform.slice(-60).map((frame, i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-primary-300 dark:bg-primary-600 rounded-full"
                          style={{ height: `${Math.max(8, ((frame || 0) / 255) * 100)}%` }}
                        />
                      ))
                    ) : (
                      <div className="w-full h-1.5 bg-primary-200 dark:bg-primary-700 rounded" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 照片 - 支持FS和Base64两种模式 */}
      {moment.type !== 'video' && moment.type !== 'audio' && moment.type !== 'podcast' && moment.photos && moment.photos.length > 0 && (
        <div 
          className={`grid gap-2 mb-3 ${moment.photos.length === 1 ? 'grid-cols-1' : moment.photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}
          onClick={() => onClick && onClick(moment.photos)}
        >
          {moment.photos.slice(0, 4).map((photo, index) => (
            <div 
              key={index} 
              className={`${
                moment.photos.length === 1 ? 'aspect-video' : 'aspect-square'
              } ${moment.photos.length === 3 && index === 0 ? 'row-span-2 aspect-auto' : ''}`}
            >
              <PhotoItem
                photo={photo}
                alt={`照片 ${index + 1}`}
              />
              {index === 3 && moment.photos.length > 4 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-2xl font-bold z-20 rounded-xl">
                  +{moment.photos.length - 4}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* 文字内容 */}
      {moment.content && (
        <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
          {moment.content}
        </p>
      )}
      
      {/* 底部元信息 */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-cream-100 dark:border-gray-700">
        {moment.mood && (
          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{moodEmojis[moment.mood]}</span>
          </span>
        )}

        {moment.milestone && moment.milestoneLabel && (
          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{milestoneTypes[moment.milestone]?.emoji || "✨"}</span>
            <span>{moment.milestoneLabel}</span>
          </span>
        )}
        {moment.weather && (
          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <span>{weatherIcons[moment.weather]}</span>
          </span>
        )}
        {moment.location && (
          <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5" />
            <span className="truncate max-w-32">{moment.location}</span>
          </span>
        )}
      </div>
    </div>
  );
}
