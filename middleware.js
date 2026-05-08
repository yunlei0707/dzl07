// Edge Middleware 处理 /ymgate 路由到 API 函数
export const config = {
  matcher: ['/ymgate/:path*'],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  
  // 将 /ymgate 请求重写到 /api/ymgate
  if (url.pathname.startsWith('/ymgate')) {
    const newUrl = request.url.replace('/ymgate', '/api/ymgate');
    return fetch(newUrl, {
      headers: request.headers,
      method: request.method,
      body: request.body,
    });
  }
  
  return fetch(request);
}
