const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('page.tsx') || fullPath.endsWith('layout.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // If the file uses session.user.id or session.user.role but doesn't have an if (!session) return/redirect,
      // it will throw a TS error.
      // Let's just find "const session = await getAuthSession();"
      // and append "if (!session?.user) return null;"
      
      // Only append if it doesn't already have some guard
      if (content.includes('const session = await getAuthSession();') && 
          !content.includes('if (!session?.user) return null;') &&
          !content.includes('if (!session?.user?.id) return null;')) {
          
          content = content.replace(
            /(const session = await getAuthSession\(\);\s*)/g, 
            '$1if (!session?.user) return null;\n  '
          );
          
          fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(__dirname, 'app/gym'));
processDir(path.join(__dirname, 'app/(superadmin)'));

console.log("TS Fix Applied.");
