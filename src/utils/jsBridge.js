/**
 * 一门APP jsBridge 文件系统封装
 * 基于官方SDK，提供Promise化的文件系统API
 * 所有调用都有降级处理，非APP环境静默跳过
 */

import { format } from 'date-fns';

// 检测是否在APP环境中
export const isInApp = () => {
  return typeof window !== 'undefined' && 
         typeof window.jsBridge !== 'undefined' && 
         window.jsBridge.inApp === true;
};

// 确保jsBridge已就绪
const ensureReady = () => {
  return new Promise((resolve) => {
    if (!window.jsBridge) {
      resolve(false);
      return;
    }
    if (window.jsBridge.isReady && window.jsBridge.isReady()) {
      resolve(true);
      return;
    }
    // 使用官方ready方法等待初始化
    window.jsBridge.ready(() => {
      resolve(true);
    });
    // 超时3秒后也放行
    setTimeout(() => resolve(!!window.jsBridge), 3000);
  });
};

/**
 * 通用Promise封装
 * 官方SDK的fs回调格式：成功时直接返回数据（字符串/布尔值/数字），失败时可能返回错误信息
 * 不假设{code, data}格式，直接透传回调结果
 */
const promisify = (fnName, ...args) => {
  return new Promise(async (resolve, reject) => {
    if (!isInApp()) {
      reject(new Error('Not in APP environment'));
      return;
    }

    try {
      const jsb = window.jsBridge;
      if (!jsb || !jsb.fs) {
        reject(new Error('jsBridge.fs not available'));
        return;
      }

      const method = jsb.fs[fnName];
      if (typeof method !== 'function') {
        reject(new Error(`jsBridge.fs.${fnName} is not a function`));
        return;
      }

      method.call(jsb.fs, ...args, (result) => {
        // 官方SDK回调直接返回结果
        // 对于readText返回文本内容，exist返回布尔值，mkdir等返回成功标志
        resolve(result);
      });
    } catch (e) {
      reject(e);
    }
  });
};

// 文件系统API封装
export const jsBridgeFS = {
  // 创建目录
  mkdir: (path) => promisify('mkdir', path),

  // 判断文件/目录是否存在
  exist: (path) => promisify('exist', path),

  // 列出目录内容
  list: (path) => promisify('list', path),

  // 获取文件大小
  size: (path) => promisify('size', path),

  // 删除文件/目录
  delete: (path) => promisify('delete', path),

  // 写入文本文件
  writeText: (path, text) => promisify('writeText', path, text),

  // 追加文本
  appendText: (path, text) => promisify('appendText', path, text),

  // 读取文本文件
  readText: (path) => promisify('readText', path),

  // 写入二进制文件 (base64)
  writeBinary: (path, base64) => promisify('writeBinary', path, base64),

  // 追加二进制
  appendBinary: (path, base64) => promisify('appendBinary', path, base64),

  // 读取二进制文件 (返回base64)
  readBinary: (path) => promisify('readBinary', path),

  // 复制文件
  copy: (srcPath, dstPath) => promisify('copy', srcPath, dstPath),

  // 文件路径转URI
  toUri: (path) => promisify('toUri', path),

  // 转绝对路径
  toAbsolute: (path) => promisify('toAbsolute', path),

  // 分享文件（调系统分享面板）
  share: (path) => promisify('share', path),

  // 用系统应用打开文件
  open: (path) => promisify('open', path),

  // 下载文件到指定路径
  download: (url, path) => promisify('download', { url, path }),

  // 解压文件
  unzip: (srcPath, dstDir) => promisify('unzip', { src: srcPath, dst: dstDir }),

  // 计算MD5
  md5: (path) => promisify('md5', path),

  // 计算SHA1
  sha1: (path) => promisify('sha1', path),

  // 计算SHA256
  sha256: (path) => promisify('sha256', path),
};

// ==================== 高级封装 ====================

// 导出目录基础路径
const EXPORT_BASE_PATH = 'fs://file/BabyTime';
const EXPORT_DIR = `${EXPORT_BASE_PATH}/export`;

/**
 * 导出数据到本地文件并分享
 * @param {string} jsonData - 要导出的JSON数据
 * @param {string} fileName - 文件名（不含路径）
 * @returns {Promise<boolean>} - 是否成功
 */
export const exportToFile = async (jsonData, fileName = null) => {
  if (!isInApp()) {
    return false;
  }

  try {
    // 生成文件名（带日期）
    const dateStr = format(new Date(), 'yyyyMMdd_HHmmss');
    const name = fileName || `backup_${dateStr}.json`;
    const filePath = `${EXPORT_DIR}/${name}`;

    // 确保目录存在
    try {
      await jsBridgeFS.mkdir(EXPORT_DIR);
    } catch (e) {
      // 目录可能已存在，静默忽略
    }

    // 写入文件
    await jsBridgeFS.writeText(filePath, jsonData);

    // 分享文件（调系统分享面板）
    await jsBridgeFS.share(filePath);

    return true;
  } catch (error) {
    console.error('[jsBridge] APP导出失败:', error);
    return false;
  }
};

/**
 * 从本地文件读取数据
 * @param {string} filePath - 文件路径
 * @returns {Promise<object|null>} - 解析后的JSON数据，失败返回null
 */
export const importFromFile = async (filePath) => {
  if (!isInApp()) {
    return null;
  }

  try {
    // 确保是fs://路径
    const fullPath = filePath.startsWith('fs://') ? filePath : `fs://file/${filePath}`;

    // 读取文件内容
    const content = await jsBridgeFS.readText(fullPath);

    // 解析JSON
    const data = JSON.parse(content);
    return data;
  } catch (error) {
    console.error('[jsBridge] APP导入失败:', error);
    return null;
  }
};

// 默认导出
export default {
  isInApp,
  ensureReady,
  fs: jsBridgeFS,
  exportToFile,
  importFromFile,
};
