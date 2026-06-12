const fs = require('fs');
const path = require('path');

const map = {
  "01 Privacy Policy.md": "privacy.md",
  "02 Terms of Service Users.md": "terms-users.md",
  "03 Business Terms of Service.md": "terms-business.md",
  "04 Subscription Refund Policy.md": "refund-policy.md",
  "05 Content Moderation Policy.md": "content-moderation.md",
  "06 Cookie Policy.md": "cookie-policy.md",
  "07 Data Processing Agreement.md": "dpa.md",
  "08 Affiliate Commission Policy.md": "affiliate-policy.md",
  "09 IP Copyright DMCA Policy.md": "dmca.md"
};

for (const [oldName, newName] of Object.entries(map)) {
  const oldPath = path.join(__dirname, oldName);
  const newPath = path.join(__dirname, newName);
  if (fs.existsSync(oldPath)) {
    fs.renameSync(oldPath, newPath);
    console.log(`Renamed ${oldName} to ${newName}`);
  }
}
