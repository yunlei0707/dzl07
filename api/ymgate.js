// 一门APP在线网关代理 - Vercel Edge Function
// 完全模拟Nginx反向代理行为

export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  // 处理OPTIONS预检请求
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // 获取用户ID和密钥
  const userId = process.env.YM_USER_ID || '495126';
  const userSecret = process.env.YM_USER_SECRET || 'TNvPWnZHeSQFdyyRzcNV2QzAfj2lwgLkwUbR3eKqPK9JkRu5';
  const xYmUser = `u${userId}.${userSecret}`;

  // 构建目标URL
  // Edge Function收到的路径是 /api/ymgate 或 /api/ymgate/xxx
  // 需要转换为 /ymgate 或 /ymgate/xxx 再拼到网关地址
  const url = new URL(request.url);
  let gatewayPath = url.pathname;
  // 把 /api/ymgate 前缀替换为 /ymgate
  if (gatewayPath.startsWith('/api/ymgate')) {
    gatewayPath = gatewayPath.replace('/api/ymgate', '/ymgate');
  }
  const targetUrl = `http://gate.open.yimenyun.com${gatewayPath}${url.search}`;

  // 构建转发请求头
  const headers = new Headers();
  headers.set('X-Ym-User', xYmUser);
  
  // 复制客户端请求头
  const excludeHeaders = ['host', 'content-length', 'connection', 'transfer-encoding'];
  for (const [key, value] of request.headers.entries()) {
    const lowerKey = key.toLowerCase();
    if (!excludeHeaders.includes(lowerKey)) {
      headers.set(key, value);
    }
  }

  try {
    const fetchOptions = {
      method: request.method,
      headers: headers,
      redirect: 'manual',
    };

    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      fetchOptions.body = request.body;
    }

    const response = await fetch(targetUrl, fetchOptions);

    // 构建响应头
    const responseHeaders = new Headers();
    
    for (const [key, value] of response.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (!['transfer-encoding', 'connection'].includes(lowerKey)) {
        responseHeaders.set(key, value);
      }
    }

    // 单独处理Set-Cookie（Fetch API的entries()会跳过此头）
    if (typeof response.headers.getSetCookie === 'function') {
      const cookies = response.headers.getSetCookie();
      if (cookies && cookies.length > 0) {
        for (const cookie of cookies) {
          responseHeaders.append('set-cookie', cookie);
        }
      }
    }

    // 调试头
    responseHeaders.set('X-Proxy-Version', 'edge-v4');

    const body = await response.arrayBuffer();

    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });

  } catch (error) {
    return new Response(JSON.stringify({ 
      code: 502, 
      message: '网关代理请求失败',
      error: error.message 
    }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
