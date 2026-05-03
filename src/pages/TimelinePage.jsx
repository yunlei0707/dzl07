/**
 * 时光轴页面
 * 优化版本：往年今日折叠面板，头像显示在左上角
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { BabyHeader } from '../components/BabyHeader';
import { MomentCard } from '../components/MomentCard';
import { PhotoViewer } from '../components/PhotoViewer';
import { groupByYearAndMonth } from '../utils/dateUtils';
import { getMomentsOnSameDayLastYear, deleteMoment, getMomentsByBaby } from '../utils/db';
import { Plus, Calendar, Clock, X, ChevronDown } from 'lucide-react';

// 类型筛选选项
const typeFilters = [
  { value: '', label: '类型' },
  { value: 'photo', label: '📷 照片' },
  { value: 'video', label: '🎬 视频' },
  { value: 'diary', label: '📝 日记' },
  { value: 'audio', label: '🎙️ 语音' },
];

export function TimelinePage({ 
  onAddMoment, 
  onEditMoment, 
  onSwitchBaby, 
  onAddBaby, 
  filterType, 
  filterMood, 
  filterMilestone,
  onClearFilters 
}) {
  const { moments, setMoments, currentBaby, currentUser, showToast, getAllMilestones, getAllMoods } = useApp();
  
  // 获取所有里程碑选项（包含预设和自定义）
  const milestoneFilters = useMemo(() => {
    const allMilestones = getAllMilestones();
    return [
      { value: '', label: '里程碑' },
      ...allMilestones.map(m => ({
        value: m.id,
        label: `${m.emoji} ${m.label}`
      }))
    ];
  }, [getAllMilestones]);

  // 获取所有心情选项（包含预设和自定义）
  const moodFilters = useMemo(() => {
    const allMoods = getAllMoods();
    return [
      { value: '', label: '心情' },
      ...allMoods.map(m => ({
        value: m.id,
        label: `${m.emoji} ${m.label}`
      }))
    ];
  }, [getAllMoods]);
  const [selectedPhotos, setSelectedPhotos] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [selectedMilestone, setSelectedMilestone] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedMood, setSelectedMood] = useState('');
  const [showSameDay, setShowSameDay] = useState(false);
  const [sameDayMoments, setSameDayMoments] = useState([]);
  
  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);
  const containerRef = useRef(null);
  
  const shareCardRef = useRef(null);
  
  // 监听外部筛选条件变化
  useEffect(() => {
    if (filterType && filterType !== 'specific' && filterType !== '') {
      setSelectedType(filterType);
    }
    if (filterMood) {
      setSelectedMood(filterMood);
    }
    if (filterMilestone) {
      setSelectedMilestone(filterMilestone);
    }
  }, [filterType, filterMood, filterMilestone]);
  
  // 刷新数据
  const handleRefresh = useCallback(async () => {
    if (!currentBaby || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const babyMoments = await getMomentsByBaby(currentBaby.id);
      setMoments(babyMoments);
      showToast('已刷新');
    } catch (error) {
      showToast('刷新失败', 'error');
    } finally {
      setIsRefreshing(false);
      setPullDistance(0);
    }
  }, [currentBaby, isRefreshing, setMoments, showToast]);
  
  // 下拉刷新手势处理
  const handleTouchStart = useCallback((e) => {
    touchStartY.current = e.touches[0].clientY;
    if (containerRef.current) {
      scrollTop.current = containerRef.current.scrollTop;
    }
  }, []);
  
  const handleTouchMove = useCallback((e) => {
    if (isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - touchStartY.current;
    
    if (scrollTop.current <= 0 && diff > 0) {
      const dampened = Math.min(diff * 0.3, 100);
      setPullDistance(dampened);
    } else {
      setPullDistance(0);
    }
  }, [isRefreshing]);
  
  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 60 && !isRefreshing) {
      handleRefresh();
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, isRefreshing, handleRefresh]);
  
  // 筛选后的动态
  const filteredMoments = useMemo(() => {
    let result = moments.filter(m => !m.isDeleted); // 排除已删除的记录
    
    if (selectedType) {
      result = result.filter(m => m.type === selectedType);
    }
    if (selectedMood) {
      result = result.filter(m => m.mood === selectedMood);
    }
    if (selectedMilestone) {
      result = result.filter(m => m.milestone === selectedMilestone);
    }
    
    return result;
  }, [moments, selectedType, selectedMood, selectedMilestone]);
  
  // 按年月分组
  const groupedMoments = useMemo(() => {
    return groupByYearAndMonth(filteredMoments);
  }, [filteredMoments]);
  
  // 是否有激活的筛选条件
  const hasActiveFilters = useMemo(() => {
    return selectedType || selectedMood || selectedMilestone;
  }, [selectedType, selectedMood, selectedMilestone]);
  
  // 获取当前筛选条件的显示文本
  const getActiveFilterLabel = () => {
    const labels = [];
    if (selectedType) {
      const typeFilter = typeFilters.find(f => f.value === selectedType);
      if (typeFilter) labels.push(typeFilter.label);
    }
    if (selectedMood) {
      const moodFilter = moodFilters.find(f => f.value === selectedMood);
      if (moodFilter) labels.push(moodFilter.label);
    }
    if (selectedMilestone) {
      const milestoneFilter = milestoneFilters.find(f => f.value === selectedMilestone);
      if (milestoneFilter) labels.push(milestoneFilter.label);
    }
    return labels;
  };
  
  // 清除所有筛选
  const handleClearAllFilters = () => {
    setSelectedType('');
    setSelectedMood('');
    setSelectedMilestone('');
    onClearFilters?.();
  };
  
  // 检查往年今日
  const checkSameDayLastYear = async () => {
    if (!currentBaby) {
      showToast('请先创建宝宝档案', 'error');
      return;
    }
    
    if (!showSameDay) {
      const today = new Date();
      const sameDay = await getMomentsOnSameDayLastYear(currentBaby.id, today.toISOString());
      setSameDayMoments(sameDay);
    }
    setShowSameDay(!showSameDay);
  };
  
  const handlePhotoClick = (photos, index = 0) => {
    setSelectedPhotos(photos);
    setPhotoIndex(index);
  };
  
  // 删除动态（软删除）
  const handleDeleteMoment = async (id) => {
    try {
      await deleteMoment(id);
      
      if (currentBaby?.id) {
        const updatedMoments = await getMomentsByBaby(currentBaby.id);
        setMoments(updatedMoments);
      }
      
      showToast('已删除');
    } catch (error) {
      showToast('删除失败: ' + error.message, 'error');
    }
  };
  
  // 导入示例数据
  const importSampleData = async () => {
    if (!confirm('确定要导入50条示例宝宝记录吗？\n\n📝 包含：视频10条、语音10条、日记10条、单图10条、多图10条')) return;
    
    try {
      const request = indexedDB.open('BabyTimeDB', 4);
      
      request.onsuccess = async (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['moments'], 'readwrite');
        const store = transaction.objectStore('moments');
        
        // 50条示例数据（精简版，包含所有类型）
        const sampleData = [
          // 视频 10条
          { date: '2023-06-15', type: 'video', content: '小豆芽今天第一次翻身啦！从趴着到仰着，虽然只是一瞬间，但是妈妈抓拍到了！太激动了！', milestone: '第一次翻身', mood: '激动', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2023-07-22', type: 'video', content: '爬行小能手上线！弟弟终于学会爬了，沙发上、地上到处爬，进步好大呀！', milestone: '学会爬行', mood: '欣慰', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2023-09-10', type: 'video', content: '宝宝第一次叫妈妈了！虽然还不太清晰，但是我听到了！当妈的心都要化了！', milestone: '第一次叫妈妈', mood: '感动', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2023-10-18', type: 'video', content: '今天是小豆芽的周岁生日！抓周仪式太可爱了，抓了本书和一个小算盘，未来是不是学霸呢？', milestone: '周岁抓周', mood: '幸福', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2023-11-25', type: 'video', content: '迈出人生第一步！宝宝终于放开手自己走了，虽然摇摇晃晃，但是太勇敢了！', milestone: '第一次走路', mood: '惊喜', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2024-01-08', type: 'video', content: '小豆芽学会用勺子自己吃饭了！虽然弄得满脸都是，但是好棒呀，进步好大！', milestone: '自主进食', mood: '欣慰', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2024-03-15', type: 'video', content: '第一次在早教中心和其他小朋友互动，表现得很好！越来越社会化啦！', milestone: '社交初体验', mood: '开心', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2024-05-20', type: 'video', content: '宝宝会跳舞啦！听到音乐就摇头晃脑，小手挥舞，太可爱了！', milestone: '音乐感知', mood: '欢乐', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2024-08-12', type: 'video', content: '小豆芽第一次去海边！踩沙子、玩海水，兴奋得不行，笑得眼睛都眯成一条缝了！', milestone: '初次看海', mood: '幸福', videos: [{ url: '', cover: '', duration: 0 }] },
          { date: '2024-11-03', type: 'video', content: '会说完整句子了！"妈妈我爱你"，天哪，这是什么神仙宝宝！', milestone: '语言突破', mood: '感动', videos: [{ url: '', cover: '', duration: 0 }] },
          
          // 语音 10条
          { date: '2023-08-05', type: 'audio', content: '今天豆芽第一次发出"ba"的音，虽然是无意识的，但是爸爸激动了一整天！', milestone: '咿呀学语', mood: '开心', audios: [{ url: '', duration: 0 }] },
          { date: '2023-09-28', type: 'audio', content: '豆芽会唱小星星了！虽然只有几个音，但听起来好可爱啊～', milestone: '学唱歌曲', mood: '惊喜', audios: [{ url: '', duration: 0 }] },
          { date: '2023-11-12', type: 'audio', content: '今天学会了一首新儿歌，《两只老虎》唱得特别有意思！', milestone: '语言发展', mood: '欢乐', audios: [{ url: '', duration: 0 }] },
          { date: '2024-01-20', type: 'audio', content: '给豆芽讲故事，她居然能复述最后一句了！语言能力发展好快！', milestone: '语言发展', mood: '欣慰', audios: [{ url: '', duration: 0 }] },
          { date: '2024-03-08', type: 'audio', content: '第一次录到豆芽喊"奶奶"，外婆听了激动坏了！', milestone: '学会称呼', mood: '幸福', audios: [{ url: '', duration: 0 }] },
          { date: '2024-05-15', type: 'audio', content: '豆芽在自言自语编故事，说小兔子去旅行了，好有想象力！', milestone: '想象力', mood: '惊喜', audios: [{ url: '', duration: 0 }] },
          { date: '2024-07-22', type: 'audio', content: '今天唱生日歌给爷爷听，唱得特别认真，好感动啊！', milestone: '情感表达', mood: '感动', audios: [{ url: '', duration: 0 }] },
          { date: '2024-09-10', type: 'audio', content: '豆芽学会了背古诗，《咏鹅》背得特别流利，小学霸上线！', milestone: '学习能力', mood: '骄傲', audios: [{ url: '', duration: 0 }] },
          { date: '2024-11-28', type: 'audio', content: '录到了豆芽第一次说"对不起"，虽然还说不清楚，但是好有礼貌！', milestone: '礼貌用语', mood: '欣慰', audios: [{ url: '', duration: 0 }] },
          { date: '2025-01-15', type: 'audio', content: '豆芽会用英文数数了！one two three four five，太厉害了！', milestone: '英语启蒙', mood: '惊喜', audios: [{ url: '', duration: 0 }] },
          
          // 文字日记 10条
          { date: '2023-06-28', type: 'diary', content: '今天豆芽打疫苗，哭了两声就不哭了，好勇敢！回家睡得特别香。', milestone: '疫苗接种', mood: '心疼又骄傲' },
          { date: '2023-08-18', type: 'diary', content: '第一次带豆芽去游泳，她居然不怕水，在水里踢踢腿，好开心呀！', milestone: '游泳初体验', mood: '惊喜' },
          { date: '2023-10-05', type: 'diary', content: '豆芽发烧了，凌晨两点抱着她量体温，心疼得不行。希望快点好起来！', milestone: '生病照顾', mood: '担心' },
          { date: '2023-12-12', type: 'diary', content: '今天豆芽学会了自己脱袜子，小手特别灵活！每天都在进步呢！', milestone: '精细动作', mood: '开心' },
          { date: '2024-02-14', type: 'diary', content: '情人节收到了豆芽送的花——她从公园捡的一朵小野花，说送给妈妈，好感动！', milestone: '情感表达', mood: '感动' },
          { date: '2024-04-20', type: 'diary', content: '豆芽第一次尝试滑滑梯，从最矮的滑下来，笑得好开心！', milestone: '游乐设施', mood: '欢乐' },
          { date: '2024-06-18', type: 'diary', content: '今天豆芽自己拼好了6块拼图，虽然花了很久，但是好有耐心！', milestone: '益智游戏', mood: '骄傲' },
          { date: '2024-08-25', type: 'diary', content: '豆芽今天把最喜欢的布偶兔介绍给我，说这是她的好朋友，要好好照顾它。', milestone: '物权意识', mood: '温馨' },
          { date: '2024-10-12', type: 'diary', content: '豆芽上幼儿园第一天，哭着不肯放手，但还是勇敢地进去了，妈妈为你骄傲！', milestone: '入园第一天', mood: '不舍又骄傲' },
          { date: '2025-02-08', type: 'diary', content: '今天豆芽帮我洗菜了，虽然弄得满地都是水，但是宝贝的心意最重要！', milestone: '家务参与', mood: '幸福' },
          
          // 单图 10条
          { date: '2023-07-10', type: 'photo', content: '小豆芽百天照！穿上小裙子像个小公主，眼睛亮晶晶的，好可爱呀！', milestone: '百天纪念', mood: '幸福', photos: [''] },
          { date: '2023-09-05', type: 'photo', content: '今天豆芽会坐了，给她放在餐椅上拍照，小脸认真极了！', milestone: '学会独坐', mood: '欣慰', photos: [''] },
          { date: '2023-11-20', type: 'photo', content: '豆芽的第一双学步鞋！粉粉嫩嫩的，穿上后走路都带风！', milestone: '学步准备', mood: '期待', photos: [''] },
          { date: '2024-01-25', type: 'photo', content: '过年前带豆芽买了新衣服，穿上红棉袄喜庆极了，像个福娃娃！', milestone: '新年装扮', mood: '喜庆', photos: [''] },
          { date: '2024-04-02', type: 'photo', content: '豆芽第一次去踏青，在草地上奔跑的样子好开心，像只快乐的小兔子！', milestone: '户外活动', mood: '欢乐', photos: [''] },
          { date: '2024-06-15', type: 'photo', content: '豆芽2岁啦！生日蛋糕上的蜡烛映着她的小脸，许愿的样子好认真！', milestone: '两岁生日', mood: '幸福', photos: [''] },
          { date: '2024-09-18', type: 'photo', content: '今天带豆芽去动物园，她最喜欢小熊猫，抱着一只玩偶不肯放手！', milestone: '动物园初体验', mood: '开心', photos: [''] },
          { date: '2024-12-05', type: 'photo', content: '豆芽第一天上幼儿园，背着书包的样子好神气！长大了呢！', milestone: '入园纪念', mood: '骄傲', photos: [''] },
          { date: '2025-02-20', type: 'photo', content: '冬天的豆芽裹成小粽子，在雪地里玩雪，脸蛋红扑扑的，好可爱！', milestone: '玩雪初体验', mood: '欢乐', photos: [''] },
          { date: '2025-05-01', type: 'photo', content: '五一假期带豆芽去公园，她最喜欢喂小鱼，一勺一勺好认真！', milestone: '户外探索', mood: '温馨', photos: [''] },
          
          // 多图 10条
          { date: '2023-08-12', type: 'photo', content: '豆芽和爸爸的亲子时光，父女俩一起搭积木，笑容灿烂！', milestone: '亲子互动', mood: '幸福', photos: ['', '', '', ''] },
          { date: '2023-10-01', type: 'photo', content: '国庆假期全家福，豆芽在中间笑得最灿烂，一家人好幸福！', milestone: '全家福', mood: '温馨', photos: ['', '', ''] },
          { date: '2024-01-01', type: 'photo', content: '新年第一天，豆芽穿上新衣服给大家拜年，小嘴甜甜的！', milestone: '新年祝福', mood: '喜庆', photos: ['', '', '', '', ''] },
          { date: '2024-03-12', type: 'photo', content: '春天来了！带豆芽去踏春，樱花树下留下美好回忆！', milestone: '春游', mood: '美好', photos: ['', '', '', '', '', ''] },
          { date: '2024-05-05', type: 'photo', content: '劳动节教豆芽种花，她学得可认真了，小手挖土好可爱！', milestone: '种植体验', mood: '温馨', photos: ['', '', '', ''] },
          { date: '2024-07-10', type: 'photo', content: '暑假海边度假，豆芽在沙滩上堆城堡、捡贝壳，玩得不亦乐乎！', milestone: '海边度假', mood: '欢乐', photos: ['', '', '', '', '', '', '', ''] },
          { date: '2024-08-20', type: 'photo', content: '豆芽学画画啦！虽然画得乱七八糟，但是色彩好鲜艳，充满了想象力！', milestone: '艺术启蒙', mood: '惊喜', photos: ['', '', '', '', ''] },
          { date: '2024-10-25', type: 'photo', content: '万圣节变装派对！豆芽装扮成小女巫，可爱又俏皮！', milestone: '节日装扮', mood: '欢乐', photos: ['', '', '', ''] },
          { date: '2025-01-01', type: 'photo', content: '新的一年新的开始！豆芽许下新年愿望，希望能实现哦！', milestone: '新年愿望', mood: '期待', photos: ['', '', '', '', ''] },
          { date: '2025-04-15', type: 'photo', content: '春天万物复苏！带豆芽去春游，赏花、放风筝，度过了美好的周末！', milestone: '周末出游', mood: '幸福', photos: ['', '', '', '', '', ''] }
        ];
        
        let success = 0;
        for (const item of sampleData) {
          const data = {
            babyId: 1,
            date: item.date,
            type: item.type,
            content: item.content,
            milestone: item.milestone,
            mood: item.mood,
            createdAt: new Date(item.date + 'T08:00:00.000Z').toISOString(),
            updatedAt: new Date().toISOString(),
            isDeleted: false,
            deletedAt: null
          };
          if (item.videos) data.videos = item.videos;
          if (item.audios) data.audios = item.audios;
          if (item.photos) data.photos = item.photos;
          
          store.add(data);
          success++;
        }
        
        db.close();
        
        // 刷新页面数据
        if (currentBaby?.id) {
          const updatedMoments = await getMomentsByBaby(currentBaby.id);
          setMoments(updatedMoments);
        }
        
        showToast(`✅ 成功导入 ${success} 条宝宝记录！`);
      };
      
      request.onerror = () => {
        showToast('导入失败：无法打开数据库', 'error');
      };
    } catch (e) {
      showToast('导入失败：' + e.message, 'error');
    }
  };
  
  // 计算筛选后的记录数
  const filteredCount = filteredMoments.length;
  const totalCount = moments.filter(m => !m.isDeleted).length;
  
  return (
    <div 
      ref={containerRef}
      className="min-h-screen pb-20" 
      onTouchStart={handleTouchStart} 
      onTouchMove={handleTouchMove} 
      onTouchEnd={handleTouchEnd}
    >
      {/* 下拉刷新指示器 */}
      {(pullDistance > 0 || isRefreshing) && (
        <div 
          className="flex items-center justify-center py-3 text-gray-400 transition-transform"
          style={{ transform: `translateY(${pullDistance}px)` }}
        >
          {isRefreshing ? (
            <div className="animate-spin w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full" />
          ) : (
            <div 
              className="w-5 h-5 border-2 border-gray-300 border-t-primary-400 rounded-full transition-transform"
              style={{ transform: `rotate(${pullDistance * 3}deg)` }}
            />
          )}
        </div>
      )}
      
      {/* 头部 - 优化：左上角显示头像 */}
      <header className="bg-gradient-to-b from-primary-400 to-primary-500 text-white safe-top">
        <div className="px-4 pt-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {/* 头像显示在左上角 */}
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden">
                {currentUser?.avatar ? (
                  currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http') ? (
                    <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{currentUser.avatar}</span>
                  )
                ) : (
                  <span>👶</span>
                )}
              </div>
              <h1 className="text-xl font-bold">📅 时光轴</h1>
            </div>
            <div className="flex items-center gap-2">
              {/* 往年今日按钮 */}
              <button
                onClick={checkSameDayLastYear}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/20 rounded-full text-sm hover:bg-white/30 transition-colors"
              >
                <Clock className="w-4 h-4" />
                <span>往年今日</span>
              </button>
            </div>
          </div>
          
          <BabyHeader />
          
          {/* 筛选标签区域 */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mt-4">
              {getActiveFilterLabel().map((label, index) => (
                <span 
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-full text-sm"
                >
                  {label}
                  <button 
                    onClick={() => {
                      if (selectedType) setSelectedType('');
                      else if (selectedMood) setSelectedMood('');
                      else if (selectedMilestone) setSelectedMilestone('');
                      if (!selectedType && !selectedMood && !selectedMilestone) {
                        onClearFilters?.();
                      }
                    }}
                    className="ml-1 hover:bg-white/20 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button 
                onClick={handleClearAllFilters}
                className="px-3 py-1.5 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-colors"
              >
                清除全部
              </button>
            </div>
          )}
        </div>
      </header>
      
      {/* 往年今日折叠面板 - 就地展开 */}
      {showSameDay && (
        <div className="px-4 py-3 bg-cream-50 dark:bg-gray-800/50 animate-slide-up">
          <div className="max-w-lg mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-card overflow-hidden">
              <div className="p-4 border-b border-cream-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🕰️</span>
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    往年今日
                  </h3>
                </div>
              </div>
              <div className="p-4">
                {sameDayMoments.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">
                    去年今天没有记录，继续创造回忆吧~
                  </p>
                ) : (
                  <div className="space-y-4">
                    {sameDayMoments.map(moment => (
                      <MomentCard
                        key={moment.id}
                        moment={moment}
                        onClick={handlePhotoClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 筛选器 - 水平滚动 */}
      <div className="px-4 mt-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-3 space-y-2">
          {/* 类型筛选 */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {typeFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedType(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedType === filter.value
                    ? 'bg-primary-500 text-white font-medium'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* 心情筛选 */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {moodFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedMood(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedMood === filter.value
                    ? 'bg-warm-500 text-white font-medium'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
          
          {/* 里程碑筛选 */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {milestoneFilters.map(filter => (
              <button
                key={filter.value}
                onClick={() => setSelectedMilestone(filter.value)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedMilestone === filter.value
                    ? 'bg-purple-500 text-white font-medium'
                    : 'bg-cream-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-cream-200 dark:hover:bg-gray-600'
                }`}
              >
                {filter.label}
              </button>
            ))}
            {/* 导入示例数据按钮 */}
            <button
              onClick={importSampleData}
              className="px-3 py-1.5 bg-gradient-to-r from-pink-400 to-rose-400 text-white rounded-full text-sm whitespace-nowrap hover:from-pink-500 hover:to-rose-500 transition-all shadow-sm flex-shrink-0"
              title="一键导入50条示例数据"
            >
              📥 导入示例
            </button>
          </div>
        </div>
      </div>
      
      {/* 时光轴内容 */}
      <main className="px-4 mt-4">
        {/* 筛选结果统计 */}
        {hasActiveFilters && (
          <div className="mb-4 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              共找到 <span className="font-bold text-primary-500">{filteredCount}</span> 条记录
              {filteredCount !== totalCount && `（共 ${totalCount} 条）`}
            </p>
          </div>
        )}
        
        {groupedMoments.length === 0 ? (
          <div className="text-center py-12 animate-fade-in">
            <div className="w-24 h-24 mx-auto mb-4 bg-cream-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Calendar className="w-12 h-12 text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {hasActiveFilters ? '暂无符合条件的记录' : '还没有记录哦'}
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {hasActiveFilters ? '试试调整筛选条件' : '点击右下角 + 按钮添加第一条记录'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearAllFilters}
                className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-full text-sm hover:bg-primary-600 transition-colors"
              >
                清除筛选
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            {/* 时间轴线 */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary-300 via-primary-200 to-transparent" />
            
            {groupedMoments.map((group) => (
              <div key={`${group.year}-${group.month}`} className="relative mb-6">
                {/* 年月标签 */}
                <div className="sticky top-0 z-10 py-2">
                  <div className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full px-4 py-1.5 shadow-sm">
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      {group.year}年{group.month}月
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {group.moments.length}条记录
                    </span>
                  </div>
                </div>
                
                {/* 动态列表 */}
                <div className="ml-10">
                  {group.moments.map((moment) => (
                    <div key={moment.id} className="relative">
                      <div className="absolute -left-8 top-4 w-3 h-3 rounded-full bg-white border-2 border-primary-400 shadow-sm" />
                      
                      <MomentCard
                        moment={moment}
                        onEdit={onEditMoment}
                        onDelete={handleDeleteMoment}
                        onClick={handlePhotoClick}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      
      {/* 照片查看器 */}
      {selectedPhotos && (
        <PhotoViewer
          photos={selectedPhotos}
          initialIndex={photoIndex}
          onClose={() => setSelectedPhotos(null)}
        />
      )}
      
      {/* 右下角添加按钮 */}
      <button
        onClick={onAddMoment}
        className="fixed right-4 bottom-20 w-14 h-14 bg-gradient-to-br from-primary-500 to-warm-500 rounded-full shadow-lg flex items-center justify-center z-20 active:scale-95 transition-transform hover:shadow-xl"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </button>

          </div>
        </div>
      </div>
    </div>
  );
}
