// 一门APP在线网关代理 - Vercel Serverless Function
// 用于接收一门APP的版本推送等在线功能请求

export default async function handler(req, res) {
  // 获取用户ID和密钥
  const userId = process.env.YM_USER_ID || '495126';
  const userSecret = process.env.YM_USER_SECRET || 'TNvPWnZHeSQFdyyRzcNV2QzAfj2lwgLkwUbR3eKqPK9JkRu5';
  const xYmUser = `u${userId}.${userSecret}`;

  // 构建目标URL - 注意：网关使用 http 协议和 /ymgate 路径
  const path = req.url.replace(/^\/ymgate/, '') || '/';
  const targetUrl = `http://gate.open.yimenyun.com/ymgate${path === '/' ? '' : path}`;

  // 构建转发请求头
  const headers = {
    'X-Ym-User': xYmUser,
    'Content-Type': req.headers['content-type'] || 'application/json',
  };

  // 复制其他必要的请求头（除了host）
  const excludeHeaders = ['host', 'content-length'];
  Object.keys(req.headers).forEach(key => {
    if (!excludeHeaders.includes(key.toLowerCase()) && !headers[key]) {
      headers[key] = req.headers[key];
    }
  });

  try {
    // 构建fetch请求配置
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // 如果有请求体，则添加
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // 发起请求到目标网关
    const response = await fetch(targetUrl, fetchOptions);

    // 获取响应内容
    const text = await response.text();

    // 设置响应头
    res.statusCode = response.status;
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    // 返回响应内容
    res.send(text);

  } catch (error) {
    console.error('网关代理错误:', error);
    res.statusCode = 500;
    res.json({ 
      code: 500, 
      message: '网关代理请求失败',
      error: error.message 
    });
  }
}
