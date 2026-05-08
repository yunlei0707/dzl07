// 一门APP在线网关代理 - Vercel Serverless Function
// 完全模拟Nginx反向代理行为：proxy_pass + proxy_set_header X-Ym-User

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

  // 构建目标URL - 完全模拟Nginx proxy_pass行为
  const targetUrl = `http://gate.open.yimenyun.com${req.url}`;

  // 构建转发请求头 - 模拟 proxy_set_header
  const headers = {};
  headers['X-Ym-User'] = xYmUser;
  
  // 复制客户端请求头（排除不需要的）
  const excludeHeaders = ['host', 'content-length', 'connection', 'transfer-encoding'];
  Object.entries(req.headers || {}).forEach(([key, value]) => {
    const lowerKey = key.toLowerCase();
    if (!excludeHeaders.includes(lowerKey)) {
      headers[key] = value;
    }
  });

  try {
    const fetchOptions = {
      method: req.method || 'GET',
      headers: headers,
      redirect: 'manual',  // 不自动跟随重定向，原样返回给APP
    };

    // 如果有请求体，则添加
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // 发起请求到目标网关
    const response = await fetch(targetUrl, fetchOptions);

    // 原样返回状态码（包括3xx重定向）
    res.statusCode = response.status;

    // 原样转发所有响应头
    // 注意：Set-Cookie 是Fetch API的"禁止响应头"，forEach遍历不到
    // 需要用 getSetCookie() 单独获取
    const rawHeaders = response.headers;
    rawHeaders.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['transfer-encoding', 'connection'].includes(lowerKey)) {
        res.setHeader(key, value);
      }
    });

    // 单独处理 Set-Cookie（Fetch API forEach会跳过此头）
    const cookies = rawHeaders.getSetCookie?.() || [];
    if (cookies.length > 0) {
      res.setHeader('Set-Cookie', cookies);
    }

    // 返回响应内容
    const buffer = await response.arrayBuffer();
    res.end(Buffer.from(buffer));

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
