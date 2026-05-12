/**
 * 照片文件系统封装
 * 使用jsBridge.fs将照片存储到APP文件系统
 * 同时提供兼容旧数据的读取功能
 */

import { isInApp, jsBridgeFS } from './jsBridge';

// 照片存储目录
const PHOTOS_DIR = 'fs://file/BabyTimePhotos';

/**
 * 生成唯一文件名
 * @returns {string} UUID文件名
 */
const generateFileName = () => {
  const uuid = crypto.randomUUID();
  return `${uuid}.jpg`;
};

/**
 * 确保照片目录存在
 */
const ensurePhotosDir = async () => {
  if (!isInApp()) return false;
  
  try {
    const exists = await jsBridgeFS.exist(PHOTOS_DIR);
    if (!exists) {
      await jsBridgeFS.mkdir(PHOTOS_DIR);
    }
    return true;
  } catch (e) {
    console.error('[photoFS] 创建目录失败:', e);
    return false;
  }
};

/**
 * 保存照片到文件系统
 * @param {string} base64 - 照片的Base64数据
 * @returns {Promise<object|null>} - 返回文件信息对象，失败返回null
 */
export const savePhotoToFS = async (base64) => {
  if (!isInApp()) {
    console.log('[photoFS] 非APP环境，直接使用Base64');
    return null;
  }

  try {
    // 确保目录存在
    const dirOk = await ensurePhotosDir();
    if (!dirOk) {
      console.warn('[photoFS] 目录创建失败，使用Base64');
      return null;
    }

    // 生成文件名
    const fileName = generateFileName();
    const filePath = `${PHOTOS_DIR}/${fileName}`;

    // 写入文件（需要去掉data:image/jpeg;base64,前缀）
    const base64Data = base64.split(',')[1] || base64;
    await jsBridgeFS.writeBinary(filePath, base64Data);

    // 返回文件信息
    return {
      filename: fileName,
      path: filePath,
      storedInFS: true,
      size: base64Data.length,
      uploadedAt: new Date().toISOString()
    };
  } catch (e) {
    console.error('[photoFS] 保存照片失败:', e);
    return null;
  }
};

/**
 * 从文件系统读取照片
 * @param {string} filename - 文件名或文件路径
 * @returns {Promise<string|null>} - 返回Base64格式的照片数据，失败返回null
 */
export const readPhotoFromFS = async (filename) => {
  if (!isInApp()) {
    console.warn('[photoFS] 非APP环境，无法读取FS文件');
    return null;
  }

  try {
    const filePath = filename.startsWith('fs://') 
      ? filename 
      : `${PHOTOS_DIR}/${filename}`;
    
    const base64Data = await jsBridgeFS.readBinary(filePath);
    
    // 检查返回的数据格式
    if (!base64Data) {
      console.warn('[photoFS] 读取到空数据');
      return null;
    }

    // 如果已经带了data:image前缀，直接返回
    if (base64Data.startsWith('data:image')) {
      return base64Data;
    }

    // 否则加上前缀
    return `data:image/jpeg;base64,${base64Data}`;
  } catch (e) {
    console.error('[photoFS] 读取照片失败:', e);
    return null;
  }
};

/**
 * 删除照片文件
 * @param {string} filename - 文件名或文件路径
 * @returns {Promise<boolean>} - 是否删除成功
 */
export const deletePhotoFromFS = async (filename) => {
  if (!isInApp()) return false;

  try {
    const filePath = filename.startsWith('fs://')
      ? filename
      : `${PHOTOS_DIR}/${filename}`;
    
    await jsBridgeFS.delete(filePath);
    return true;
  } catch (e) {
    console.error('[photoFS] 删除照片失败:', e);
    return false;
  }
};

/**
 * 检查照片是否存储在文件系统中
 * @param {any} photo - 照片数据（字符串或对象）
 * @returns {boolean}
 */
export const isPhotoStoredInFS = (photo) => {
  if (typeof photo === 'object' && photo !== null) {
    return photo.storedInFS === true || !!photo.filename;
  }
  return false;
};

/**
 * 获取照片的显示源（兼容新旧格式）
 * @param {any} photo - 照片数据
 * @returns {string} - 用于img src的字符串
 */
export const getPhotoSrc = (photo) => {
  // 旧格式：直接是Base64字符串
  if (typeof photo === 'string') {
    return photo;
  }
  
  // 新格式：对象，包含filename或path
  if (typeof photo === 'object' && photo !== null) {
    // 如果有url或src字段，直接使用
    if (photo.url) return photo.url;
    if (photo.src) return photo.src;
    // 暂时返回文件名，实际读取需要异步
    return photo.filename || photo.path || '';
  }
  
  return '';
};
