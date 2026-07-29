export default async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  const userAgent = request.headers.get('user-agent') || '';

  // 1. Detect social media crawler scrapers
  const isCrawler = /facebookexternalhit|WhatsApp|twitterbot|linkedinbot|pinterest/i.test(userAgent);

  // 2. Case A: Social Crawler asks for a deep-linked product -> Send to your API endpoint
  if (isCrawler && productId) {
    const ogUrl = new URL(`/api/og?product_id=${productId}`, request.url);
    return fetch(ogUrl, { headers: request.headers });
  }

  // 3. Case B: Real Human clicks a deep-link -> Let them load the regular page 
  // DO NOT redirect them to the exact same URL, just pass the request along!
  if (productId) {
    return NextResponse.next(); 
  }

  // 4. Case C: Default Fallback -> Let the static request load cleanly without any loops
  return NextResponse.next();
}

export const config = {
  // Only match the home page path or query route to prevent breaking internal asset paths
  matcher: ['/', '/index.html'],
};
