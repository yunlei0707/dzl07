/**
 * IndexedDB 数据库操作模块
 * 使用 idb 库封装数据库操作，支持宝宝档案、动态记录、时空胶囊的增删改查
 */

import { openDB } from 'idb';

const DB_NAME = 'BabyTimeDB';
const DB_VERSION = 4; // 版本升级以支持访客打卡功能

// 初始化数据库
export async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // 宝宝档案存储
      if (!db.objectStoreNames.contains('babies')) {
        const babyStore = db.createObjectStore('babies', { keyPath: 'id', autoIncrement: true });
        babyStore.createIndex('createdAt', 'createdAt');
      }

      // 动态记录存储
      if (!db.objectStoreNames.contains('moments')) {
        const momentStore = db.createObjectStore('moments', { keyPath: 'id', autoIncrement: true });
        momentStore.createIndex('babyId', 'babyId');
        momentStore.createIndex('date', 'date');
        momentStore.createIndex('createdAt', 'createdAt');
        momentStore.createIndex('milestone', 'milestone');
      }

      // 时空胶囊存储
      if (!db.objectStoreNames.contains('capsules')) {
        const capsuleStore = db.createObjectStore('capsules', { keyPath: 'id', autoIncrement: true });
        capsuleStore.createIndex('babyId', 'babyId');
        capsuleStore.createIndex('unlockDate', 'unlockDate');
        capsuleStore.createIndex('createdAt', 'createdAt');
      }

      // 设置存储
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // 用户表存储（用于登录注册）
      if (!db.objectStoreNames.contains('users')) {
        const userStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        userStore.createIndex('username', 'username', { unique: true });
        userStore.createIndex('createdAt', 'createdAt');
      }

      // 访客打卡存储
      if (!db.objectStoreNames.contains('visits')) {
        const visitStore = db.createObjectStore('visits', { keyPath: 'id', autoIncrement: true });
        visitStore.createIndex('babyId', 'babyId');
        visitStore.createIndex('visitorName', 'visitorName');
        visitStore.createIndex('visitDate', 'visitDate');
        visitStore.createIndex('createdAt', 'createdAt');
      }
    },
  });
}

// ==================== 宝宝档案操作 ====================

/**
 * 获取所有宝宝档案
 */
export async function getAllBabies() {
  const db = await initDB();
  return db.getAll('babies');
}

/**
 * 获取当前选中的宝宝
 */
export async function getCurrentBaby() {
  const babies = await getAllBabies();
  const settings = await getSettings();
  if (settings.currentBabyId) {
    const baby = babies.find(b => b.id === settings.currentBabyId);
    if (baby) return baby;
  }
  return babies[0] || null;
}

/**
 * 添加宝宝档案
 */
export async function addBaby(babyData) {
  const db = await initDB();
  const baby = {
    ...babyData,
    createdAt: new Date().toISOString(),
  };
  const id = await db.add('babies', baby);
  return { ...baby, id };
}

/**
 * 更新宝宝档案
 */
export async function updateBaby(id, updates) {
  const db = await initDB();
  const baby = await db.get('babies', id);
  if (!baby) throw new Error('宝宝档案不存在');
  const updatedBaby = { ...baby, ...updates };
  await db.put('babies', updatedBaby);
  return updatedBaby;
}

/**
 * 删除宝宝档案
 */
export async function deleteBaby(id) {
  const db = await initDB();
  // 删除宝宝的所有动态和胶囊
  const moments = await db.getAllFromIndex('moments', 'babyId', id);
  const capsules = await db.getAllFromIndex('capsules', 'babyId', id);
  
  const tx = db.transaction(['babies', 'moments', 'capsules'], 'readwrite');
  await tx.objectStore('babies').delete(id);
  
  for (const moment of moments) {
    await tx.objectStore('moments').delete(moment.id);
  }
  for (const capsule of capsules) {
    await tx.objectStore('capsules').delete(capsule.id);
  }
  
  await tx.done;
  return true;
}

// ==================== 动态记录操作 ====================

/**
 * 获取某个宝宝的所有动态
 */
export async function getMomentsByBaby(babyId) {
  const db = await initDB();
  const moments = await db.getAllFromIndex('moments', 'babyId', babyId);
  // 过滤未删除的记录，按日期倒序排列
  return moments
    .filter(m => !m.isDeleted)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 获取某个宝宝某个日期的动态（往年今日）
 */
export async function getMomentsOnSameDayLastYear(babyId, targetDate) {
  const db = await initDB();
  const moments = await db.getAllFromIndex('moments', 'babyId', babyId);
  const target = new Date(targetDate);
  const lastYear = new Date(target);
  lastYear.setFullYear(lastYear.getFullYear() - 1);
  
  const targetMonth = target.getMonth();
  const targetDay = target.getDate();
  
  return moments.filter(m => {
    const mDate = new Date(m.date);
    return mDate.getMonth() === targetMonth && mDate.getDate() === targetDay && mDate.getFullYear() !== target.getFullYear();
  });
}

/**
 * 添加动态
 */
export async function addMoment(momentData) {
  const db = await initDB();
  const moment = {
    ...momentData,
    createdAt: new Date().toISOString(),
  };
  const id = await db.add('moments', moment);
  return { ...moment, id };
}

/**
 * 更新动态
 */
export async function updateMoment(id, updates) {
  const db = await initDB();
  const moment = await db.get('moments', id);
  if (!moment) throw new Error('动态不存在');
  const updatedMoment = { ...moment, ...updates, updatedAt: new Date().toISOString() };
  await db.put('moments', updatedMoment);
  return updatedMoment;
}

/**
 * 删除动态
 */
export async function deleteMoment(id) {
  const db = await initDB();
  const moment = await db.get('moments', id);
  if (!moment) return false;
  
  // 标记为已删除，而不是直接删除
  const updatedMoment = {
    ...moment,
    isDeleted: true,
    deletedAt: new Date().toISOString()
  };
  await db.put('moments', updatedMoment);
  return true;
}

/**
 * 根据里程碑标签筛选动态
 */
export async function getMomentsByMilestone(babyId, milestone) {
  const db = await initDB();
  const moments = await db.getAllFromIndex('moments', 'babyId', babyId);
  return moments
    .filter(m => m.milestone === milestone)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// ==================== 时空胶囊操作 ====================

/**
 * 获取某个宝宝的所有时空胶囊
 */
export async function getCapsulesByBaby(babyId) {
  const db = await initDB();
  const capsules = await db.getAllFromIndex('capsules', 'babyId', babyId);
  return capsules.sort((a, b) => new Date(a.unlockDate) - new Date(b.unlockDate));
}

/**
 * 获取已解锁的胶囊
 */
export async function getUnlockedCapsules(babyId) {
  const capsules = await getCapsulesByBaby(babyId);
  const now = new Date();
  return capsules.filter(c => new Date(c.unlockDate) <= now);
}

/**
 * 获取待开封的胶囊
 */
export async function getLockedCapsules(babyId) {
  const capsules = await getCapsulesByBaby(babyId);
  const now = new Date();
  return capsules.filter(c => new Date(c.unlockDate) > now);
}

/**
 * 添加时空胶囊
 */
export async function addCapsule(capsuleData) {
  const db = await initDB();
  const capsule = {
    ...capsuleData,
    createdAt: new Date().toISOString(),
    isUnlocked: false,
  };
  const id = await db.add('capsules', capsule);
  return { ...capsule, id };
}

/**
 * 更新时空胶囊
 */
export async function updateCapsule(id, updates) {
  const db = await initDB();
  const capsule = await db.get('capsules', id);
  if (!capsule) throw new Error('胶囊不存在');
  const updatedCapsule = { ...capsule, ...updates, updatedAt: new Date().toISOString() };
  await db.put('capsules', updatedCapsule);
  return updatedCapsule;
}

/**
 * 删除时空胶囊
 */
export async function deleteCapsule(id) {
  const db = await initDB();
  await db.delete('capsules', id);
  return true;
}

// ==================== 设置操作 ====================

/**
 * 获取所有设置
 */
export async function getSettings() {
  const db = await initDB();
  const allSettings = await db.getAll('settings');
  const settingsMap = {};
  allSettings.forEach(s => {
    settingsMap[s.key] = s.value;
  });
  return {
    theme: settingsMap.theme || 'light',
    themePreset: settingsMap.themePreset || 'pink', // pink, forest, ocean, lavender, sunshine, custom
    customThemeColor: settingsMap.customThemeColor || null,
    currentBabyId: settingsMap.currentBabyId || null,
    customMilestones: settingsMap.customMilestones || [],
    hiddenMilestones: settingsMap.hiddenMilestones || [],
    ...settingsMap,
  };
}

/**
 * 更新设置
 */
export async function updateSettings(updates) {
  const db = await initDB();
  const tx = db.transaction('settings', 'readwrite');
  for (const [key, value] of Object.entries(updates)) {
    await tx.store.put({ key, value });
  }
  await tx.done;
  return getSettings();
}

/**
 * 获取自定义里程碑标签
 */
export async function getCustomMilestones() {
  const settings = await getSettings();
  return settings.customMilestones || [];
}

/**
 * 保存自定义里程碑标签
 */
export async function saveCustomMilestones(milestones) {
  return updateSettings({ customMilestones: milestones });
}

/**
 * 添加自定义里程碑标签
 */
export async function addCustomMilestone(milestone) {
  const milestones = await getCustomMilestones();
  const newMilestone = {
    id: `custom_${Date.now()}`,
    ...milestone,
  };
  milestones.push(newMilestone);
  await saveCustomMilestones(milestones);
  return newMilestone;
}

/**
 * 更新自定义里程碑标签
 */
export async function updateCustomMilestone(id, updates) {
  const milestones = await getCustomMilestones();
  const index = milestones.findIndex(m => m.id === id);
  if (index !== -1) {
    milestones[index] = { ...milestones[index], ...updates };
    await saveCustomMilestones(milestones);
    return milestones[index];
  }
  throw new Error('里程碑不存在');
}

/**
 * 删除自定义里程碑标签
 */
export async function deleteCustomMilestone(id) {
  const milestones = await getCustomMilestones();
  const filtered = milestones.filter(m => m.id !== id);
  await saveCustomMilestones(filtered);
  return true;
}

// ==================== 自定义心情标签 ====================

/**
 * 获取自定义心情标签
 */
export async function getCustomMoods() {
  const settings = await getSettingsFromDB();
  return settings.customMoods || [];
}

/**
 * 保存自定义心情标签
 */
export async function saveCustomMoods(moods) {
  return updateSettings({ customMoods: moods });
}

/**
 * 添加自定义心情标签
 */
export async function addCustomMood(mood) {
  const moods = await getCustomMoods();
  const newMood = {
    id: `mood_${Date.now()}`,
    ...mood,
  };
  moods.push(newMood);
  await saveCustomMoods(moods);
  return newMood;
}

/**
 * 更新自定义心情标签
 */
export async function updateCustomMood(id, updates) {
  const moods = await getCustomMoods();
  const index = moods.findIndex(m => m.id === id);
  if (index !== -1) {
    moods[index] = { ...moods[index], ...updates };
    await saveCustomMoods(moods);
    return moods[index];
  }
  throw new Error('心情标签不存在');
}

/**
 * 删除自定义心情标签
 */
export async function deleteCustomMood(id) {
  const moods = await getCustomMoods();
  const filtered = moods.filter(m => m.id !== id);
  await saveCustomMoods(filtered);
  return true;
}

// ==================== 数据导出 ====================

/**
 * 导出所有数据为 JSON
 */
export async function exportAllData() {
  const db = await initDB();
  const [babies, moments, capsules, settings, users] = await Promise.all([
    db.getAll('babies'),
    db.getAll('moments'),
    db.getAll('capsules'),
    db.getAll('settings'),
    db.getAll('users'),
  ]);
  
  return {
    exportTime: new Date().toISOString(),
    version: '1.1.0',
    data: { babies, moments, capsules, settings, users },
  };
}

/**
 * 导入数据
 * @param {Object} data - 导出的数据对象
 * @param {boolean} mode - 'merge' 合并或 'replace' 覆盖
 */
export async function importAllData(data, mode = 'merge') {
  const db = await initDB();
  
  if (mode === 'replace') {
    // 覆盖模式：清空所有数据后导入
    const tx = db.transaction(['babies', 'moments', 'capsules', 'settings', 'users'], 'readwrite');
    await tx.objectStore('babies').clear();
    await tx.objectStore('moments').clear();
    await tx.objectStore('capsules').clear();
    await tx.objectStore('settings').clear();
    await tx.objectStore('users').clear();
    await tx.done;
  }
  
  const { data: importedData } = data;
  const { babies, moments, capsules, settings, users } = importedData;
  
  // 导入数据
  if (babies && babies.length > 0) {
    for (const baby of babies) {
      await db.put('babies', baby);
    }
  }
  
  if (moments && moments.length > 0) {
    for (const moment of moments) {
      await db.put('moments', moment);
    }
  }
  
  if (capsules && capsules.length > 0) {
    for (const capsule of capsules) {
      await db.put('capsules', capsule);
    }
  }
  
  if (settings && settings.length > 0) {
    for (const setting of settings) {
      await db.put('settings', setting);
    }
  }
  
  if (users && users.length > 0 && mode === 'replace') {
    // 用户数据只在覆盖模式下导入
    for (const user of users) {
      await db.put('users', user);
    }
  }
  
  return true;
}

// ==================== 用户操作（登录注册） ====================

/**
 * 获取所有用户
 */
export async function getAllUsers() {
  const db = await initDB();
  return db.getAll('users');
}

/**
 * 简单密码加密（Base64编码 + 反转）
 */
export function simpleEncrypt(password) {
  const reversed = password.split('').reverse().join('');
  return btoa(unescape(encodeURIComponent(reversed)));
}

/**
 * 验证密码
 */
export function verifyPassword(inputPassword, storedPassword) {
  return simpleEncrypt(inputPassword) === storedPassword;
}

/**
 * 根据用户名获取用户
 */
export async function getUserByUsername(username) {
  const db = await initDB();
  const users = await db.getAllFromIndex('users', 'username', username);
  return users[0] || null;
}

/**
 * 根据用户ID获取用户
 */
export async function getUserById(id) {
  const db = await initDB();
  return db.get('users', id);
}

/**
 * 检查用户名是否已存在
 */
export async function isUsernameExists(username) {
  const user = await getUserByUsername(username);
  return user !== null;
}

/**
 * 注册新用户
 */
export async function registerUser(username, password, userInfo = {}) {
  // 检查用户名是否已存在
  const exists = await isUsernameExists(username);
  if (exists) {
    throw new Error('用户名已存在');
  }

  const db = await initDB();
  const encryptedPassword = simpleEncrypt(password);
  const user = {
    username,
    password: encryptedPassword,
    nickname: userInfo.nickname || username,
    avatar: userInfo.avatar || null,
    signature: userInfo.signature || '',
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  
  const id = await db.add('users', user);
  return { ...user, id };
}

/**
 * 用户登录
 */
export async function loginUser(username, password) {
  const user = await getUserByUsername(username);
  
  if (!user) {
    throw new Error('用户名不存在');
  }
  
  if (!verifyPassword(password, user.password)) {
    throw new Error('密码错误');
  }
  
  // 更新最后登录时间
  const db = await initDB();
  user.lastLoginAt = new Date().toISOString();
  await db.put('users', user);
  
  return user;
}

/**
 * 更新用户资料
 */
export async function updateUser(id, updates) {
  const db = await initDB();
  const user = await db.get('users', id);
  if (!user) throw new Error('用户不存在');
  const updatedUser = { ...user, ...updates, updatedAt: new Date().toISOString() };
  await db.put('users', updatedUser);
  return updatedUser;
}

// ==================== 初始化示例数据 ====================

/**
 * 检查是否需要初始化示例数据
 */
export async function checkAndInitSampleData() {
  const babies = await getAllBabies();
  if (babies.length === 0) {
    // 创建默认宝宝
    const defaultBaby = await addBaby({
      name: '小豆芽',
      nickname: '豆芽',
      avatar: null,
      birthDate: getDefaultBirthDate(),
      gender: 'girl',
    });

    // 创建示例动态
    const now = new Date();
    
    // 示例动态1：三个月前
    const date1 = new Date(now);
    date1.setMonth(date1.getMonth() - 3);
    
    await addMoment({
      babyId: defaultBaby.id,
      type: 'photo',
      date: date1.toISOString(),
      content: '今天第一次尝试翻身，虽然只翻了一半，但已经超级棒了！',
      photos: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400'],
      mood: 'happy',
      weather: 'sunny',
      milestone: 'first',
      milestoneLabel: '第一次翻身',
    });

    // 示例动态2：一个月前
    const date2 = new Date(now);
    date2.setMonth(date2.getMonth() - 1);
    
    await addMoment({
      babyId: defaultBaby.id,
      type: 'diary',
      date: date2.toISOString(),
      content: '今天学会叫"妈妈"了！虽然还不太清晰，但是听到的那一刻真的太感动了。',
      mood: 'touched',
      weather: 'cloudy',
      milestone: 'growth',
      milestoneLabel: '学会说话',
    });

    // 更新当前宝宝设置
    await updateSettings({ currentBabyId: defaultBaby.id });
    
    return defaultBaby;
  }
  return babies[0];
}

/**
 * 获取默认生日（假设宝宝6个月大）
 */
function getDefaultBirthDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  return date.toISOString();
}

// 预设头像列表
export const PRESET_AVATARS = [
  '👶', '🍼', '🧸', '🐻', '🐰', '🦊', '🐼', '🐨',
  '👼', '🌟', '🎀', '🎈', '🌈', '☀️', '🌙', '💫',
];

/**
 * 生成颜色变体（用于自定义主题）
 * @param {string} hexColor - 十六进制颜色值，如 #FF7B70
 */
export function generateColorVariants(hexColor) {
  // 移除 # 号
  const hex = hexColor.replace('#', '');
  
  // 解析 RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // 生成浅色变体（增加白色混合）
  const lighten = (color, percent) => {
    const num = parseInt(color, 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, num + amt);
    const G = Math.min(255, num + amt);
    const B = Math.min(255, num + amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  };
  
  // 生成深色变体（减少亮度）
  const darken = (color, percent) => {
    const num = parseInt(color, 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, num - amt);
    const G = Math.max(0, num - amt);
    const B = Math.max(0, num - amt);
    return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
  };
  
  return {
    primary: hexColor,
    primaryLight: lighten(hexColor, 30),
    primaryDark: darken(hexColor, 15),
    warm: lighten(hexColor, 50),
    warmLight: lighten(hexColor, 70),
  };
}

/**
 * 应用自定义主题颜色
 * @param {string} hexColor - 十六进制颜色值
 */
export function applyCustomTheme(hexColor) {
  const variants = generateColorVariants(hexColor);
  const root = document.documentElement;
  
  root.setAttribute('data-theme', 'custom');
  root.style.setProperty('--color-primary', variants.primary);
  root.style.setProperty('--color-primary-light', variants.primaryLight);
  root.style.setProperty('--color-primary-dark', variants.primaryDark);
  root.style.setProperty('--color-warm', variants.warm);
  root.style.setProperty('--color-warm-light', variants.warmLight);
}

/**
 * 应用预设主题
 * @param {string} preset - 主题预设名称
 */
export function applyThemePreset(preset) {
  const root = document.documentElement;
  root.setAttribute('data-theme', preset === 'pink' ? '' : preset);
}

// ==================== 访客打卡操作 ====================

/**
 * 添加访客打卡记录
 * @param {Object} visitData - 打卡数据
 * @param {string} visitData.babyId - 宝宝ID
 * @param {string} visitData.visitorName - 访客称呼
 * @param {string} visitData.visitDate - 打卡日期 (YYYY-MM-DD)
 */
export async function addVisit(visitData) {
  const db = await initDB();
  
  // 检查今天是否已打卡（同一宝宝同一称呼同一天只能打卡一次）
  const existingVisits = await db.getAllFromIndex('visits', 'babyId', visitData.babyId);
  const hasCheckedIn = existingVisits.some(
    v => v.visitorName === visitData.visitorName && v.visitDate === visitData.visitDate
  );
  
  if (hasCheckedIn) {
    throw new Error('今天已经打卡过了');
  }
  
  const visit = {
    ...visitData,
    createdAt: new Date().toISOString(),
  };
  
  const id = await db.add('visits', visit);
  return { ...visit, id };
}

/**
 * 获取某个宝宝的所有打卡记录
 * @param {string} babyId - 宝宝ID
 */
export async function getVisitsByBaby(babyId) {
  const db = await initDB();
  const visits = await db.getAllFromIndex('visits', 'babyId', babyId);
  // 按时间倒序排列
  return visits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

/**
 * 获取访客打卡排行榜
 * @param {string} babyId - 宝宝ID
 * @returns {Array} 排行列表 [{visitorName, count}]
 */
export async function getVisitRanking(babyId) {
  const visits = await getVisitsByBaby(babyId);
  
  // 按访客名称分组统计
  const rankingMap = {};
  visits.forEach(visit => {
    if (rankingMap[visit.visitorName]) {
      rankingMap[visit.visitorName]++;
    } else {
      rankingMap[visit.visitorName] = 1;
    }
  });
  
  // 转换为数组并排序
  const ranking = Object.entries(rankingMap)
    .map(([visitorName, count]) => ({ visitorName, count }))
    .sort((a, b) => b.count - a.count);
  
  return ranking;
}

/**
 * 删除访客打卡记录
 * @param {number} id - 记录ID
 */
export async function deleteVisit(id) {
  const db = await initDB();
  await db.delete('visits', id);
  return true;
}

/**
 * 生成邀请打卡Token
 * @param {string} babyId - 宝宝ID
 * @returns {string} 邀请Token
 */
export function generateInviteToken(babyId) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${babyId}_${timestamp}_${random}`;
}

/**
 * 验证邀请Token
 * @param {string} babyId - 宝宝ID
 * @param {string} token - 邀请Token
 * @returns {boolean} 是否有效
 */
export function verifyInviteToken(babyId, token) {
  if (!token) return false;
  
  // 检查token格式和有效期（7天）
  const parts = token.split('_');
  if (parts.length < 3) return false;
  
  const tokenBabyId = parts[0];
  const tokenTimestamp = parseInt(parts[1], 10);
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  return tokenBabyId === babyId && (now - tokenTimestamp) < sevenDays;
}

/**
 * 获取今日打卡数量
 * @param {string} babyId - 宝宝ID
 */
export async function getTodayVisitCount(babyId) {
  const visits = await getVisitsByBaby(babyId);
  const today = new Date().toISOString().split('T')[0];
  return visits.filter(v => v.visitDate === today).length;
}

// ==================== 回收站功能 ====================

/**
 * 软删除动态（标记为已删除）
 * @param {number} momentId - 动态ID
 */
export async function softDeleteMoment(momentId) {
  const db = await initDB();
  const moment = await db.get('moments', momentId);
  if (!moment) throw new Error('动态不存在');
  
  const updatedMoment = { 
    ...moment, 
    isDeleted: true, 
    deletedAt: new Date().toISOString() 
  };
  await db.put('moments', updatedMoment);
  return updatedMoment;
}

/**
 * 恢复已删除的动态
 * @param {number} momentId - 动态ID
 */
export async function restoreMoment(momentId) {
  const db = await initDB();
  const moment = await db.get('moments', momentId);
  if (!moment) throw new Error('动态不存在');
  
  const updatedMoment = { 
    ...moment, 
    isDeleted: false, 
    deletedAt: null 
  };
  await db.put('moments', updatedMoment);
  return updatedMoment;
}

/**
 * 永久删除动态
 * @param {number} momentId - 动态ID
 */
export async function deleteMomentPermanently(momentId) {
  const db = await initDB();
  await db.delete('moments', momentId);
  return true;
}

/**
 * 获取某个宝宝回收站中的动态
 * @param {string} babyId - 宝宝ID
 */
export async function getDeletedMomentsByBaby(babyId) {
  const db = await initDB();
  const moments = await db.getAllFromIndex('moments', 'babyId', babyId);
  return moments
    .filter(m => m.isDeleted === true)
    .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));
}

/**
 * 清空回收站
 * @param {string} babyId - 宝宝ID
 */
export async function emptyRecycleBin(babyId) {
  const db = await initDB();
  const deletedMoments = await getDeletedMomentsByBaby(babyId);
  
  const tx = db.transaction('moments', 'readwrite');
  for (const moment of deletedMoments) {
    await tx.store.delete(moment.id);
  }
  await tx.done;
  return true;
}

/**
 * 自动清理30天前删除的记录
 * @param {string} babyId - 宝宝ID
 */
export async function cleanExpiredDeleted(babyId) {
  const db = await initDB();
  const deletedMoments = await getDeletedMomentsByBaby(babyId);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const expiredMoments = deletedMoments.filter(
    m => new Date(m.deletedAt) < thirtyDaysAgo
  );
  
  const tx = db.transaction('moments', 'readwrite');
  for (const moment of expiredMoments) {
    await tx.store.delete(moment.id);
  }
  await tx.done;
  return expiredMoments.length;
}

// ==================== 月度报告统计 ====================

/**
 * 获取某月的统计数据
 * @param {string} babyId - 宝宝ID
 * @param {number} year - 年份
 * @param {number} month - 月份（1-12）
 */
export async function getMonthlyStats(babyId, year, month) {
  const db = await initDB();
  const moments = await db.getAllFromIndex('moments', 'babyId', babyId);
  
  // 筛选当月记录
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const monthlyMoments = moments.filter(m => {
    const momentDate = new Date(m.date);
    return momentDate >= startDate && momentDate <= endDate;
  });
  
  // 统计各类型数量
  const photoMoments = monthlyMoments.filter(m => m.type === 'photo');
  const videoMoments = monthlyMoments.filter(m => m.type === 'video');
  const diaryMoments = monthlyMoments.filter(m => m.type === 'diary');
  const audioMoments = monthlyMoments.filter(m => m.type === 'audio');
  
  // 照片总数
  const photoCount = photoMoments.reduce((acc, m) => acc + (m.photos?.length || 0), 0);
  
  // 视频总数
  const videoCount = videoMoments.reduce((acc, m) => acc + (m.videos?.length || 0), 0);
  
  // 获取里程碑事件
  const milestones = monthlyMoments
    .filter(m => m.milestone)
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // 获取心情分布
  const moodStats = {};
  monthlyMoments.forEach(m => {
    if (m.mood) {
      moodStats[m.mood] = (moodStats[m.mood] || 0) + 1;
    }
  });
  
  return {
    year,
    month,
    totalMoments: monthlyMoments.length,
    photoCount,
    videoCount,
    diaryCount: diaryMoments.length,
    audioCount: audioMoments.length,
    milestones,
    moodStats,
  };
}

// ==================== 忘记密码功能（安全问题） ====================

/**
 * 更新用户安全问题
 * @param {number} userId - 用户ID
 * @param {string} question - 安全问题
 * @param {string} answer - 答案
 */
export async function updateSecurityQuestion(userId, question, answer) {
  const db = await initDB();
  const user = await db.get('users', userId);
  if (!user) throw new Error('用户不存在');
  
  const updatedUser = { 
    ...user, 
    securityQuestion: question,
    securityAnswer: answer,
    updatedAt: new Date().toISOString()
  };
  await db.put('users', updatedUser);
  return updatedUser;
}

/**
 * 验证安全问题答案
 * @param {string} username - 用户名
 * @param {string} answer - 答案
 */
export async function verifySecurityAnswer(username, answer) {
  const user = await getUserByUsername(username);
  if (!user) throw new Error('用户不存在');
  if (!user.securityQuestion || !user.securityAnswer) {
    throw new Error('该用户未设置安全问题');
  }
  if (user.securityAnswer.toLowerCase() !== answer.toLowerCase()) {
    throw new Error('答案错误');
  }
  return user;
}

/**
 * 解密密码（用于忘记密码显示）
 * @param {string} encryptedPassword - 加密后的密码
 */
export function decryptPassword(encryptedPassword) {
  try {
    const decoded = atob(encryptedPassword);
    return decoded.split('').reverse().join('');
  } catch (error) {
    throw new Error('密码解析失败');
  }
}

// ==================== 游客登录功能 ====================

/**
 * 创建游客账号
 * @returns {Object} 游客用户信息
 */
export async function createGuestAccount() {
  const db = await initDB();
  const guestId = `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const randomPassword = Math.random().toString(36).substring(2, 10);
  
  const guestUser = {
    username: guestId,
    password: simpleEncrypt(randomPassword),
    nickname: '小游客',
    avatar: '👶',
    isGuest: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  
  const id = await db.add('users', guestUser);
  return { ...guestUser, id, rawPassword: randomPassword };
}

/**
 * 创建示例宝宝档案
 * @param {number} userId - 用户ID
 * @returns {Object} 示例宝宝信息
 */
export async function createSampleBaby(userId) {
  const defaultBaby = await addBaby({
    name: '小豆芽',
    nickname: '豆芽',
    avatar: null,
    birthDate: getDefaultBirthDate(),
    gender: 'girl',
    userId: userId,
  });

  // 创建示例动态
  const now = new Date();
  
  // 示例动态1：三个月前
  const date1 = new Date(now);
  date1.setMonth(date1.getMonth() - 3);
  
  await addMoment({
    babyId: defaultBaby.id,
    type: 'photo',
    date: date1.toISOString(),
    content: '今天第一次尝试翻身，虽然只翻了一半，但已经超级棒了！',
    photos: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400'],
    mood: 'happy',
    weather: 'sunny',
    milestone: 'first',
    milestoneLabel: '第一次翻身',
  });

  // 示例动态2：一个月前
  const date2 = new Date(now);
  date2.setMonth(date2.getMonth() - 1);
  
  await addMoment({
    babyId: defaultBaby.id,
    type: 'diary',
    date: date2.toISOString(),
    content: '今天学会叫"妈妈"了！虽然还不太清晰，但是听到的那一刻真的太感动了。',
    mood: 'touched',
    weather: 'cloudy',
    milestone: 'growth',
    milestoneLabel: '学会说话',
  });

  // 更新当前宝宝设置
  await updateSettings({ currentBabyId: defaultBaby.id });
  
  return defaultBaby;
}
