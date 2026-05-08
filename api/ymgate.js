// 一门APP在线网关代理 - Vercel Edge Function
// 完全模拟Nginx反向代理行为，使用Edge Runtime获得完整headers控制

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
  const url = new URL(request.url);
  const targetUrl = `http://gate.open.yimenyun.com${url.pathname}${url.search}`;

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
      redirect: 'manual',  // 不自动跟随重定向
    };

    // 如果有请求体，转发
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && request.body) {
      fetchOptions.body = request.body;
    }

    // 发起请求到目标网关
    const response = await fetch(targetUrl, fetchOptions);

    // 构建响应头 - 完全原样转发
    const responseHeaders = new Headers();
    
    // Edge Runtime中需要特殊处理Set-Cookie
    const setCookieHeaders = [];
    
    for (const [key, value] of response.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (!['transfer-encoding', 'connection'].includes(lowerKey)) {
        responseHeaders.set(key, value);
      }
    }
    
    // 用getAll处理Set-Cookie（Edge Runtime支持）
    try {
      const cookies = response.headers.getAll?.('set-cookie');
      if (cookies) {
        cookies.forEach(c => responseHeaders.append('set-cookie', c));
      }
    } catch (e) {
      // getAll不可用，尝试getSetCookie
      try {
        const cookies = response.headers.getSetCookie?.();
        if (cookies && cookies.length > 0) {
          cookies.forEach(c => responseHeaders.append('set-cookie', c));
        }
      } catch (e2) {
        // 最后尝试直接get
        const cookieStr = response.headers.get('set-cookie');
        if (cookieStr) {
          responseHeaders.set('set-cookie', cookieStr);
        }
      }
    }

    // 获取响应体
    const body = await response.arrayBuffer();

    // 原样返回
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
