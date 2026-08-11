
const fs = require("fs");
const path = require("path");

const dirs = ["app", "components", "lib"];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else if (file.endsWith(".tsx") || file.endsWith(".ts")) {
            results.push(file);
        }
    });
    return results;
}

let allFiles = [];
dirs.forEach(d => {
    allFiles = allFiles.concat(walk(d));
});

let modifiedCount = 0;

allFiles.forEach(file => {
    let content = fs.readFileSync(file, "utf8");
    if (content.includes("alert(")) {
        let originalContent = content;
        
        // Add import { toast } from "react-hot-toast" if not present
        if (!content.includes("import { toast }") && !content.includes("import toast ")) {
            const lastImportIndex = content.lastIndexOf("import ");
            if (lastImportIndex !== -1) {
                const endOfLastImport = content.indexOf("\n", lastImportIndex) + 1;
                content = content.slice(0, endOfLastImport) + `import { toast } from "react-hot-toast";\n` + content.slice(endOfLastImport);
            } else {
                content = `import { toast } from "react-hot-toast";\n` + content;
            }
        }

        // Replace alert("...success...") with toast.success
        content = content.replace(/alert\((.*?)\)/g, (match, p1) => {
            const p1Lower = p1.toLowerCase();
            if (p1Lower.includes("success") || p1Lower.includes("scheduled") || p1Lower.includes("import") || p1Lower.includes("?")) {
                 if (p1Lower.includes("fail") || p1Lower.includes("error")) {
                     return `toast.error(${p1})`;
                 }
                 return `toast.success(${p1})`;
            }
            return `toast.error(${p1})`;
        });

        if (originalContent !== content) {
            fs.writeFileSync(file, content, "utf8");
            modifiedCount++;
            console.log("Modified", file);
        }
    }
});
console.log(`Modified ${modifiedCount} files.`);

