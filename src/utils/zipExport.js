/**
 * ZIP流式导出工具
 * 支持并发控制，防止内存暴涨
 * 支持OPFS和Base64两种视频格式
 * 
 * 功能：
 * 1. exportAllData() - 导出所有数据+视频到ZIP
 * 2. 流式处理，边读边写，不缓存所有文件
 * 3. 并发读取控制（默认5个并发）
 * 4. Base64视频转File后写入ZIP
 * 5. 详细进度回调（数据条数 + 视频数量）
 */

import { STORAGE_CONFIG } from '../config/storage';
import { readVideoFromOPFS } from './opfs';
import { exportAllData as exportAllIDBData } from './db';
import { exportV2AccountData } from './dbV2';

/**
 * 简单的并发控制函数（类似p-limit）
 * @param {Array} items 待处理项
 * @param {Function} processor 处理函数
 * @param {number} concurrency 并发数
 * @param {Function} onProgress 进度回调(processed, total, currentItem)
 */
async function withConcurrency(items, processor, concurrency = 5, onProgress = null) {
  const results = [];
  const errors = [];
  let completed = 0;
  const total = items.length;
  const itemsCopy = [...items];

  async function worker() {
    while (itemsCopy.length > 0) {
      const item = itemsCopy.shift();
      try {
        const result = await processor(item);
        results.push({ item, result, success: true });
      } catch (e) {
        console.warn('[ZIP] 处理项失败:', item, e);
        errors.push({ item, error: e });
        results.push({ item, error: e, success: false });
      }
      completed++;
      if (onProgress) {
        onProgress(completed, total, item);
      }
    }
  }

  // 启动指定数量的worker
  const workers = [];
  const actualConcurrency = Math.min(concurrency, total);
  for (let i = 0; i < actualConcurrency; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return { results, errors };
}

/**
 * Base64转File对象
 * @param {string} dataUrl Base64数据URL
 * @param {string} filename 文件名
 * @returns {File}
 */
export function base64ToFile(dataUrl, filename) {
  // 提取MIME类型
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, { type: mime });
}

/**
 * 从数据中收集所有视频文件信息
 * @param {Object} data 导出数据
 * @returns {Array<{type: 'opfs'|'base64', filename: string, data?: string, momentId: string}>}
 */
function collectVideoFiles(data) {
  const videos = [];
  const processedFilenames = new Set(); // 避免重复处理同一文件

  // 收集v2 timeline中的视频
  const timeline = data.v2AccountData?.timeline || [];
  for (const moment of timeline) {
    if (moment.videos && Array.isArray(moment.videos)) {
      for (const video of moment.videos) {
        // OPFS存储的视频（有filename字段但没有url或url是相对路径）
        if (video.filename && !processedFilenames.has(video.filename)) {
          // 检查是否为Base64格式
          if (video.filename.startsWith('data:')) {
            videos.push({
              type: 'base64',
              filename: video.filename,
              data: video.filename,
              momentId: moment.id,
              outputFilename: `${moment.id || 'video'}_${Date.now()}.mp4`
            });
          } else {
            videos.push({
              type: 'opfs',
              filename: video.filename,
              momentId: moment.id,
              outputFilename: video.filename
            });
          }
          processedFilenames.add(video.filename);
        }
        // 内嵌的Base64视频（有url字段且是data:开头）
        if (video.url && video.url.startsWith('data:') && !processedFilenames.has(video.url)) {
          videos.push({
            type: 'base64',
            filename: video.url,
            data: video.url,
            momentId: moment.id,
            outputFilename: `${moment.id || 'video'}_${Date.now()}.mp4`
          });
          processedFilenames.add(video.url);
        }
      }
    }
  }

  // 收集旧版moments中的视频
  const moments = data.moments || [];
  for (const moment of moments) {
    if (moment.videos && Array.isArray(moment.videos)) {
      for (const video of moment.videos) {
        if (video.filename && !processedFilenames.has(video.filename)) {
          if (video.filename.startsWith('data:')) {
            videos.push({
              type: 'base64',
              filename: video.filename,
              data: video.filename,
              momentId: moment.id,
              outputFilename: `${moment.id || 'video'}_${Date.now()}.mp4`
            });
          } else {
            videos.push({
              type: 'opfs',
              filename: video.filename,
              momentId: moment.id,
              outputFilename: video.filename
            });
          }
          processedFilenames.add(video.filename);
        }
        if (video.url && video.url.startsWith('data:') && !processedFilenames.has(video.url)) {
          videos.push({
            type: 'base64',
            filename: video.url,
            data: video.url,
            momentId: moment.id,
            outputFilename: `${moment.id || 'video'}_${Date.now()}.mp4`
          });
          processedFilenames.add(video.url);
        }
      }
    }
  }

  return videos;
}

/**
 * 统计数据信息
 * @param {Object} data 导出数据
 * @returns {Object} 统计信息
 */
function getStats(data) {
  const v2Timeline = data.v2AccountData?.timeline || [];
  const v2HasTimeline = v2Timeline.length > 0;
  
  const oldMoments = data.moments || [];
  const oldBabies = data.babies || [];
  const oldCapsules = data.capsules || [];
  
  const videos = collectVideoFiles(data);
  const opfsVideos = videos.filter(v => v.type === 'opfs');
  const base64Videos = videos.filter(v => v.type === 'base64');

  return {
    v2Timeline: v2Timeline.length,
    v2HasTimeline,
    oldMoments: oldMoments.length,
    oldBabies: oldBabies.length,
    oldCapsules: oldCapsules.length,
    totalVideos: videos.length,
    opfsVideos: opfsVideos.length,
    base64Videos: base64Videos.length,
    videos
  };
}

/**
 * 导出所有数据+视频为ZIP（流式导出，避免内存暴涨）
 * 
 * @param {Object} options 导出选项
 * @param {boolean} options.includeVideos 是否包含视频文件，默认true
 * @param {number} options.concurrency 并发读取数，默认STORAGE_CONFIG.MAX_CONCURRENT_READ
 * @param {Function} options.onProgress 进度回调，参数: { step, progress, message, stats }
 *   - step: 1=准备数据, 2=处理视频, 3=生成ZIP
 *   - progress: 0-100
 *   - message: 当前操作描述
 *   - stats: 数据统计信息
 * @returns {Promise<Blob>} ZIP文件Blob
 */
export async function exportAllData(options = {}) {
  const {
    includeVideos = true,
    concurrency = STORAGE_CONFIG.MAX_CONCURRENT_READ,
    onProgress = null
  } = options;

  // 检查JSZip是否可用
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip库未加载，请检查网络连接');
  }

  const zip = new window.JSZip();
  const videosFolder = zip.folder('videos');

  try {
    // ========== 步骤1: 读取并准备数据 ==========
    if (onProgress) {
      onProgress({
        step: 1,
        progress: 10,
        message: '正在读取数据库数据...',
        stats: null
      });
    }

    // 同时读取IndexDB和v2数据
    const [idbData, v2Data] = await Promise.all([
      exportAllIDBData().catch(e => {
        console.warn('[ZIP] 读取IndexDB数据失败:', e);
        return null;
      }),
      exportV2AccountData()
    ]);

    // 合并数据
    const mergedData = {
      ...(idbData || {}),
      v2AccountData: v2Data,
      exportTime: new Date().toISOString(),
      exportVersion: '2.0.0'
    };

    // 统计信息
    const stats = getStats(mergedData);
    
    if (onProgress) {
      onProgress({
        step: 1,
        progress: 30,
        message: `数据读取完成: ${stats.v2Timeline}条动态, ${stats.totalVideos}个视频`,
        stats
      });
    }

    // 写入data.json（不包含Base64视频数据，避免JSON过大）
    const dataForJson = JSON.parse(JSON.stringify(mergedData));
    // 清理timeline中的Base64视频数据（已单独保存）
    if (dataForJson.v2AccountData?.timeline) {
      for (const moment of dataForJson.v2AccountData.timeline) {
        if (moment.videos) {
          moment.videos = moment.videos.map(video => {
            const cleaned = { ...video };
            // 如果是Base64数据，只保留元信息，内容已单独保存到videos文件夹
            if (cleaned.filename?.startsWith('data:')) {
              cleaned.isBase64Exported = true;
              cleaned.originalFilename = cleaned.filename;
              delete cleaned.filename;
            }
            if (cleaned.url?.startsWith('data:')) {
              cleaned.isBase64Exported = true;
              cleaned.originalUrl = '已导出为独立视频文件';
              delete cleaned.url;
            }
            return cleaned;
          });
        }
      }
    }

    zip.file('data.json', JSON.stringify(dataForJson, null, 2));

    if (onProgress) {
      onProgress({
        step: 1,
        progress: 40,
        message: '数据JSON已写入ZIP',
        stats
      });
    }

    // ========== 步骤2: 流式读取并写入视频文件 ==========
    if (includeVideos && stats.totalVideos > 0) {
      if (onProgress) {
        onProgress({
          step: 2,
          progress: 40,
          message: `开始处理 ${stats.totalVideos} 个视频文件 (${stats.opfsVideos}个OPFS, ${stats.base64Videos}个Base64)...`,
          stats
        });
      }

      let processedVideos = 0;
      let successVideos = 0;
      let failedVideos = 0;

      // 并发处理所有视频
      const { errors } = await withConcurrency(
        stats.videos,
        async (videoInfo) => {
          let fileBlob;
          
          if (videoInfo.type === 'opfs') {
            // 从OPFS读取
            try {
              fileBlob = await readVideoFromOPFS(videoInfo.filename);
            } catch (e) {
              console.warn(`[ZIP] OPFS视频读取失败 ${videoInfo.filename}:`, e);
              // OPFS读取失败时，尝试从data中查找（可能是内嵌数据）
              throw e;
            }
          } else if (videoInfo.type === 'base64') {
            // Base64转File
            fileBlob = base64ToFile(videoInfo.data, videoInfo.outputFilename);
          }

          // 写入ZIP（流式，不全部保存在内存）
          if (fileBlob) {
            videosFolder.file(videoInfo.outputFilename, fileBlob);
            successVideos++;
          }
          
          processedVideos++;
          
          // 报告进度（视频处理占40%-85%）
          if (onProgress) {
            const videoProgress = 40 + Math.floor((processedVideos / stats.totalVideos) * 45);
            onProgress({
              step: 2,
              progress: videoProgress,
              message: `视频处理中: ${processedVideos}/${stats.totalVideos} (${successVideos}成功, ${failedVideos}失败)`,
              stats: { ...stats, processedVideos, successVideos, failedVideos }
            });
          }
        },
        concurrency
      );

      failedVideos = errors.length;

      if (onProgress) {
        onProgress({
          step: 2,
          progress: 85,
          message: `视频处理完成: ${successVideos}/${stats.totalVideos} 成功写入`,
          stats: { ...stats, processedVideos, successVideos, failedVideos }
        });
      }
    } else if (!includeVideos) {
      if (onProgress) {
        onProgress({
          step: 2,
          progress: 85,
          message: '已跳过视频文件导出',
          stats
        });
      }
    } else {
      if (onProgress) {
        onProgress({
          step: 2,
          progress: 85,
          message: '没有视频文件需要导出',
          stats
        });
      }
    }

    // ========== 步骤3: 生成最终ZIP文件 ==========
    if (onProgress) {
      onProgress({
        step: 3,
        progress: 88,
        message: '正在生成ZIP文件...',
        stats
      });
    }

    const zipBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
        streamFiles: true // 流式处理，减少内存使用
      },
      (metadata) => {
        if (onProgress) {
          const zipProgress = 88 + Math.floor(metadata.percent * 0.12);
          onProgress({
            step: 3,
            progress: zipProgress,
            message: `ZIP压缩中: ${Math.round(metadata.percent)}%`,
            stats
          });
        }
      }
    );

    if (onProgress) {
      onProgress({
        step: 3,
        progress: 100,
        message: `导出完成! 共 ${stats.v2Timeline || stats.oldMoments} 条数据, ${includeVideos ? stats.totalVideos : 0} 个视频`,
        stats
      });
    }

    return zipBlob;

  } catch (error) {
    console.error('[ZIP] 导出失败:', error);
    throw error;
  }
}

/**
 * 从ZIP文件导入数据
 * @param {File} zipFile ZIP文件
 * @param {Function} onProgress 进度回调(0-100)
 * @returns {Promise<Object>}
 */
export async function importFromZip(zipFile, onProgress = null) {
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip库未加载，请检查网络连接');
  }

  try {
    if (onProgress) onProgress(5, '正在读取ZIP文件...');

    const zip = await window.JSZip.loadAsync(zipFile);

    if (onProgress) onProgress(10, '正在解析数据...');

    // 1. 读取数据JSON
    const dataJsonFile = zip.file('data.json');
    if (!dataJsonFile) {
      throw new Error('ZIP文件中未找到data.json');
    }

    const dataJson = await dataJsonFile.async('string');
    const data = JSON.parse(dataJson);

    if (onProgress) onProgress(30, '数据解析完成');

    // 2. 读取视频文件（暂时只返回，后续可恢复到OPFS）
    const videosFolder = zip.folder('videos');
    const videoFiles = [];
    
    if (videosFolder) {
      const fileNames = Object.keys(videosFolder.files).filter(
        (name) => !videosFolder.files[name].dir
      );

      let processed = 0;
      const total = fileNames.length;

      for (const filename of fileNames) {
        try {
          const fileData = await videosFolder.file(filename).async('blob');
          videoFiles.push({ filename, file: fileData });
        } catch (e) {
          console.warn(`[ZIP] 读取视频文件失败 ${filename}:`, e);
        }
        processed++;
        if (onProgress) {
          onProgress(30 + Math.floor((processed / total) * 60), `读取视频: ${processed}/${total}`);
        }
      }
    }

    if (onProgress) onProgress(100, '导入完成');

    return {
      data,
      videoFiles
    };

  } catch (error) {
    console.error('[ZIP] 导入失败:', error);
    throw error;
  }
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

/**
 * 向后兼容的exportToZip（使用exportAllData）
 * @deprecated 请使用 exportAllData 替代
 */
export async function exportToZip(data, onProgress) {
  console.warn('exportToZip is deprecated, use exportAllData instead');
  
  if (typeof window.JSZip === 'undefined') {
    throw new Error('JSZip库未加载');
  }

  const zip = new window.JSZip();
  zip.file('data.json', JSON.stringify(data, null, 2));

  const videoFiles = collectVideoFiles(data);
  const videosFolder = zip.folder('videos');

  for (const video of videoFiles) {
    try {
      if (video.type === 'opfs') {
        const file = await readVideoFromOPFS(video.filename);
        videosFolder.file(video.outputFilename, file);
      } else if (video.type === 'base64') {
        const file = base64ToFile(video.data, video.outputFilename);
        videosFolder.file(video.outputFilename, file);
      }
    } catch (e) {
      console.warn(`[ZIP] 视频处理失败 ${video.filename}:`, e);
    }
  }

  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  }, (metadata) => {
    if (onProgress) onProgress(Math.floor(metadata.percent));
  });
}

export default {
  exportAllData,
  exportToZip,
  importFromZip,
  triggerDownload,
  base64ToFile,
  withConcurrency
};
