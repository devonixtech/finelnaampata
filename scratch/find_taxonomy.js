const fs = require('fs');
const path = require('path');

const logPath = 'C:\\Users\\Ahmed Bilal Khan\\.gemini\\antigravity\\brain\\8d8b294c-b7a9-4cd7-beb0-ff949553e837\\.system_generated\\logs\\overview.txt';

if (!fs.existsSync(logPath)) {
    console.log('Log file does not exist at:', logPath);
    process.exit(1);
}

const content = fs.readFileSync(logPath, 'utf8');
console.log('Total content length:', content.length);

const index = content.indexOf('Food & Dining');
if (index === -1) {
    console.log('Food & Dining not found in log file.');
} else {
    console.log('Found "Food & Dining" at index:', index);
    console.log('Snippet:', content.substring(index - 200, index + 1000));
}
