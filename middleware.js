import { NextResponse } from 'next/server';

export default async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Detect social media crawler scrapers
  const isCrawler = /facebookexternalhit|WhatsApp|twitterbot|linkedinbot|pinterest/i.test(userAgent);

  // Case A: Social Crawler opening a product link -> Rewrite to og.js API endpoint
  if (isCrawler && productId) {
    const ogUrl = new URL(`/api/og?product_id=${productId}`, request.url);
    return NextResponse.rewrite(ogUrl);
  }

  // Case B & C: Real humans or standard visits -> Let the request pass through normally to index.html!
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};