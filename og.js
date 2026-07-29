import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const { searchParams } = new URL(req.url, `https://${req.headers.host}`);
  const productId = searchParams.get('product_id');

  let title = "ATELIER | Fashion and Style Marketplace";
  let image = "https://ittsskhqkcbeuwuasjxf.supabase.co/storage/v1/object/public/product-images/1.png";
  let description = "Discover luxury footwear and apparel on ATELIER.";

  if (productId) {
  const { data: product } = await supabase
    .from('products')
    .select('title, name, images, description') // Changed image_url to images to match your database
    .eq('id', productId)
    .single();

  if (product) {
    title = product.title || product.name || title;
    description = product.description ? product.description.slice(0, 150) : description;
    
    // Safety handle for your text[] array column
    if (Array.isArray(product.images) && product.images.length > 0) {
      image = product.images[0]; // Extract the first image link for social previews
    } else if (typeof product.images === 'string' && product.images.trim() !== '') {
      // Fallback parsing just in case it returns as a raw string format
      try {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed) && parsed.length > 0) image = parsed[0];
      } catch(e) {
        image = product.images.replace(/[\[\]\"]/g, '').trim().split(',')[0];
      }
    }
  }
}


  // Always send HTML containing only the meta tags to the crawlers
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate'); // Cache previews for 24h
  
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
      <meta name="twitter:title" content="${title}">
      <meta name="twitter:description" content="${description}">
      <meta name="twitter:image" content="${image}">
    </head>
    <body>
      <script>window.location.href = "https://www.atelierstore.studio/?product_id=${productId}";</script>
    </body>
    </html>
  `);
}
