/**
 * ZIP流式导出工具
 * 支持并发控制，防止内存暴涨
 */

import { STORAGE_CONFIG } from '../config/storage';
import { readVideoFromOPFS } from './opfs';

/**
 * 简单的并发控制函数
 * @param {Array} items 待处理项
 * @param {Function} processor 处理函数
 * @param {number} concurrency 并发数
 * @param {Function} onProgress 进度回调
 */
async function withConcurrency(items, processor, concurrency, onProgress) {
  const results = [];
  let completed = 0;
  const total = items.length;

  async function worker() {
    while (items.length > 0) {
      const item = items.shift();
      try {
        const result = await processor(item);
        results.push(result);
      } catch (e) {
        console.error('[ZIP] 处理项失败:', e);
      }
      completed++;
      if (onProgress) {
        onProgress(Math.floor((completed / total) * 100));
      }
    }
  }

  // 启动指定数量的worker
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}

/**
 * 将数据导出为ZIP
 * 注意：此函数为简化版，实际使用需要引入JSZip库
 * @param {Object} data 导出数据
 * @param {Function} onProgress 进度回调(0-100)
 * @returns {Promise<Blob>}
 */
export async function exportToZip(data, onProgress) {
  // 检查JSZip是否可用
  if (typeof window.JSZip === 'undefined') {
    throw new Error('请先引入JSZip库才能导出ZIP文件');
  }

  const zip = new window.JSZip();

  // 1. 写入数据JSON
  zip.file('data.json', JSON.stringify(data, null, 2));

  // 2. 收集所有需要导出的视频文件
  const videoFiles = [];
  const videosFolder = zip.folder('videos');

  for (const moment of data.moments || []) {
    if (moment.videos && Array.isArray(moment.videos)) {
      for (const video of moment.videos) {
        if (video.filename) {
          videoFiles.push(video.filename);
        }
      }
    }
  }

  // 3. 并发读取视频文件并写入ZIP
  if (videoFiles.length > 0) {
    await withConcurrency(
      videoFiles,
      async (filename) => {
        try {
          const file = await readVideoFromOPFS(filename);
          videosFolder.file(filename, file);
        } catch (e) {
          console.warn(`[ZIP] 视频文件 ${filename} 读取失败，跳过`);
        }
      },
      STORAGE_CONFIG.MAX_CONCURRENT_READ,
      (progress) => {
        // 视频处理占80%的进度
        if (onProgress) {
          onProgress(Math.floor(progress * 0.8));
        }
      }
    );
  }

  // 4. 生成ZIP文件（这部分占20%进度）
  if (onProgress) {
    onProgress(90);
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  }, (metadata) => {
    if (onProgress) {
      onProgress(80 + Math.floor(metadata.percent * 0.2));
    }
  });

  if (onProgress) {
    onProgress(100);
  }

  return zipBlob;
}

/**
 * 从ZIP文件导入数据
 * @param {File} zipFile ZIP文件
 * @param {Function} onProgress 进度回调(0-100)
 * @returns {Promise<Object>}
 */
export async function importFromZip(zipFile, onProgress) {
  if (typeof window.JSZip === 'undefined') {
    throw new Error('请先引入JSZip库才能导入ZIP文件');
  }

  const zip = await window.JSZip.loadAsync(zipFile);

  // 1. 读取数据JSON
  const dataJson = await zip.file('data.json').async('string');
  const data = JSON.parse(dataJson);

  if (onProgress) {
    onProgress(10);
  }

  // 2. 恢复视频文件到OPFS
  const videosFolder = zip.folder('videos');
  if (videosFolder) {
    const videoFiles = Object.keys(videosFolder.files).filter(
      (name) => !videosFolder.files[name].dir
    );

    let processed = 0;
    const total = videoFiles.length;

    for (const filename of videoFiles) {
      try {
        const fileData = await videosFolder.file(filename).async('blob');
        // 这里需要将Blob写入OPFS，暂时跳过，后续完善
        console.log(`[ZIP] 恢复视频文件: ${filename}`);
      } catch (e) {
        console.warn(`[ZIP] 恢复视频文件 ${filename} 失败，跳过`);
      }
      processed++;
      if (onProgress) {
        onProgress(10 + Math.floor((processed / total) * 90));
      }
    }
  }

  if (onProgress) {
    onProgress(100);
  }

  return data;
}

/**
 * 触发浏览器下载
 * @param {Blob} blob 文件内容
 * @param {string} filename 文件名
 */
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default {
  exportToZip,
  importFromZip,
  triggerDownload,
};
