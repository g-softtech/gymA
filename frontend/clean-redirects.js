const fs = require('fs');
const path = require('path');

let cleanedFiles = [];
let removedCount = 0;

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;

      // 1. Single line: if (!session?.user?.id) redirect(`/api/auth/signin`);
      content = content.replace(/^[ \t]*if\s*\(\s*!session[^)]*\)\s*redirect\([^)]*\);?\s*$/gm, () => { removedCount++; return ''; });
      
      // 2. Single line: if (!tenant) redirect(...);
      content = content.replace(/^[ \t]*if\s*\(\s*!tenant\s*\)\s*redirect\([^)]*\);?\s*$/gm, () => { removedCount++; return ''; });
      
      // 3. Single line role check: if (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN") redirect(...)
      content = content.replace(/^[ \t]*if\s*\([^)]*session\.user\.role[^)]*\)\s*redirect\([^)]*\);?\s*$/gm, () => { removedCount++; return ''; });

      // 4. Single line profile check
      content = content.replace(/^[ \t]*if\s*\(\s*!(user|memberProfile|trainerProfile)[^)]*\)\s*redirect\([^)]*\);?\s*$/gm, () => { removedCount++; return ''; });
      content = content.replace(/^[ \t]*if\s*\(\s*(role|session)[^)]*\)\s*redirect\([^)]*\);?\s*$/gm, () => { removedCount++; return ''; });
      
      // 5. Multi-line role check
      // if (session.user.role === "ADMIN" || session.user.role === "SUPERADMIN") {
      //   redirect(`/gym/${slug}/dashboard/admin`);
      // }
      content = content.replace(/^[ \t]*if\s*\([^)]*(session\.user\.role|role)[^)]*\)\s*\{\s*redirect\([^)]*\);\s*\}/gm, () => { removedCount++; return ''; });

      // 6. Multi-line user/tenant check
      content = content.replace(/^[ \t]*if\s*\(\s*!(session|tenant|memberProfile|trainerProfile|user)[^)]*\)\s*\{\s*redirect\([^)]*\);\s*\}/gm, () => { removedCount++; return ''; });

      if (content !== original) {
        fs.writeFileSync(fullPath, content);
        cleanedFiles.push(fullPath);
      }
    }
  }
}

// Don't touch checkout or join pages as they are public entry points that NEED redirects
const EXCLUDED = ["join", "checkout"];

processDir(path.join(__dirname, 'app/gym'));
processDir(path.join(__dirname, 'app/(superadmin)'));

// Filter out excluded
cleanedFiles = cleanedFiles.filter(f => !EXCLUDED.some(ex => f.includes(path.sep + ex + path.sep)));

console.log(JSON.stringify({ cleanedFiles, removedCount }, null, 2));
