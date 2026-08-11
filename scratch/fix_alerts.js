const fs = require('fs');
const file = 'apps/web/app/business/[businessSlug]/BusinessDetailClient.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('alert("Review comment must be at least 10 characters long.");', 'toast.error("Review comment must be at least 10 characters long.");');
content = content.replace('alert(err.message || "Failed to submit review");', 'toast.error(err.message || "Failed to submit review");');
content = content.replace('alert("Only the business owner can reply to reviews");', 'toast.error("Only the business owner can reply to reviews");');
content = content.replace('alert(err.message || "Failed to submit reply");', 'toast.error(err.message || "Failed to submit reply");');
content = content.replace('alert("Question must be at least 10 characters long.");', 'toast.error("Question must be at least 10 characters long.");');
content = content.replace('alert("Your question has been submitted and is pending moderation.");', 'toast.success("Your question has been submitted and is pending moderation.");');
content = content.replace('alert(err.message || "Failed to submit question");', 'toast.error(err.message || "Failed to submit question");');
content = content.replace('alert("Your answer has been submitted and is pending moderation.");', 'toast.success("Your answer has been submitted and is pending moderation.");');
content = content.replace('alert(err.message || "Failed to submit answer");', 'toast.error(err.message || "Failed to submit answer");');

fs.writeFileSync(file, content);
console.log("Success! Replaced all alert() with toast.error() and toast.success().");
