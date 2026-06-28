const fs = require('fs');
const file = 'c:\\Users\\Ahmed Bilal Khan\\Desktop\\business-directory\\apps\\web\\app\\broadcast-request\\page.tsx';

let content = fs.readFileSync(file, 'utf8');

// Replace any occurrence of `"use client";` or `// "use client";` at the top,
// and make sure `"use client";` is at the very beginning.
// Let's strip the commented block at the top if it starts with //
content = content.replace(/^\/\/ "use client";\s*/, '');
// Also make sure we insert "use client"; at the very top.
if (!content.trim().startsWith('"use client";')) {
    content = '"use client";\n\n' + content;
}

// Now remove the second `"use client";` around line 75 so we don't have duplicates or misplaced directives
content = content.replace(/"use client";\s*\n\s*import React from 'react';/, "import React from 'react';");

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated page.tsx with proper "use client" directive!');
