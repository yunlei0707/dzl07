/**
 * 一门APP jsBridge SDK Mini
 * 文件系统模块
 */
(function(window) {
  'use strict';
  
  var jsBridge = window.jsBridge || {};
  
  // 文件系统模块
  jsBridge.fs = {
    // 创建目录
    mkdir: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'mkdir', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 判断文件/目录是否存在
    exist: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'exist', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 列出目录内容
    list: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'list', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 获取文件大小
    size: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'size', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 删除文件/目录
    delete: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'delete', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 写入文本文件
    writeText: function(path, text, callback) {
      if (typeof path !== 'string' || typeof text !== 'string') {
        callback && callback({ code: -1, message: 'Invalid parameters' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'writeText', path: path, text: text, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 追加文本
    appendText: function(path, text, callback) {
      if (typeof path !== 'string' || typeof text !== 'string') {
        callback && callback({ code: -1, message: 'Invalid parameters' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'appendText', path: path, text: text, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 读取文本文件
    readText: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'readText', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 写入二进制文件 (base64)
    writeBinary: function(path, base64, callback) {
      if (typeof path !== 'string' || typeof base64 !== 'string') {
        callback && callback({ code: -1, message: 'Invalid parameters' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'writeBinary', path: path, data: base64, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 追加二进制
    appendBinary: function(path, base64, callback) {
      if (typeof path !== 'string' || typeof base64 !== 'string') {
        callback && callback({ code: -1, message: 'Invalid parameters' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'appendBinary', path: path, data: base64, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 读取二进制文件 (返回base64)
    readBinary: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'readBinary', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 复制文件
    copy: function(srcPath, dstPath, callback) {
      if (typeof srcPath !== 'string' || typeof dstPath !== 'string') {
        callback && callback({ code: -1, message: 'Invalid parameters' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'copy', srcPath: srcPath, dstPath: dstPath, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 文件路径转URI
    toUri: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'toUri', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 转绝对路径
    toAbsolute: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'toAbsolute', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 分享文件
    share: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'share', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 用系统应用打开文件
    open: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'open', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 下载文件到指定路径
    download: function(url, path, callback) {
      if (typeof url !== 'string' || typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid parameters' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'download', url: url, path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 解压文件
    unzip: function(srcPath, dstDir, callback) {
      if (typeof srcPath !== 'string' || typeof dstDir !== 'string') {
        callback && callback({ code: -1, message: 'Invalid parameters' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'unzip', srcPath: srcPath, dstDir: dstDir, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 计算MD5
    md5: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'md5', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 计算SHA1
    sha1: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'sha1', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    },
    
    // 计算SHA256
    sha256: function(path, callback) {
      if (typeof path !== 'string') {
        callback && callback({ code: -1, message: 'Invalid path' });
        return;
      }
      var handler = function(result) {
        callback && callback(result);
      };
      window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.jsBridgeFS &&
        window.webkit.messageHandlers.jsBridgeFS.postMessage(JSON.stringify({ action: 'sha256', path: path, callback: 'jsBridgeFSCallback' }));
      window.jsBridgeFSCallback = handler;
    }
  };
  
  window.jsBridge = jsBridge;
  
})(window);
