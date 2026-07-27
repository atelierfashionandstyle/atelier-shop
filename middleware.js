export default async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  const userAgent = request.headers.get('user-agent') || '';

  // Detect social media crawlers
  const isCrawler = /facebookexternalhit|WhatsApp|twitterbot|linkedinbot|pinterest/i.test(userAgent);

  // If a crawler hits a product link, rewrite the request to /api/og
  if (isCrawler && productId) {
    const ogUrl = new URL(`/api/og?product_id=${productId}`, request.url);
    
    // Perform internal rewrite via fetch
    return fetch(ogUrl, {
      headers: request.headers,
    });
  }

  // Real human visitors proceed straight to the request normally
  return fetch(request);
}

export const config = {
  matcher: '/',
};