const fs = require('fs');
const content = fs.readFileSync('apps/web/lib/api.ts', 'utf8');

const fpIdx = content.indexOf('forgotPassword');
console.log("forgotPassword index:", fpIdx);
if (fpIdx !== -1) {
    console.log("forgotPassword snippet:\n", content.slice(fpIdx - 100, fpIdx + 500));
}

const rpIdx = content.indexOf('resetPassword');
console.log("resetPassword index:", rpIdx);
if (rpIdx !== -1) {
    console.log("resetPassword snippet:\n", content.slice(rpIdx - 100, rpIdx + 500));
}
