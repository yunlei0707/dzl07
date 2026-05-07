/**
 * 一门APP jsBridge 文件系统封装
 * 提供Promise化的文件系统API，所有调用都有降级处理
 */

import { format } from 'date-fns';

// 检测是否在APP环境中
export const isInApp = () => {
  return typeof window !== 'undefined' && typeof window.jsBridge !== 'undefined';
};

// 获取jsBridge实例（内部使用）
const getJsBridge = () => {
  if (!isInApp()) {
    return null;
  }
  return window.jsBridge;
};

// 回调转Promise
const callbackToPromise = (fn) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      const jsb = getJsBridge();
      if (!jsb) {
        reject(new Error('Not in APP environment'));
        return;
      }
      
      const callback = (result) => {
        if (result && result.code === 0) {
          resolve(result.data);
        } else {
          reject(new Error(result?.message || 'Unknown error'));
        }
      };
      
      fn(...args, callback);
    });
  };
};

// 回调转Promise（不关心返回值）
const callbackToPromiseVoid = (fn) => {
  return (...args) => {
    return new Promise((resolve, reject) => {
      const jsb = getJsBridge();
      if (!jsb) {
        reject(new Error('Not in APP environment'));
        return;
      }
      
      const callback = (result) => {
        if (result && result.code === 0) {
          resolve(true);
        } else {
          reject(new Error(result?.message || 'Unknown error'));
        }
      };
      
      fn(...args, callback);
    });
  };
};

// 文件系统API封装
export const jsBridgeFS = {
  // 创建目录
  mkdir: callbackToPromiseVoid((path, callback) => {
    getJsBridge().fs.mkdir(path, callback);
  }),
  
  // 判断文件/目录是否存在
  exist: callbackToPromise((path) => {
    getJsBridge().fs.exist(path, (result) => {
      // exist 返回的数据可能直接是 boolean
      if (result && typeof result === 'object' && 'code' in result) {
        callback(result);
      } else {
        callback({ code: 0, data: result });
      }
    });
  }),
  
  // 列出目录内容
  list: callbackToPromise((path) => {
    getJsBridge().fs.list(path, callback);
  }),
  
  // 获取文件大小
  size: callbackToPromise((path) => {
    getJsBridge().fs.size(path, callback);
  }),
  
  // 删除文件/目录
  delete: callbackToPromiseVoid((path, callback) => {
    getJsBridge().fs.delete(path, callback);
  }),
  
  // 写入文本文件
  writeText: callbackToPromiseVoid((path, text, callback) => {
    getJsBridge().fs.writeText(path, text, callback);
  }),
  
  // 追加文本
  appendText: callbackToPromiseVoid((path, text, callback) => {
    getJsBridge().fs.appendText(path, text, callback);
  }),
  
  // 读取文本文件
  readText: callbackToPromise((path) => {
    getJsBridge().fs.readText(path, callback);
  }),
  
  // 写入二进制文件 (base64)
  writeBinary: callbackToPromiseVoid((path, base64, callback) => {
    getJsBridge().fs.writeBinary(path, base64, callback);
  }),
  
  // 追加二进制
  appendBinary: callbackToPromiseVoid((path, base64, callback) => {
    getJsBridge().fs.appendBinary(path, base64, callback);
  }),
  
  // 读取二进制文件 (返回base64)
  readBinary: callbackToPromise((path) => {
    getJsBridge().fs.readBinary(path, callback);
  }),
  
  // 复制文件
  copy: callbackToPromiseVoid((srcPath, dstPath, callback) => {
    getJsBridge().fs.copy(srcPath, dstPath, callback);
  }),
  
  // 文件路径转URI
  toUri: callbackToPromise((path) => {
    getJsBridge().fs.toUri(path, callback);
  }),
  
  // 转绝对路径
  toAbsolute: callbackToPromise((path) => {
    getJsBridge().fs.toAbsolute(path, callback);
  }),
  
  // 分享文件
  share: callbackToPromiseVoid((path, callback) => {
    getJsBridge().fs.share(path, callback);
  }),
  
  // 用系统应用打开文件
  open: callbackToPromiseVoid((path, callback) => {
    getJsBridge().fs.open(path, callback);
  }),
  
  // 下载文件到指定路径
  download: callbackToPromiseVoid((url, path, callback) => {
    getJsBridge().fs.download(url, path, callback);
  }),
  
  // 解压文件
  unzip: callbackToPromiseVoid((srcPath, dstDir, callback) => {
    getJsBridge().fs.unzip(srcPath, dstDir, callback);
  }),
  
  // 计算MD5
  md5: callbackToPromise((path) => {
    getJsBridge().fs.md5(path, callback);
  }),
  
  // 计算SHA1
  sha1: callbackToPromise((path) => {
    getJsBridge().fs.sha1(path, callback);
  }),
  
  // 计算SHA256
  sha256: callbackToPromise((path) => {
    getJsBridge().fs.sha256(path, callback);
  }),
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
    // 非APP环境，返回失败，让调用方使用原有逻辑
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
    
    // 分享文件
    await jsBridgeFS.share(filePath);
    
    return true;
  } catch (error) {
    console.error('APP导出失败:', error);
    return false;
  }
};

/**
 * 从本地文件读取数据
 * @param {string} filePath - 文件路径（可以是绝对路径或fs://路径）
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
    console.error('APP导入失败:', error);
    return null;
  }
};

// 默认导出
export default {
  isInApp,
  fs: jsBridgeFS,
  exportToFile,
  importFromFile,
};
