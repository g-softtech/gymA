const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('page.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('const tenant = await prisma.tenant.findUnique') && 
          !content.includes('if (!tenant) return null;') &&
          !content.includes('if (!tenant) notFound();')) {
          
          content = content.replace(
            /(const tenant = await prisma\.tenant\.findUnique\(\{[^}]*\}\);)/g, 
            '$1\n  if (!tenant) return null;'
          );
          
          content = content.replace(
            /(const tenant = await prisma\.tenant\.findUnique\([\s\S]*?\);)/g,
            function(match) {
               if (match.includes('where')) {
                   return match + '\n  if (!tenant) return null;';
               }
               return match;
            }
          );
          
          fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(__dirname, 'app/gym'));
processDir(path.join(__dirname, 'app/(superadmin)'));

console.log("Tenant TS Fix Applied.");
