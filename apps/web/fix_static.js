const fs = require('fs');
const files = [
  'app/business/[businessSlug]/page.tsx',
  'app/businesses/[businessSlug]/page.tsx',
  'app/categories/[categorySlug]/page.tsx',
  'app/cities/[cityName]/page.tsx',
  'app/vendors/[vendorSlug]/page.tsx',
  'app/offers-events/[offerId]/page.tsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let c = fs.readFileSync(file, 'utf8');
  
  // Remove dynamic = 'force-static'
  c = c.replace(/export\s+const\s+dynamic\s*=\s*['"]force-static['"];?/g, '');
  
  // Remove dynamicParams = false
  c = c.replace(/export\s+const\s+dynamicParams\s*=\s*false;?/g, '');
  
  // Remove generateStaticParams entirely
  c = c.replace(/export\s+async\s+function\s+generateStaticParams\s*\(\)\s*\{[\s\S]*?(?=\nexport\s+(?:default\s+)?async\s+function\s+(?:generateMetadata|[A-Z]))/m, '');
  
  fs.writeFileSync(file, c);
  console.log('Processed ' + file);
});
