const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

async function convertAll() {
  const files = fs.readdirSync(__dirname).filter(f => f.endsWith(".docx"));
  for (const file of files) {
    const filePath = path.join(__dirname, file);
    const result = await mammoth.convertToMarkdown({path: filePath});
    const outPath = path.join(__dirname, file.replace(".docx", ".md"));
    fs.writeFileSync(outPath, result.value);
    console.log(`Converted ${file} to ${path.basename(outPath)}`);
  }
}

convertAll().catch(console.error);
