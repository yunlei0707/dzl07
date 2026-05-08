// 一门APP在线网关代理 - Vercel Serverless Function
// 使用Node.js原生http模块，完全模拟Nginx反向代理行为
// 避免Fetch API对Set-Cookie等头的限制

import http from 'http';

function proxyRequest(targetUrl, method, reqHeaders, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(targetUrl);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: reqHeaders,
    };
    
    const proxyReq = http.request(options, (proxyRes) => {
      const chunks = [];
      proxyRes.on('data', chunk => chunks.push(chunk));
      proxyRes.on('end', () => {
        resolve({
          statusCode: proxyRes.statusCode,
          headers: proxyRes.headers,  // 原始headers，包含Set-Cookie
          body: Buffer.concat(chunks),
        });
      });
    });
    
    proxyReq.on('error', reject);
    proxyReq.setTimeout(10000, () => {
      proxyReq.destroy();
      reject(new Error('请求超时'));
    });
    if (body) proxyReq.write(body);
    proxyReq.end();
  });
}

export default async function handler(req, res) {
  // 处理OPTIONS预检请求
  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Max-Age', '86400');
    res.end();
    return;
  }

  // 获取用户ID和密钥
  const userId = process.env.YM_USER_ID || '495126';
  const userSecret = process.env.YM_USER_SECRET || 'TNvPWnZHeSQFdyyRzcNV2QzAfj2lwgLkwUbR3eKqPK9JkRu5';
  const xYmUser = `u${userId}.${userSecret}`;

  // 构建目标URL
  const targetUrl = `http://gate.open.yimenyun.com${req.url}`;

  // 构建转发请求头 - 模拟Nginx proxy_set_header
  const headers = {
    'X-Ym-User': xYmUser,
  };
  
  // 复制客户端请求头（排除不需要的）
  const excludeHeaders = ['host', 'content-length', 'connection', 'transfer-encoding'];
  Object.entries(req.headers || {}).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!excludeHeaders.includes(lowerKey)) {
      headers[key] = value;
    }
  });

  try {
    // 获取请求体
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // 使用http模块发起请求（不走Fetch API，避免头限制）
    const result = await proxyRequest(targetUrl, req.method || 'GET', headers, body);

    // 原样返回状态码（包括3xx重定向）
    res.statusCode = result.statusCode;

    // 原样转发所有响应头（http模块返回原始headers，无Fetch API限制）
    Object.entries(result.headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (!['transfer-encoding', 'connection'].includes(lowerKey)) {
        // Set-Cookie可能是数组，需要特殊处理
        if (lowerKey === 'set-cookie' && Array.isArray(value)) {
          res.setHeader(key, value);
        } else {
          res.setHeader(key, value);
        }
      }
    });

    // 原样返回响应内容
    res.end(result.body);

  } catch (error) {
    console.error('网关代理错误:', error);
    res.statusCode = 502;
    res.end(JSON.stringify({ 
      code: 502, 
      message: '网关代理请求失败',
      error: error.message 
    }));
  }
}
