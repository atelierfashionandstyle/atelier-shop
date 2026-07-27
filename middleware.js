import { NextResponse } from 'next/server';

export async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  const userAgent = request.headers.get('user-agent') || '';

  // Detect social media crawlers
  const isCrawler = /facebookexternalhit|WhatsApp|twitterbot|linkedinbot|pinterest/i.test(userAgent);

  // If a crawler hits a product link, rewrite the request to your /api/og function
  if (isCrawler && productId) {
    return NextResponse.rewrite(new URL(`/api/og?product_id=${productId}`, request.url));
  }

  // Real human visitors proceed straight to index.html normally
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};