const fs = require('fs');
const file = 'apps/web/app/business/[businessSlug]/BusinessDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

const target = 'const [reviewComment, setReviewComment] = useState("");';
const replacement = target + '\n  const [reviewImages, setReviewImages] = useState<File[]>([]);\n  const [submittingReview, setSubmittingReview] = useState(false);';

if (content.includes(target) && !content.includes('const [reviewImages')) {
    content = content.replace(target, replacement);
    fs.writeFileSync(file, content);
    console.log("Success! Added reviewImages state.");
} else {
    console.log("Could not find target or already added.");
}
