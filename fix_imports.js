
const fs = require("fs");

["apps/web/app/admin/categories/page.tsx", "apps/web/app/admin/cities/page.tsx"].forEach(file => {
    let content = fs.readFileSync(file, "utf8");
    if (content.includes(`import { toast } from "react-hot-toast";`)) {
        content = content.replace(`import { toast } from "react-hot-toast";\n`, "");
        content = `import { toast } from "react-hot-toast";\n` + content;
        fs.writeFileSync(file, content, "utf8");
        console.log("Fixed", file);
    }
});

