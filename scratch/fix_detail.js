const fs = require('fs');
const file = 'apps/web/app/business/[businessSlug]/BusinessDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

let lines = content.split('\n');
const ratingStateIdx = lines.findIndex(l => l.includes('const [reviewRating, setReviewRating] = useState(5);'));
if (ratingStateIdx !== -1 && !lines.some(l => l.includes('const [reviewStep'))) {
    lines.splice(ratingStateIdx, 0, '  const [reviewStep, setReviewStep] = useState(1);');
}

let rmStart = lines.findIndex(l => l.includes('showReviewModal &&'));
let rmEnd = rmStart;
let openDivs = 0;
let first = true;
while (rmEnd < lines.length) {
    if (lines[rmEnd].includes('<div')) openDivs += (lines[rmEnd].match(/<div/g)||[]).length;
    if (lines[rmEnd].includes('</div')) openDivs -= (lines[rmEnd].match(/<\/div/g)||[]).length;
    if (!first && openDivs <= 0) break;
    first = false;
    rmEnd++;
}

if (rmStart !== -1 && rmEnd !== -1) {
    let newRmContent = fs.readFileSync('scratch/new_review_modal_block.txt', 'utf8');
    lines.splice(rmStart, rmEnd - rmStart + 1, newRmContent);
    fs.writeFileSync(file, lines.join('\n'));
    console.log("Success! Updated file.");
} else {
    console.log("Could not find review modal boundaries.");
}
