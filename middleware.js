export default async function middleware(request) {
  const url = new URL(request.url);
  const productId = url.searchParams.get('product_id');
  const userAgent = request.headers.get('user-agent') || '';

  // Detect social media crawler scrapers
  const isCrawler = /facebookexternalhit|WhatsApp|twitterbot|linkedinbot|pinterest/i.test(userAgent);
  const staticSiteDomain = "https://www.atelierstore.studio";

  // Case A: Social Crawler asks for a deep-linked product
  if (isCrawler && productId) {
    const ogUrl = new URL(`/api/og?product_id=${productId}`, request.url);
    return fetch(ogUrl, { headers: request.headers });
  }

  // Case B: Real Human clicks the raw proxy link -> bounce them safely to the static shop UI
  if (!isCrawler && productId) {
    return Response.redirect(`${staticSiteDomain}/?product_id=${productId}`, 302);
  }

  // Case C: Standard fallback routing
  return Response.redirect(staticSiteDomain, 302);
}

export const config = {
  matcher: '/',
};
