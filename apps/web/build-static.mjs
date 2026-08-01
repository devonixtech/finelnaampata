#!/usr/bin/env node
import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { resolve } from 'path';

const DIR = resolve(import.meta.dirname, 'app');
const files = [
  `${DIR}/cities/[cityName]/page.tsx`,
  `${DIR}/categories/[categorySlug]/page.tsx`,
  `${DIR}/business/[businessSlug]/page.tsx`,
  `${DIR}/offers-events/[offerId]/page.tsx`,
];

const backups = files.map(f => ({ file: f, content: readFileSync(f, 'utf-8') }));

console.log('Step 1: Skipping patches (generateStaticParams now fetches real data)...');

console.log('Step 2: Building static export...');
try {
  execSync('npx next build', {
    cwd: import.meta.dirname,
    stdio: 'inherit',
    env: { ...process.env, STATIC_EXPORT: 'true', NODE_ENV: 'production' }
  });
  console.log('\nBuild successful! Output in ./out/');

  // Step 2.5: Write cPanel deployment files
  const outDir = resolve(import.meta.dirname, 'out');

  // .htaccess - bulletproof Apache/LiteSpeed config
  const htaccess = `# Next.js Static Export - cPanel Configuration
Options +FollowSymLinks -MultiViews
RewriteEngine On
RewriteBase /

# Serve existing static files directly
RewriteCond %{DOCUMENT_ROOT}/%{REQUEST_URI} -f
RewriteRule ^ - [L]
RewriteCond %{REQUEST_FILENAME} -f
RewriteRule ^ - [L]

# Custom 404 - serve SPA shell for client-side routing
ErrorDocument 404 /404.html

# MIME types
<IfModule mod_mime.c>
    AddType text/css .css
    AddType application/javascript .js .mjs
    AddType application/json .json
    AddType image/svg+xml .svg
    AddType font/woff2 .woff2
    AddType font/woff .woff
    AddType font/ttf .ttf
    AddType application/vnd.ms-fontobject .eot
    AddType image/png .png
    AddType image/jpeg .jpg .jpeg
    AddType image/gif .gif
    AddType image/webp .webp
    AddType image/x-icon .ico
</IfModule>

<IfModule mod_headers.c>
    <FilesMatch "\\.css$">Header set Content-Type "text/css"</FilesMatch>
    <FilesMatch "\\.js$">Header set Content-Type "application/javascript"</FilesMatch>
    <FilesMatch "\\.mjs$">Header set Content-Type "application/javascript"</FilesMatch>
    <FilesMatch "\\.css$|\\.js$|\\.mjs$|\\.woff2?$|\\.ttf$|\\.eot$|\\.png$|\\.jpe?g$|\\.gif$|\\.svg$|\\.ico$|\\.webp$">
        Header set Cache-Control "public, max-age=31536000, immutable"
    </FilesMatch>
    Header set X-Content-Type-Options "nosniff"
</IfModule>

DirectoryIndex index.html

# Dynamic route fallbacks
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^business/([^/]+)/?$ /business/template/index.html [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^vendors/([^/]+)/?$ /vendors/template/index.html [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^businesses/([^/]+)/?$ /businesses/template/index.html [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^cities/([^/]+)/?$ /cities/template/index.html [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^categories/([^/]+)/?$ /categories/template/index.html [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^offers-events/([^/]+)/?$ /offers-events/template/index.html [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^legal/([^/]+)/?$ /legal/template/index.html [L]

# Final HTML fallback
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ /index.html [L]
`;
  writeFileSync(resolve(outDir, '.htaccess'), htaccess, 'utf-8');
  console.log('Step 2.5a: .htaccess written');

  // web.config - IIS/LiteSpeed config with custom 404 + rewrite rules
  const webConfig = `<?xml version="1.0" encoding="UTF-8"?>
<configuration>
  <system.webServer>
    <directoryBrowse enabled="false" />
    <defaultDocument enabled="true">
      <files>
        <add value="index.html" />
      </files>
    </defaultDocument>
    <httpErrors errorMode="Custom" existingResponse="Replace">
      <remove statusCode="404" />
      <error statusCode="404" path="/404.html" responseMode="ExecuteURL" />
    </httpErrors>
    <rewrite>
      <rules>
        <rule name="StaticFiles" stopProcessing="true">
          <match url="^(.*)" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" /></conditions>
          <action type="None" />
        </rule>
        <rule name="Directories" stopProcessing="true">
          <match url="^(.*)" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsDirectory" /></conditions>
          <action type="None" />
        </rule>
        <rule name="BusinessDetail" stopProcessing="true">
          <match url="^business/([^/]+)/?$" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /></conditions>
          <action type="Rewrite" url="business/template/index.html" />
        </rule>
        <rule name="VendorDetail" stopProcessing="true">
          <match url="^vendors/([^/]+)/?$" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /></conditions>
          <action type="Rewrite" url="vendors/template/index.html" />
        </rule>
        <rule name="BusinessListing" stopProcessing="true">
          <match url="^businesses/([^/]+)/?$" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /></conditions>
          <action type="Rewrite" url="businesses/template/index.html" />
        </rule>
        <rule name="CityPages" stopProcessing="true">
          <match url="^cities/([^/]+)/?$" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /></conditions>
          <action type="Rewrite" url="cities/template/index.html" />
        </rule>
        <rule name="CategoryPages" stopProcessing="true">
          <match url="^categories/([^/]+)/?$" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /></conditions>
          <action type="Rewrite" url="categories/template/index.html" />
        </rule>
        <rule name="OffersPages" stopProcessing="true">
          <match url="^offers-events/([^/]+)/?$" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /></conditions>
          <action type="Rewrite" url="offers-events/template/index.html" />
        </rule>
        <rule name="LegalPages" stopProcessing="true">
          <match url="^legal/([^/]+)/?$" />
          <conditions><add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" /></conditions>
          <action type="Rewrite" url="legal/template/index.html" />
        </rule>
        <rule name="HtmlFallback" stopProcessing="true">
          <match url="^(.*)$" />
          <conditions>
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
          </conditions>
          <action type="Rewrite" url="index.html" />
        </rule>
      </rules>
    </rewrite>
    <staticContent>
      <remove fileExtension=".css" /><mimeMap fileExtension=".css" mimeType="text/css" />
      <remove fileExtension=".js" /><mimeMap fileExtension=".js" mimeType="application/javascript" />
      <remove fileExtension=".mjs" /><mimeMap fileExtension=".mjs" mimeType="application/javascript" />
      <remove fileExtension=".json" /><mimeMap fileExtension=".json" mimeType="application/json" />
      <remove fileExtension=".svg" /><mimeMap fileExtension=".svg" mimeType="image/svg+xml" />
      <remove fileExtension=".woff" /><mimeMap fileExtension=".woff" mimeType="font/woff" />
      <remove fileExtension=".woff2" /><mimeMap fileExtension=".woff2" mimeType="font/woff2" />
      <remove fileExtension=".ttf" /><mimeMap fileExtension=".ttf" mimeType="font/ttf" />
      <remove fileExtension=".otf" /><mimeMap fileExtension=".otf" mimeType="font/otf" />
      <remove fileExtension=".eot" /><mimeMap fileExtension=".eot" mimeType="application/vnd.ms-fontobject" />
      <remove fileExtension=".webp" /><mimeMap fileExtension=".webp" mimeType="image/webp" />
      <remove fileExtension=".txt" /><mimeMap fileExtension=".txt" mimeType="text/plain" />
      <remove fileExtension=".xml" /><mimeMap fileExtension=".xml" mimeType="application/xml" />
      <remove fileExtension=".html" /><mimeMap fileExtension=".html" mimeType="text/html" />
      <remove fileExtension=".png" /><mimeMap fileExtension=".png" mimeType="image/png" />
      <remove fileExtension=".jpg" /><mimeMap fileExtension=".jpg" mimeType="image/jpeg" />
      <remove fileExtension=".jpeg" /><mimeMap fileExtension=".jpeg" mimeType="image/jpeg" />
      <remove fileExtension=".gif" /><mimeMap fileExtension=".gif" mimeType="image/gif" />
      <remove fileExtension=".ico" /><mimeMap fileExtension=".ico" mimeType="image/x-icon" />
      <remove fileExtension=".pdf" /><mimeMap fileExtension=".pdf" mimeType="application/pdf" />
    </staticContent>
  </system.webServer>
</configuration>`;
  writeFileSync(resolve(outDir, 'web.config'), webConfig, 'utf-8');
  console.log('Step 2.5b: web.config written');

  // router.php - PHP fallback (always overwritten to stay in sync)
  const routerPhp = `<?php
@ini_set('output_buffering', 'off');
@ini_set('zlib.output_compression', false);
while (ob_get_level()) { ob_end_clean(); }

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);
$docRoot = rtrim($_SERVER['DOCUMENT_ROOT'], '/');
$path = rtrim($path, '/') ?: '/';
$path = str_replace('..', '', $path);

$mimes = array(
    'css'=>'text/css','js'=>'application/javascript','mjs'=>'application/javascript',
    'json'=>'application/json','svg'=>'image/svg+xml','png'=>'image/png',
    'jpg'=>'image/jpeg','jpeg'=>'image/jpeg','gif'=>'image/gif','webp'=>'image/webp',
    'avif'=>'image/avif','ico'=>'image/x-icon','woff'=>'font/woff','woff2'=>'font/woff2',
    'ttf'=>'font/ttf','otf'=>'font/otf','eot'=>'application/vnd.ms-fontobject',
    'txt'=>'text/plain','xml'=>'application/xml','html'=>'text/html','htm'=>'text/html',
    'wasm'=>'application/wasm','map'=>'application/json','pdf'=>'application/pdf',
    'gif'=>'image/gif','svgz'=>'image/svg+xml','jfif'=>'image/jpeg','icon'=>'image/x-icon',
);

function serveFile($fp, $mimes) {
    $ext = strtolower(pathinfo($fp, PATHINFO_EXTENSION));
    header('Content-Type: ' . (isset($mimes[$ext]) ? $mimes[$ext] : 'application/octet-stream'));
    $static = array('css','js','mjs','woff','woff2','ttf','otf','eot','png','jpg','jpeg','gif','svg','svgz','ico','webp','avif');
    if (in_array($ext, $static)) { header('Cache-Control: public, max-age=31536000, immutable'); }
    header('X-Content-Type-Options: nosniff');
    header('Accept-Ranges: bytes');
    $sz = filesize($fp);
    if ($sz === false || $sz <= 0) { http_response_code(404); exit; }
    header('Content-Length: ' . $sz);
    readfile($fp);
    exit;
}

function serveHtml($fp) {
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache, no-store, must-revalidate');
    header('X-Content-Type-Options: nosniff');
    readfile($fp);
    exit;
}

if ($path !== '/') {
    $file = $docRoot . $path;
    if (is_file($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if (!in_array($ext, array('html','htm'))) { serveFile($file, $mimes); }
        serveHtml($file);
    }
    $dirIdx = rtrim($file, '/') . '/index.html';
    if (is_file($dirIdx)) { serveHtml($dirIdx); }
    $parts = explode('/', trim($path, '/'));
    $seg = isset($parts[0]) ? $parts[0] : '';
    $tpls = array('business','vendors','businesses','cities','categories','offers-events','legal');
    if (in_array($seg, $tpls)) {
        $tpl = $docRoot . '/' . $seg . '/template/index.html';
        if (is_file($tpl)) { serveHtml($tpl); }
    }
}

$root = $docRoot . '/index.html';
if (is_file($root)) { serveHtml($root); }
http_response_code(404);
header('Content-Type: text/html; charset=utf-8');
echo '<!DOCTYPE html><html><head><title>404</title></head><body><h1>404 Not Found</h1></body></html>';
exit;
`;
  writeFileSync(resolve(outDir, 'router.php'), routerPhp, 'utf-8');
  console.log('Step 2.5c: router.php written');

  // Step 2.6: Create SPA-friendly 404.html
  // LiteSpeed on cPanel doesn't process .htaccess or PHP.
  // When a dynamic route like /business/slug is visited, no file exists,
  // so LiteSpeed serves 404.html. By making 404.html identical to index.html,
  // the Next.js client-side router takes over and renders the correct page.
  const indexHtml = resolve(outDir, 'index.html');
  const notFound404 = resolve(outDir, '404.html');
  if (existsSync(indexHtml)) {
    copyFileSync(indexHtml, notFound404);
    console.log('Step 2.6: 404.html created as SPA shell (copy of index.html)');
  }

  console.log('Step 2.5: All cPanel deployment files written to ./out/');

  // Step 2.7: Inject SPA fallback script into index.html
  // LiteSpeed doesn't process .htaccess/web.config, so /categories/slug, /cities/slug etc.
  // serve root index.html. This script detects non-template dynamic routes and
  // redirects to the template page while preserving the slug via sessionStorage.
  try {
    const indexPath = resolve(outDir, 'index.html');
    const indexContent = readFileSync(indexPath, 'utf-8');
    const spaScript = `<script>
(function(){
  var p=window.location.pathname;
  var routes=['categories','cities','businesses','offers-events','legal'];
  for(var i=0;i<routes.length;i++){
    var prefix='/'+routes[i]+'/';
    if(p.startsWith(prefix)){
      var rest=p.substring(prefix.length).replace(/\\/$/,'').split('/')[0];
      if(rest&&rest!=='template'&&rest!=='index'&&rest!==''){
        try{sessionStorage.setItem('spa_slug',rest)}catch(e){}
        window.location.replace(prefix+'template/');
        return;
      }
    }
  }
})();
</script>`;
    if (!indexContent.includes('sessionStorage.setItem')) {
      const modifiedIndex = indexContent.replace('</head>', spaScript + '\n</head>');
      writeFileSync(indexPath, modifiedIndex, 'utf-8');
      console.log('Step 2.7: SPA fallback script injected into index.html');
    }
  } catch (e) {
    console.error('Step 2.7: Failed to inject SPA script:', e.message);
  }

} finally {
  console.log('Step 3: Restoring original files...');
  for (const { file, content } of backups) {
    writeFileSync(file, content, 'utf-8');
    console.log(`  Restored: ${file.split('\\').pop()}`);
  }
  console.log('All files restored. Live site unaffected.');
}
