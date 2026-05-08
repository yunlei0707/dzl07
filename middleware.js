// Edge Middleware 处理 /ymgate 路由
export const config = {
  matcher: ['/ymgate/:path*'],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  
  // 获取用户ID和密钥
  const userId = '495126';
  const userSecret = 'TNvPWnZHeSQFdyyRzcNV2QzAfj2lwgLkwUbR3eKqPK9JkRu5';
  const xYmUser = `u${userId}.${userSecret}`;
  
  // 构建目标URL - 网关使用 http 协议和 /ymgate 路径
  const path = url.pathname.replace(/^\/ymgate/, '') || '/';
  const targetUrl = `http://gate.open.yimenyun.com/ymgate${path === '/' ? '' : path}${url.search}`;
  
  console.log('Edge网关请求:', { targetUrl, method: request.method });
  
  // 构建请求头
  const headers = new Headers();
  headers.set('X-Ym-User', xYmUser);
  headers.set('Content-Type', request.headers.get('content-type') || 'application/json');
  
  // 复制其他必要的请求头
  const excludeHeaders = ['host', 'content-length', 'connection'];
  request.headers.forEach((value, key) => {
    if (!excludeHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  
  try {
    // 转发请求到目标网关
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: ['POST', 'PUT', 'PATCH'].includes(request.method) ? await request.text() : undefined,
    });
    
    // 获取响应
    const text = await response.text();
    
    // 返回响应
    return new Response(text, {
      status: response.status,
      headers: response.headers,
    });
  } catch (error) {
    console.error('网关代理错误:', error);
    return new Response(JSON.stringify({
      code: 500,
      message: '网关代理请求失败',
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
