export default async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Detect social media crawlers
  const isCrawler = /facebookexternalhit|WhatsApp|twitterbot|linkedinbot|pinterest/i.test(userAgent);

  // 2. Case A: Social Crawler asks for a deep-linked product -> Fetch proxy tags
  if (isCrawler && productId) {
    const ogUrl = new URL(`/api/og?product_id=${productId}`, request.url);
    return fetch(ogUrl, { headers: request.headers });
  }

  // 3. Case B: Real Humans or missing parameters -> Pass straight through cleanly
  // Using standard Web API syntax avoids Vercel compilation crashes
  return Response.next();
}

export const config = {
  matcher: ['/', '/index.html'],
};
