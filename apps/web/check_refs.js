const fs = require('fs');
const s = fs.readFileSync('out/index.html', 'utf8');

// Extract inline script content
const scripts = s.match(/<script>self\.__next_f\.push\(\[1,"(.+?)"\]\)<\/script>/g);
if (scripts) {
    console.log('Inline scripts:', scripts.length);
    // Check for any _next or chunk path references
    scripts.forEach((script, i) => {
        const content = script.replace(/<\/?script>/g, '').replace('self.__next_f.push([1,', '').slice(0, -2);
        if (content.includes('_next') || content.includes('chunks/') || content.includes('static/')) {
            console.log(`Script ${i} has path ref:`, content.substring(0, 200));
        }
    });
}

// Check the first few chars of index.html for any script tags we missed
const allScriptSrcs = s.match(/src="([^"]+)"/g);
console.log('\nAll src attributes:');
if (allScriptSrcs) allScriptSrcs.forEach(x => console.log(x));

// Check for __NEXT_DATA__ or similar config
if (s.includes('__NEXT_DATA__')) console.log('\nHas __NEXT_DATA__');
if (s.includes('assetPrefix')) console.log('\nHas assetPrefix config');
if (s.includes('publicPath')) console.log('\nHas publicPath config');
