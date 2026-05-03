/**
 * 时光轴页面
 * 优化版本：往年今日折叠面板，头像显示在左上角，支持分享功能
 */

import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { BabyHeader } from '../components/BabyHeader';
import { MomentCard } from '../components/MomentCard';
import { PhotoViewer } from '../components/PhotoViewer';
import { ShareCard } from '../components/ShareCard';
import { groupByYearAndMonth } from '../utils/dateUtils';
import { getMomentsOnSameDayLastYear, deleteMoment, getMomentsByBaby, addMoment } from '../utils/db';
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
  const [sharingMoment, setSharingMoment] = useState(null);
  
  // 下拉刷新状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const touchStartY = useRef(0);
  const scrollTop = useRef(0);
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  
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
  
  // 分享动态
  const handleShareMoment = useCallback((moment) => {
    setSharingMoment(moment);
  }, []);
  
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
    
    if (!currentBaby) {
      showToast('请先添加宝宝信息', 'error');
      return;
    }
    
    try {
      // 50条示例数据
      const sampleData = [
        // 视频 10条
        { date: '2023-06-15', type: 'video', content: '小豆芽今天第一次翻身啦！从趴着到仰着，虽然只是一瞬间，但是妈妈抓拍到了！太激动了！', milestone: 'first', milestoneLabel: '第一次翻身', mood: 'happy', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2023-07-22', type: 'video', content: '爬行小能手上线！弟弟终于学会爬了，沙发上、地上到处爬，进步好大呀！', milestone: 'growth', milestoneLabel: '学会爬行', mood: 'happy', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2023-09-10', type: 'video', content: '宝宝第一次叫妈妈了！虽然还不太清晰，但是我听到了！当妈的心都要化了！', milestone: 'learning', milestoneLabel: '第一次叫妈妈', mood: 'touched', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2023-10-18', type: 'video', content: '今天是小豆芽的周岁生日！抓周仪式太可爱了，抓了本书和一个小算盘，未来是不是学霸呢？', milestone: 'first', milestoneLabel: '周岁抓周', mood: 'excited', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2023-11-25', type: 'video', content: '迈出人生第一步！宝宝终于放开手自己走了，虽然摇摇晃晃，但是太勇敢了！', milestone: 'first', milestoneLabel: '第一次走路', mood: 'excited', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2024-01-08', type: 'video', content: '小豆芽学会用勺子自己吃饭了！虽然弄得满脸都是，但是好棒呀，进步好大！', milestone: 'growth', milestoneLabel: '自主进食', mood: 'happy', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2024-03-15', type: 'video', content: '今天天气很好，带着宝宝去公园玩水，溅得全身都是，好开心呀！', milestone: 'daily', milestoneLabel: '户外活动', mood: 'excited', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2024-05-20', type: 'video', content: '宝宝学会骑平衡车啦！虽然偶尔还会摔倒，但是越来越厉害了！', milestone: 'growth', milestoneLabel: '学会骑车', mood: 'excited', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2024-07-12', type: 'video', content: '宝宝在早教中心学习新技能，和其他小朋友互动好开心呀！', milestone: 'learning', milestoneLabel: '早教课', mood: 'happy', videos: [{ url: '', cover: '', duration: 0 }] },
        { date: '2024-09-01', type: 'video', content: '第一天上学！宝宝背着书包好兴奋，虽然有点舍不得，但是很勇敢！', milestone: 'first', milestoneLabel: '第一天上学', mood: 'touched', videos: [{ url: '', cover: '', duration: 0 }] },
        
        // 语音 10条
        { date: '2023-08-15', type: 'audio', content: '宝宝今天学了一首新儿歌，唱得可好了！', milestone: 'learning', milestoneLabel: '学唱儿歌', mood: 'happy', audios: [{ url: '', duration: 30, waveform: [] }] },
        { date: '2023-12-20', type: 'audio', content: '圣诞节的祝福送给所有人！Merry Christmas！', milestone: 'daily', milestoneLabel: '节日祝福', mood: 'excited', audios: [{ url: '', duration: 15, waveform: [] }] },
        { date: '2024-02-10', type: 'audio', content: '给大家拜年啦！祝大家新年快乐！', milestone: 'daily', milestoneLabel: '新年祝福', mood: 'excited', audios: [{ url: '', duration: 20, waveform: [] }] },
        { date: '2024-04-05', type: 'audio', content: '今天学会背古诗啦！给大家表演一下~', milestone: 'learning', milestoneLabel: '背古诗', mood: 'excited', audios: [{ url: '', duration: 45, waveform: [] }] },
        { date: '2024-06-01', type: 'audio', content: '儿童节快乐！谢谢爸爸妈妈给我这么多快乐！', milestone: 'daily', milestoneLabel: '儿童节', mood: 'happy', audios: [{ url: '', duration: 25, waveform: [] }] },
        { date: '2024-08-20', type: 'audio', content: '今天故事时间，妈妈讲了一个特别有趣的故事！', milestone: 'daily', milestoneLabel: '故事时间', mood: 'touched', audios: [{ url: '', duration: 60, waveform: [] }] },
        { date: '2024-10-15', type: 'audio', content: '宝宝学动物叫声，学的可像了！', milestone: 'learning', milestoneLabel: '学动物叫', mood: 'excited', audios: [{ url: '', duration: 20, waveform: [] }] },
        { date: '2024-11-28', type: 'audio', content: '感恩节的祝福！谢谢大家陪伴我成长！', milestone: 'daily', milestoneLabel: '感恩节', mood: 'touched', audios: [{ url: '', duration: 30, waveform: [] }] },
        { date: '2024-12-25', type: 'audio', content: '圣诞节来啦！圣诞老人会给我送礼物吗？', milestone: 'daily', milestoneLabel: '圣诞节', mood: 'excited', audios: [{ url: '', duration: 25, waveform: [] }] },
        { date: '2025-01-01', type: 'audio', content: '新年的第一缕阳光！祝大家新年快乐！', milestone: 'daily', milestoneLabel: '新年第一天', mood: 'excited', audios: [{ url: '', duration: 35, waveform: [] }] },
        
        // 日记 10条
        { date: '2023-05-20', type: 'diary', content: '今天是小豆芽出生第100天！我们办了百日宴，好多亲戚朋友都来祝贺呢！宝宝今天特别乖，一直笑眯眯的~', milestone: 'first', milestoneLabel: '百日宴', mood: 'happy' },
        { date: '2023-08-01', type: 'diary', content: '带宝宝去游泳馆游泳，这是第一次下水呢！一开始有点紧张，后来就玩得很开心了，小脚踢水踢得可欢了！', milestone: 'first', milestoneLabel: '第一次游泳', mood: 'excited' },
        { date: '2023-11-01', type: 'diary', content: '今天宝宝发烧了，一直哼哼唧唧的，看得妈妈好心疼。还好晚上就退烧了，第二天又活蹦乱跳了！', milestone: 'health', milestoneLabel: '生病记录', mood: 'crying' },
        { date: '2024-02-14', type: 'diary', content: '今天是情人节，妈妈和爸爸带着宝宝去吃大餐。虽然宝宝还不懂什么是情人节，但是看到爸爸妈妈在一起就很开心！', milestone: 'daily', milestoneLabel: '情人节', mood: 'happy' },
        { date: '2024-04-01', type: 'diary', content: '愚人节逗宝宝玩，说要把他的零食吃掉，结果他当真了，眼泪汪汪的，太可爱了！以后再也不逗他了...', milestone: 'daily', milestoneLabel: '日常趣事', mood: 'excited' },
        { date: '2024-06-18', type: 'diary', content: '父亲节！宝宝亲手给爸爸做了贺卡，虽然只是乱涂乱画，但是爸爸说这是他收到最好的礼物！', milestone: 'daily', milestoneLabel: '父亲节', mood: 'touched' },
        { date: '2024-08-08', type: 'diary', content: '今天宝宝会自己穿鞋了！虽然左右脚有时候会穿反，但是已经很棒了，独立完成了一件小事！', milestone: 'growth', milestoneLabel: '学会自理', mood: 'happy' },
        { date: '2024-10-10', type: 'diary', content: '带宝宝去体检，身高体重都达标啦！医生说发育很好，要继续保持哦~', milestone: 'health', milestoneLabel: '体检记录', mood: 'happy' },
        { date: '2024-12-10', type: 'diary', content: '宝宝开始学画画了，虽然画得乱七八糟的，但是每一幅都是他的作品，要好好保存起来！', milestone: 'learning', milestoneLabel: '学画画', mood: 'excited' },
        { date: '2025-01-15', type: 'diary', content: '今天宝宝说了一句特别暖心的话：妈妈我爱你！听到这句话的瞬间，觉得所有的辛苦都值得了！', milestone: 'daily', milestoneLabel: '暖心瞬间', mood: 'touched' },
        
        // 单图 10条
        { date: '2023-07-10', type: 'photo', content: '小豆芽百天照！穿上小裙子像个小公主，眼睛亮晶晶的，好可爱呀！', milestone: 'first', milestoneLabel: '百天纪念', mood: 'happy', photos: [''] },
        { date: '2023-09-05', type: 'photo', content: '今天宝宝会坐了，给她放在餐椅上拍照，小脸认真极了！', milestone: 'growth', milestoneLabel: '学会独坐', mood: 'happy', photos: [''] },
        { date: '2023-11-20', type: 'photo', content: '宝宝的第一双学步鞋！粉粉嫩嫩的，穿上后走路都带风！', milestone: 'growth', milestoneLabel: '学步准备', mood: 'excited', photos: [''] },
        { date: '2024-01-25', type: 'photo', content: '过年前带宝宝买了新衣服，穿上红棉袄喜庆极了，像个福娃娃！', milestone: 'daily', milestoneLabel: '新年装扮', mood: 'happy', photos: [''] },
        { date: '2024-04-02', type: 'photo', content: '宝宝第一次去踏青，在草地上奔跑的样子好开心，像只快乐的小兔子！', milestone: 'daily', milestoneLabel: '户外活动', mood: 'excited', photos: [''] },
        { date: '2024-06-15', type: 'photo', content: '宝宝2岁啦！生日蛋糕上的蜡烛映着她的小脸，许愿的样子好认真！', milestone: 'first', milestoneLabel: '两岁生日', mood: 'happy', photos: [''] },
        { date: '2024-09-18', type: 'photo', content: '今天带宝宝去动物园，她最喜欢小熊猫，抱着一只玩偶不肯放手！', milestone: 'daily', milestoneLabel: '动物园初体验', mood: 'excited', photos: [''] },
        { date: '2024-12-05', type: 'photo', content: '宝宝第一天上幼儿园，背着书包的样子好神气！长大了呢！', milestone: 'first', milestoneLabel: '入园纪念', mood: 'proud', photos: [''] },
        { date: '2025-02-20', type: 'photo', content: '冬天的宝宝裹成小粽子，在雪地里玩雪，脸蛋红扑扑的，好可爱！', milestone: 'daily', milestoneLabel: '玩雪初体验', mood: 'excited', photos: [''] },
        { date: '2025-05-01', type: 'photo', content: '五一假期带宝宝去公园，她最喜欢喂小鱼，一勺一勺好认真！', milestone: 'daily', milestoneLabel: '户外探索', mood: 'happy', photos: [''] },
        
        // 多图 10条
        { date: '2023-08-12', type: 'photo', content: '宝宝和爸爸的亲子时光，父女俩一起搭积木，笑容灿烂！', milestone: 'family', milestoneLabel: '亲子互动', mood: 'happy', photos: ['', '', '', ''] },
        { date: '2023-10-01', type: 'photo', content: '国庆假期全家福，宝宝在中间笑得最灿烂，一家人好幸福！', milestone: 'family', milestoneLabel: '全家福', mood: 'happy', photos: ['', '', ''] },
        { date: '2024-01-01', type: 'photo', content: '新年第一天，宝宝穿上新衣服给大家拜年，小嘴甜甜的！', milestone: 'daily', milestoneLabel: '新年祝福', mood: 'excited', photos: ['', '', '', '', ''] },
        { date: '2024-03-08', type: 'photo', content: '三八妇女节，宝宝给妈妈送了一束自己画的花，好感动！', milestone: 'daily', milestoneLabel: '妇女节礼物', mood: 'touched', photos: ['', '', ''] },
        { date: '2024-05-12', type: 'photo', content: '母亲节，宝宝亲手给妈妈做了贺卡，写着妈妈我爱你！虽然字歪歪扭扭的，但是好暖心！', milestone: 'daily', milestoneLabel: '母亲节', mood: 'touched', photos: ['', '', '', ''] },
        { date: '2024-07-01', type: 'photo', content: '建党节带宝宝去看升旗仪式，宝宝看得特别认真，从小培养爱国情怀！', milestone: 'daily', milestoneLabel: '升旗仪式', mood: 'proud', photos: ['', '', ''] },
        { date: '2024-09-10', type: 'photo', content: '教师节，宝宝给老师送了小礼物，老师夸宝宝是个懂事的好孩子！', milestone: 'daily', milestoneLabel: '教师节', mood: 'happy', photos: ['', '', '', ''] },
        { date: '2024-11-11', type: 'photo', content: '双十一，妈妈给宝宝买了好多新衣服和新玩具，宝宝开心得不得了！', milestone: 'daily', milestoneLabel: '购物节', mood: 'excited', photos: ['', '', ''] },
        { date: '2024-12-25', type: 'photo', content: '圣诞节，宝宝收到了圣诞老人送的礼物，开心极了！', milestone: 'daily', milestoneLabel: '圣诞节', mood: 'excited', photos: ['', '', '', '', ''] },
        { date: '2025-02-19', type: 'photo', content: '元宵节，宝宝自己做了灯笼，虽然歪歪扭扭的，但是很有成就感！', milestone: 'daily', milestoneLabel: '元宵节', mood: 'happy', photos: ['', '', ''] },
      ];
      
      // 批量导入，关联当前宝宝
      let success = 0;
      for (const data of sampleData) {
        await addMoment({
          ...data,
          babyId: currentBaby.id,
          babyName: currentBaby.name,
        });
        success++;
      }
      
      // 刷新数据
      const babyMoments = await getMomentsByBaby(currentBaby.id);
      setMoments(babyMoments);
      
      showToast(`✅ 成功导入 ${success} 条宝宝记录！`, 'success');
    } catch (e) {
      console.error('导入失败:', e);
      showToast('导入失败：' + e.message, 'error');
    }
  };

  // 从文件导入数据
  const importFromFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.moments || !Array.isArray(data.moments)) {
        showToast('文件格式错误，请确保包含moments数组', 'error');
        return;
      }
      
      if (!currentBaby) {
        showToast('请先添加宝宝信息', 'error');
        return;
      }
      
      const confirmed = confirm(`确定要导入 ${data.moments.length} 条记录吗？`);
      if (!confirmed) return;
      
      let success = 0;
      for (const momentData of data.moments) {
        await addMoment({
          ...momentData,
          babyId: currentBaby.id,
          babyName: currentBaby.name,
        });
        success++;
      }
      
      // 刷新数据
      const babyMoments = await getMomentsByBaby(currentBaby.id);
      setMoments(babyMoments);
      
      showToast(`✅ 成功导入 ${success} 条记录！`, 'success');
    } catch (error) {
      console.error('导入文件失败:', error);
      showToast('导入失败：文件格式错误', 'error');
    }
    
    // 清空input，允许重复选择同一文件
    e.target.value = '';
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
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium rounded-full shadow-sm hover:shadow-md transition-shadow"
              title="从JSON文件导入记录"
            >
              📂 从文件导入
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={importFromFile}
              className="hidden"
            />
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
                        onShare={handleShareMoment}
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

      {/* 分享卡片弹窗 */}
      <ShareCard
        visible={!!sharingMoment}
        onClose={() => setSharingMoment(null)}
        data={sharingMoment}
        title={sharingMoment?.milestoneLabel}
        content={sharingMoment?.content}
        babyName={currentBaby?.name}
        date={sharingMoment?.date}
        type={sharingMoment?.type}
        thumbnail={sharingMoment?.photos?.[0] || sharingMoment?.videos?.[0]?.cover}
        mood={sharingMoment?.mood}
        milestone={sharingMoment?.milestone}
      />

      {/* 添加记录按钮 */}
      <button
        onClick={onAddMoment}
        className="fixed right-4 bottom-32 w-14 h-14 bg-gradient-to-br from-primary-500 to-warm-500 rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 transition-transform hover:shadow-xl"
      >
        <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
      </button>
    </div>
  );
}
