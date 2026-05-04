/**
 * 动态编辑表单组件
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { X, Image, Video, FileText, Star, AlertCircle, Mic, Square, Play, Pause , MapPin } from 'lucide-react';
import { useApp  } from '../store/AppContext';

const weatherOptions = [
  { value: 'sunny', emoji: '☀️', label: '晴天' },
  { value: 'cloudy', emoji: '⛅', label: '多云' },
  { value: 'rainy', emoji: '🌧️', label: '雨天' },
];

// 格式化时间
const formatTime2 = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export function MomentForm({ moment, onSave, onCancel, babyId }) {
  const { getAllMilestones, getAllMoods } = useApp();
  const [type, setType] = useState(moment?.type || 'photo');
  const [content, setContent] = useState(moment?.content || '');
  const [photos, setPhotos] = useState(moment?.photos || []);
  const [videos, setVideos] = useState(moment?.videos || []); // [{url, cover, name, size}]
  const [audios, setAudios] = useState(moment?.audios || []); // [{url, duration, waveform}]
  const [mood, setMood] = useState(moment?.mood || '');
  const [location, setLocation] = useState(moment?.location || '');
  const [weather, setWeather] = useState(moment?.weather || '');
  const [moodEmoji, setMoodEmoji] = useState(moment?.moodEmoji || '');
  const [moodLabel, setMoodLabel] = useState(moment?.moodLabel || '');
  const [milestone, setMilestone] = useState(moment?.milestone || '');
  const [milestoneLabel, setMilestoneLabel] = useState(moment?.milestoneLabel || '');
  const [milestoneEmoji, setMilestoneEmoji] = useState(moment?.milestoneEmoji || '');
  const [date, setDate] = useState(
    moment?.date 
      ? new Date(moment.date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  );
  const [saving, setSaving] = useState(false);
  
  const videoRef = useRef(null);
  
  // 录音相关状态
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioWaveform, setAudioWaveform] = useState([]);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);
  const streamRef = useRef(null);
  
  // 播放状态
  const [playingIndex, setPlayingIndex] = useState(null);
  const audioRef = useRef(null);
  

  // 获取所有里程碑选项（加安全防御）
  const milestoneOptions = Array.isArray(getAllMilestones()) ? getAllMilestones() : [];
  
  // 获取所有心情选项（预设 + 自定义，加安全防御）
  const moodOptions = Array.isArray(getAllMoods()) 
    ? getAllMoods().map(mood => ({
        value: mood.id,
        label: mood.label,
        emoji: mood.emoji
      }))
    : [];


  // 清理录音资源
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  

  // 照片上传
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotos(prev => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
    
    // 重置input以便重复选择同一文件
    e.target.value = '';
  };

  // 视频上传 - 使用base64持久化存储，严格限制大小避免卡顿
  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // 严格限制视频大小：最大 10MB，超过会严重卡顿
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      alert('视频文件过大（建议小于10MB），请压缩后再上传');
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const videoDataURL = event.target.result;
      
      // 创建视频元素读取封面和时长
      const video = document.createElement('video');
      video.src = videoDataURL;
      video.currentTime = 0.5;
      video.muted = true;
      video.playsInline = true;
      
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 320);
        canvas.height = Math.min(video.videoHeight, 240);
        const ctx = canvas.getContext('2d');
        
        try {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const coverImage = canvas.toDataURL('image/jpeg', 0.5);
          
          const videoData = {
            url: videoDataURL,
            cover: coverImage,
            name: file.name,
            size: file.size,
            duration: Math.round(video.duration)
          };
          
          setVideos(prev => [...prev, videoData]);
        } catch (err) {
          setVideos(prev => [...prev, {
            url: videoDataURL,
            cover: null,
            name: file.name,
            size: file.size
          }]);
        }
      };
      
      video.onerror = () => {
        setVideos(prev => [...prev, {
          url: videoDataURL,
          cover: null,
          name: file.name,
          size: file.size
        }]);
      };
    };
    
    reader.onerror = () => {
      alert('读取视频文件失败，请重试');
    };
    
    reader.readAsDataURL(file);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };
  

  const togglePlayAudio = (index) => {
    if (playingIndex === index) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingIndex(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingIndex(index);
      // We can't auto-play here without actual audio element, but at least UI won't crash
    }
  };

  const removeVideo = (index) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const removeAudio = (index) => {
    setAudios(prev => prev.filter((_, i) => i !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onload = (event) => {
          const audioData = {
            url: event.target.result,
            duration: recordingTime,
            waveform: audioWaveform.length > 0 ? audioWaveform.slice(-40) : []
          };
          setAudios(prev => [...prev, audioData]);
          setRecordingTime(0);
          setAudioWaveform([]);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // 波形分析
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const updateWaveform = () => {
          analyser.getByteFrequencyData(dataArray);
          const avg = Array.from(dataArray).reduce((a, b) => a + b, 0) / dataArray.length;
          setAudioWaveform(prev => [...prev, avg]);
          animationRef.current = requestAnimationFrame(updateWaveform);
        };
        updateWaveform();
      } catch (e) {
        // 波形分析失败不影响录音
      }
    } catch (error) {
      alert('无法访问麦克风，请检查权限设置');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };


  const handleSubmit = async () => {
    if (!content.trim() && photos.length === 0 && videos.length === 0 && audios.length === 0) {
      alert('请添加内容、照片、视频或语音');
      return;
    }
    
    if (!babyId) {
      alert('错误：未找到宝宝档案，请返回首页重试');
      return;
    }
    
    const momentData = {
      babyId: babyId,
      type,
      date: new Date(date).toISOString(),
      content: content.trim(),
      photos: type === 'photo' ? photos : [],
      videos: type === 'video' ? videos : [],
      audios: type === 'audio' ? audios : [],
      mood,
      moodLabel: mood ? moodLabel : '',
      moodEmoji: mood ? moodEmoji : '',
      weather,
      location,
      locationCoords: null,
      milestone,
      milestoneLabel: milestone ? milestoneLabel : '',
      milestoneEmoji: milestone ? milestoneEmoji : '',
    };
    
    setSaving(true);
    
    try {
      if (typeof onSave === 'function') {
        await onSave(momentData);
      }
    } catch (error) {
      alert('保存失败: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-cream-50 dark:bg-gray-900 z-50 overflow-y-auto">
      {/* 顶部导航 */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-cream-200 dark:border-gray-700 z-10">
        <div className="flex items-center justify-between px-4 h-14">
          <button onClick={onCancel} className="p-2 -ml-2">
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <h2 className="font-bold text-gray-800 dark:text-white">
            {moment ? '编辑记录' : '添加记录'}
          </h2>
          <button 
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-1.5 bg-primary-500 text-white rounded-lg font-medium text-sm hover:bg-primary-600 disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
      
      <div className="p-4 pb-24 space-y-4 max-w-lg mx-auto">
        {/* 类型选择 */}
        <div className="flex gap-2">
          <button
            onClick={() => setType('photo')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors text-sm ${
              type === 'photo' 
                ? 'bg-primary-500 text-white' 
                : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>照片</span>
          </button>
          <button
            onClick={() => setType('video')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors text-sm ${
              type === 'video' 
                ? 'bg-primary-500 text-white' 
                : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>视频</span>
          </button>
          <button
            onClick={() => setType('audio')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors text-sm ${
              type === 'audio' 
                ? 'bg-primary-500 text-white' 
                : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>语音日记</span>
          </button>
          <button
            onClick={() => setType('diary')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-colors text-sm ${
              type === 'diary' 
                ? 'bg-primary-500 text-white' 
                : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>日记</span>
          </button>
        </div>
        
        {/* 日期选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            记录日期
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
        </div>
        
        {/* 里程碑 - 使用自定义里程碑列表 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            <Star className="w-4 h-4 inline mr-1" />
            里程碑标签
          </label>
          <div className="flex flex-wrap gap-2">
            {milestoneOptions.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  if (milestone === option.id) {
                    setMilestone('');
                    setMilestoneLabel('');
                    setMilestoneEmoji('');
                  } else {
                    setMilestone(option.id);
                    setMilestoneLabel(option.label);
                    setMilestoneEmoji(option.emoji);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  milestone === option.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 照片上传 */}
        {type === 'photo' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              照片
            </label>
            
            {/* 提示 */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  当前为本地模拟上传，媒体文件仅本地存储
                </p>
              </div>
            </div>
            
            {photos.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3">
                {photos.map((photo, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-cream-100 dark:bg-gray-700">
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removePhoto(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors">
                <Image className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">添加照片</p>
              </div>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
        
        {/* 视频上传 */}
        {type === 'video' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              视频
            </label>
            
            {/* 提示 */}
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  当前为本地模拟上传，媒体文件仅本地存储
                </p>
              </div>
            </div>
            
            {videos.length > 0 && (
              <div className="grid grid-cols-2 gap-2 mb-3">
                {videos.map((video, index) => (
                  <div key={index} className="relative aspect-video rounded-xl overflow-hidden bg-gray-800">
                    {video.cover ? (
                    <img src={video.cover} alt="视频封面" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-700">
                        <Video className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    {/* 播放按钮覆盖 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <div className="w-0 h-0 border-l-[16px] border-l-gray-800 border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
                      </div>
                    </div>
                    <button
                      onClick={() => removeVideo(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors">
                <Video className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-500 dark:text-gray-400">添加视频</p>
              </div>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
        
        {/* 语音日记 */}
        {type === 'audio' && (
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              <Mic className="w-4 h-4 inline mr-1" />
              语音日记
            </label>
            
            {audios.length > 0 && (
              <div className="space-y-3 mb-3">
                {audios.map((audio, index) => (
                  <div key={index} className="bg-cream-100 dark:bg-gray-700 rounded-xl p-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => togglePlayAudio(index)}
                        className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-white"
                      >
                        {playingIndex === index ? (
                          <Square className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4 ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="h-8 bg-primary-200 dark:bg-primary-700 rounded-full overflow-hidden flex items-end px-1">
                          {Array.isArray(audio.waveform) && audio.waveform.length > 0 ? (
                            audio.waveform.slice(-40).map((frame, i) => {
                              // 兼容一维数组和二维数组格式
                              const height = Array.isArray(frame) ? frame[0] : frame;
                              return (
                                <div
                                  key={i}
                                  className="w-1 bg-primary-500 mx-px rounded-full"
                                  style={{ height: `${Math.max(4, (Number(height) || 0) / 4)}%` }}
                                />
                              );
                            })
                          ) : null}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">{formatTime2(audio.duration)}</span>
                      <button
                        onClick={() => removeAudio(index)}
                        className="p-2 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'bg-primary-500 text-white hover:bg-primary-600'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-5 h-5" />
                  <span>停止录音 ({formatTime2(recordingTime)})</span>
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span>开始录音</span>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* 内容输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {type === 'photo' ? '说说感想' : type === 'video' ? '视频描述' : type === 'audio' ? '语音备注' : '日记内容'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="记录这一刻的感受..."
            rows={4}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none"
          />
        </div>
        
        {/* 心情 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            心情
          </label>
          <div className="flex flex-wrap gap-2">
            {moodOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  if (mood === option.value) {
                    setMood('');
                    setMoodLabel('');
                    setMoodEmoji('');
                  } else {
                    setMood(option.value);
                    setMoodLabel(option.label);
                    setMoodEmoji(option.emoji);
                  }
                }}
                className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                  mood === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {option.emoji} {option.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* 天气 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            天气
          </label>
          <div className="flex gap-2">
            {weatherOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setWeather(weather === option.value ? '' : option.value)}
                className={`px-3 py-2 rounded-xl text-sm transition-colors ${
                  weather === option.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {option.emoji}
              </button>
            ))}
          </div>
        </div>
        
        {/* 位置 - 手动输入 */}
        <div>
          <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            <MapPin className="w-4 h-4 inline mr-1" />
            位置
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="输入位置（可选）"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-cream-100 dark:bg-gray-700 dark:text-white text-sm"
          />
        </div>
      </div>
    </div>
  );
}
