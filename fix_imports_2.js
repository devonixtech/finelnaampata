
const fs = require("fs");

let cat = fs.readFileSync("apps/web/app/admin/categories/page.tsx", "utf8");
cat = cat.replace(`import { toast } from "react-hot-toast";\n`, "");
cat = cat.replace(`import { toast } from "react-hot-toast";`, "");

// Add after use client
if (cat.includes("\"use client\";")) {
    cat = cat.replace("\"use client\";\n", "\"use client\";\nimport { toast } from \"react-hot-toast\";\n");
} else {
    cat = `import { toast } from "react-hot-toast";\n` + cat;
}
fs.writeFileSync("apps/web/app/admin/categories/page.tsx", cat, "utf8");

let city = fs.readFileSync("apps/web/app/admin/cities/page.tsx", "utf8");
city = city.replace(`import { toast } from "react-hot-toast";\n`, "");
city = city.replace(`import { toast } from "react-hot-toast";`, "");

if (city.includes("\"use client\";")) {
    city = city.replace("\"use client\";\n", "\"use client\";\nimport { toast } from \"react-hot-toast\";\n");
} else {
    city = `import { toast } from "react-hot-toast";\n` + city;
}
fs.writeFileSync("apps/web/app/admin/cities/page.tsx", city, "utf8");

// Also check all other files modified to make sure use client is at the top
const dirs = ["app", "components", "lib"];
const path = require("path");

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

let allFiles = walk("apps/web/app").concat(walk("apps/web/components"));

allFiles.forEach(file => {
    let content = fs.readFileSync(file, "utf8");
    if (content.includes("import { toast } from \"react-hot-toast\";") && content.includes("\"use client\";")) {
        const importIdx = content.indexOf("import { toast } from \"react-hot-toast\";");
        const clientIdx = content.indexOf("\"use client\";");
        if (importIdx < clientIdx) {
            content = content.replace("import { toast } from \"react-hot-toast\";\n", "");
            content = content.replace("\"use client\";\n", "\"use client\";\nimport { toast } from \"react-hot-toast\";\n");
            fs.writeFileSync(file, content, "utf8");
            console.log("Fixed use client order in", file);
        }
    }
});
console.log("Done");

