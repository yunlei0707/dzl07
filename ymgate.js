// 一门APP在线网关代理 - Vercel Serverless Function
// 用于接收一门APP的版本推送等在线功能请求

export default async function handler(req, res) {
  // 获取用户ID和密钥
  const userId = process.env.YM_USER_ID || '495126';
  const userSecret = process.env.YM_USER_SECRET || 'TNvPWnZHeSQFdyyRzcNV2QzAfj2lwgLkwUbR3eKqPK9JkRu5';
  const xYmUser = `u${userId}.${userSecret}`;

  // 构建目标URL - 保留完整路径，一门网关要求 /ymgate 路径
  // req.url 可能是 /ymgate 或 /ymgate/xxx，直接拼接到网关地址
  const targetUrl = `http://gate.open.yimenyun.com${req.url}`;

  console.log('网关代理请求:', { targetUrl, method: req.method });

  // 构建转发请求头
  const headers = {
    'X-Ym-User': xYmUser,
    'Content-Type': req.headers['content-type'] || 'application/json',
  };

  // 复制其他必要的请求头
  const excludeHeaders = ['host', 'content-length', 'connection'];
  Object.entries(req.headers).forEach(([key, value]) => {
    if (!excludeHeaders.includes(key.toLowerCase()) && !headers[key]) {
      headers[key] = value;
    }
  });

  try {
    const fetchOptions = {
      method: req.method,
      headers: headers,
    };

    // 如果有请求体，则添加
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      fetchOptions.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    // 发起请求到目标网关（使用http协议）
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
