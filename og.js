import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const productId = searchParams.get('product_id');

  // Fallback metadata if no product ID is present
  let title = "ATELIER | Fashion and Style Marketplace";
  let image = "https://ittsskhqkcbeuwuasjxf.supabase.co/storage/v1/object/public/product-images/1.png";
  let description = "Discover luxury footwear and apparel on ATELIER.";

  if (productId) {
    const { data: product } = await supabase
      .from('products')
      .select('title, name, image_url, description')
      .eq('id', productId)
      .single();

    if (product) {
      title = product.title || product.name || title;
      image = product.image_url || image;
      description = product.description ? product.description.slice(0, 150) : description;
    }
  }

  // Detect if caller is a social crawler
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = /facebookexternalhit|WhatsApp|twitterbot|linkedinbot|pinterest/i.test(userAgent);

  if (!isCrawler && productId) {
    // Redirect real humans straight to your GitHub Pages domain
    return res.redirect(302, `https://www.atelierstore.studio/?product_id=${productId}`);
  }

  // Return raw HTML with dynamic OG tags to social crawlers
  res.setHeader('Content-Type', 'text/html');
  return res.status(200).send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <meta property="og:title" content="${title}" />
      <meta property="og:description" content="${description}" />
      <meta property="og:image" content="${image}" />
      <meta property="og:type" content="product" />
      <meta property="og:url" content="https://www.atelierstore.studio/?product_id=${productId}" />
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:image" content="${image}">
    </head>
    <body>
      <script>window.location.href = "https://www.atelierstore.studio/?product_id=${productId}";</script>
    </body>
    </html>
  `);
}