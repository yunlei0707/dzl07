/**
 * v2 双账号系统数据库操作模块
 * 
 * 功能：
 * 1. 新用户首次登录自动初始化双账号结构
 * 2. 账号切换和数据操作
 * 3. 与原有 IndexedDB 数据交互
 */

import {
  getV2Data,
  saveV2Data,
  getV2AccountData,
  updateV2AccountData,
  switchV2Account,
  getCurrentV2Account,
  getCurrentIdentity,
  isMigrated,
  migrateV1ToV2
} from './migration';

// 重新导出，确保可以被其他文件导入
export {
  getCurrentV2Account,
  getCurrentIdentity,
  isMigrated,
  switchV2Account
};

// localStorage 键名
const CURRENT_IDENTITY_KEY = 'currentIdentity';
const CURRENT_ACCOUNT_KEY = 'currentAccountId';

/**
 * 获取当前 v2 账号（内部使用）
 * @returns {Object|null}
 */
export function getCurrentV2AccountInternal() {
  return _getCurrentV2Account();
}

/**
 * 初始化 v2 数据结构（新用户首次登录）
 * @param {string} identityName - 身份名称
 * @returns {Object} 初始化结果
 */
export function initializeV2ForNewUser(identityName) {
  const v2Data = getV2Data() || {};
  
  // 如果该身份已有数据，跳过初始化
  if (v2Data[identityName] && v2Data[identityName].accounts) {
    return {
      success: true,
      isNewUser: false,
      message: '该身份已有数据，跳过初始化'
    };
  }
  
  const now = new Date();
  
  // 创建系统账号（豆芽示例数据）
  const defaultAccount = createSystemAccount();
  
  // 创建用户账号（空白）
  const userAccount = createEmptyUserAccount();
  
  // 构建该身份的 v2 数据
  v2Data[identityName] = {
    accounts: {
      'default': defaultAccount,
      'user': userAccount
    },
    currentAccountId: 'user' // 默认显示用户自己的账号
  };
  
  saveV2Data(v2Data);
  
  // 设置当前身份和账号
  localStorage.setItem(CURRENT_IDENTITY_KEY, identityName);
  localStorage.setItem(CURRENT_ACCOUNT_KEY, 'user');
  
  return {
    success: true,
    isNewUser: true,
    message: '新用户初始化完成',
    data: v2Data[identityName]
  };
}

/**
 * 创建系统账号（豆芽示例数据）
 * @returns {Object}
 */
function createSystemAccount() {
  const now = new Date();
  
  // 豆芽的出生日期（假设比当前日期早1年3个月）
  const beanSproutBirth = new Date(now);
  beanSproutBirth.setFullYear(beanSproutBirth.getFullYear() - 1);
  beanSproutBirth.setMonth(beanSproutBirth.getMonth() - 3);
  
  return {
    id: 'default',
    name: '豆芽',
    nickname: '豆芽',
    avatar: null,
    birthDate: beanSproutBirth.toISOString(),
    gender: 'girl',
    isSystem: true,
    createdAt: now.toISOString(),
    // 5条示例动态
    timeline: [
      {
        id: 'sys-1',
        type: 'photo',
        date: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
        content: '今天第一次尝试翻身，虽然只翻了一半，但已经超级棒了！',
        photos: ['https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400'],
        mood: 'happy',
        weather: 'sunny',
        milestone: 'first',
        milestoneLabel: '第一次翻身',
        createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sys-2',
        type: 'video',
        date: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
        content: '今天学会了爬行，追着球球跑得好开心呀！',
        videos: [{
          url: 'https://www.w3schools.com/html/mov_bbb.mp4',
          cover: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400',
          duration: 10
        }],
        mood: 'excited',
        weather: 'cloudy',
        milestone: 'growth',
        milestoneLabel: '学会爬行',
        createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sys-3',
        type: 'audio',
        date: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        content: '今天第一次叫妈妈，虽然发音还不太标准，但真的好甜~',
        audios: [{
          url: 'https://www.w3schools.com/html/horse.ogg',
          duration: 8
        }],
        mood: 'touched',
        weather: 'sunny',
        milestone: 'growth',
        milestoneLabel: '学会说话',
        createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sys-4',
        type: 'diary',
        date: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        content: '今天带豆芽去公园玩，她对花花草草特别感兴趣，一直在摸小树叶。看见小狗狗就激动得不行，一定要追着跑。希望下周天气好，可以再去一次！',
        mood: 'happy',
        weather: 'windy',
        milestone: 'daily',
        milestoneLabel: '户外活动',
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'sys-5',
        type: 'photo',
        date: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        content: '今天豆芽学会了用勺子自己吃饭，虽然弄得满脸都是，但是特别有成就感！',
        photos: ['https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=400'],
        mood: 'excited',
        weather: 'sunny',
        milestone: 'learning',
        milestoneLabel: '学会自己吃饭',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    // 成长数据
    growth: {
      height: 75,
      weight: 9.5,
      records: []
    },
    // 虚拟时光
    virtualTime: []
  };
}

/**
 * 创建空白用户账号
 * @returns {Object}
 */
function createEmptyUserAccount() {
  const now = new Date();
  
  return {
    id: 'user',
    name: '我的宝宝',
    nickname: '',
    avatar: null,
    birthDate: '',
    gender: 'girl',
    isSystem: false,
    createdAt: now.toISOString(),
    // 空数据
    timeline: [],
    growth: {
      height: null,
      weight: null,
      records: []
    },
    virtualTime: []
  };
}

/**
 * 初始化应用（处理迁移和首次登录）
 * @param {string} identityName - 当前身份名称
 * @returns {Object} 初始化结果
 */
export async function initializeApp(identityName) {
  // 1. 检查并执行 v1 -> v2 迁移（如果有旧数据）
  if (!isMigrated()) {
    const migrateResult = await migrateV1ToV2();
    console.log('迁移结果:', migrateResult);
  }
  
  // 2. 获取当前 v2 数据
  const v2Data = getV2Data();
  
  // 3. 检查该身份是否已有 v2 数据
  if (!v2Data || !v2Data[identityName]) {
    // 新用户，初始化双账号结构
    return initializeV2ForNewUser(identityName);
  }
  
  // 已有数据，设置当前身份
  localStorage.setItem(CURRENT_IDENTITY_KEY, identityName);
  const currentAccountId = v2Data[identityName].currentAccountId || 'user';
  localStorage.setItem(CURRENT_ACCOUNT_KEY, currentAccountId);
  
  return {
    success: true,
    isNewUser: false,
    message: '加载已有数据',
    data: v2Data[identityName]
  };
}

/**
 * 获取当前账号的宝宝信息
 * @returns {Object|null}
 */
export function getCurrentBabyInfo() {
  const current = getCurrentV2Account();
  if (!current || !current.accountData) return null;
  
  const { accountData, accountId } = current;
  
  return {
    id: accountData.id,
    name: accountData.name || '我的宝宝',
    nickname: accountData.nickname || accountData.name || '我的宝宝',
    avatar: accountData.avatar,
    birthDate: accountData.birthDate,
    gender: accountData.gender || 'girl',
    isSystem: accountData.isSystem || false,
    accountId
  };
}

/**
 * 更新当前账号的宝宝信息
 * @param {Object} babyInfo - 宝宝信息
 * @returns {boolean}
 */
export function updateCurrentBabyInfo(babyInfo) {
  const current = getCurrentV2Account();
  if (!current) return false;
  
  const { identityName, accountId } = current;
  
  updateV2AccountData(identityName, accountId, {
    ...babyInfo,
    updatedAt: new Date().toISOString()
  });
  
  return true;
}

/**
 * 获取当前账号的时间线（动态）
 * @returns {Array}
 */
export function getCurrentTimeline() {
  const current = getCurrentV2Account();
  if (!current || !current.accountData) return [];
  
  return current.accountData.timeline || [];
}

/**
 * 添加动态到当前账号
 * @param {Object} moment - 动态数据
 * @returns {Object} 添加后的动态
 */
export function addMomentToCurrentAccount(moment) {
  const current = getCurrentV2Account();
  if (!current) return null;
  
  const { identityName, accountId, accountData } = current;
  
  const newMoment = {
    ...moment,
    id: moment.id || `moment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString()
  };
  
  const timeline = accountData.timeline || [];
  timeline.unshift(newMoment); // 添加到开头
  
  updateV2AccountData(identityName, accountId, {
    timeline
  });
  
  return newMoment;
}

/**
 * 更新动态
 * @param {string} momentId - 动态ID
 * @param {Object} updates - 更新内容
 * @returns {boolean}
 */
export function updateMomentInCurrentAccount(momentId, updates) {
  const current = getCurrentV2Account();
  if (!current) return false;
  
  const { identityName, accountId, accountData } = current;
  
  const timeline = accountData.timeline || [];
  const index = timeline.findIndex(m => m.id === momentId);
  
  if (index === -1) return false;
  
  timeline[index] = { ...timeline[index], ...updates };
  
  updateV2AccountData(identityName, accountId, {
    timeline
  });
  
  return true;
}

/**
 * 删除动态
 * @param {string} momentId - 动态ID
 * @returns {boolean}
 */
export function deleteMomentFromCurrentAccount(momentId) {
  const current = getCurrentV2Account();
  if (!current) return false;
  
  const { identityName, accountId, accountData } = current;
  
  const timeline = accountData.timeline || [];
  const filteredTimeline = timeline.filter(m => m.id !== momentId);
  
  updateV2AccountData(identityName, accountId, {
    timeline: filteredTimeline
  });
  
  return true;
}

/**
 * 获取当前账号的成长数据
 * @returns {Object}
 */
export function getCurrentGrowth() {
  const current = getCurrentV2Account();
  if (!current || !current.accountData) {
    return { height: null, weight: null, records: [] };
  }
  
  return current.accountData.growth || { height: null, weight: null, records: [] };
}

/**
 * 更新成长数据
 * @param {Object} growthData - 成长数据
 * @returns {boolean}
 */
export function updateCurrentGrowth(growthData) {
  const current = getCurrentV2Account();
  if (!current) return false;
  
  const { identityName, accountId, accountData } = current;
  
  updateV2AccountData(identityName, accountId, {
    growth: {
      ...accountData.growth,
      ...growthData,
      updatedAt: new Date().toISOString()
    }
  });
  
  return true;
}

/**
 * 获取当前账号的虚拟时光
 * @returns {Array}
 */
export function getCurrentVirtualTime() {
  const current = getCurrentV2Account();
  if (!current || !current.accountData) {
    return [];
  }
  
  return current.accountData.virtualTime || [];
}

/**
 * 添加虚拟时光到当前账号
 * @param {Object} virtualTimeData - 虚拟时光数据
 * @returns {Object|null} 添加后的虚拟时光
 */
export function addVirtualTimeToCurrentAccount(virtualTimeData) {
  const current = getCurrentV2Account();
  if (!current) return null;
  
  const { identityName, accountId, accountData } = current;
  
  const newItem = {
    ...virtualTimeData,
    id: `vt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  const virtualTime = accountData.virtualTime || [];
  virtualTime.unshift(newItem); // 添加到开头
  
  updateV2AccountData(identityName, accountId, {
    virtualTime
  });
  
  return newItem;
}

/**
 * 更新虚拟时光
 * @param {string} itemId - 虚拟时光ID
 * @param {Object} updates - 更新内容
 * @returns {boolean}
 */
export function updateVirtualTimeInCurrentAccount(itemId, updates) {
  const current = getCurrentV2Account();
  if (!current) return false;
  
  const { identityName, accountId, accountData } = current;
  
  const virtualTime = accountData.virtualTime || [];
  const index = virtualTime.findIndex(item => item.id === itemId);
  
  if (index === -1) return false;
  
  virtualTime[index] = { ...virtualTime[index], ...updates };
  
  updateV2AccountData(identityName, accountId, {
    virtualTime
  });
  
  return true;
}

/**
 * 从当前账号删除虚拟时光
 * @param {string} itemId - 虚拟时光ID
 * @returns {boolean}
 */
export function deleteVirtualTimeFromCurrentAccount(itemId) {
  const current = getCurrentV2Account();
  if (!current) return false;
  
  const { identityName, accountId, accountData } = current;
  
  const virtualTime = accountData.virtualTime || [];
  const filteredVirtualTime = virtualTime.filter(item => item.id !== itemId);
  
  updateV2AccountData(identityName, accountId, {
    virtualTime: filteredVirtualTime
  });
  
  return true;
}

/**
 * 切换账号
 * @param {string} targetAccountId - 目标账号ID (default/user)
 * @returns {boolean}
 */
export function switchAccount(targetAccountId) {
  const identityName = getCurrentIdentity();
  if (!identityName) return false;
  
  return switchV2Account(identityName, targetAccountId);
}

/**
 * 获取可用账号列表
 * @returns {Array} [{ id, name, isSystem }]
 */
export function getAvailableAccounts() {
  const v2Data = getV2Data();
  const identityName = getCurrentIdentity();
  
  if (!v2Data || !v2Data[identityName]) return [];
  
  const identityData = v2Data[identityName];
  const accounts = identityData.accounts || {};
  const currentAccountId = identityData.currentAccountId;
  
  return Object.keys(accounts).map(accountId => ({
    id: accountId,
    name: accounts[accountId].name || (accountId === 'default' ? '豆芽' : '我的宝宝'),
    nickname: accounts[accountId].nickname || accounts[accountId].name,
    isSystem: accounts[accountId].isSystem || false,
    isCurrent: accountId === currentAccountId
  }));
}

/**
 * 检查是否为系统账号
 * @returns {boolean}
 */
export function isSystemAccount() {
  const current = getCurrentV2Account();
  return current?.accountData?.isSystem === true;
}

/**
 * 获取系统账号信息
 * @returns {Object|null}
 */
export function getSystemAccountInfo() {
  const v2Data = getV2Data();
  const identityName = getCurrentIdentity();
  
  if (!v2Data || !v2Data[identityName]) return null;
  
  const defaultAccount = v2Data[identityName].accounts?.default;
  if (!defaultAccount) return null;
  
  return {
    id: defaultAccount.id,
    name: defaultAccount.name,
    nickname: defaultAccount.nickname,
    avatar: defaultAccount.avatar,
    birthDate: defaultAccount.birthDate,
    gender: defaultAccount.gender,
    timelineCount: defaultAccount.timeline?.length || 0
  };
}

/**
 * 获取用户账号信息
 * @returns {Object|null}
 */
export function getUserAccountInfo() {
  const v2Data = getV2Data();
  const identityName = getCurrentIdentity();
  
  if (!v2Data || !v2Data[identityName]) return null;
  
  const userAccount = v2Data[identityName].accounts?.user;
  if (!userAccount) return null;
  
  return {
    id: userAccount.id,
    name: userAccount.name,
    nickname: userAccount.nickname,
    avatar: userAccount.avatar,
    birthDate: userAccount.birthDate,
    gender: userAccount.gender,
    timelineCount: userAccount.timeline?.length || 0,
    hasData: (userAccount.timeline?.length || 0) > 0
  };
}
