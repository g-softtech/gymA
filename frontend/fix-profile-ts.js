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
      
      const toFix = [
        { varName: "memberProfile", prismaCall: "prisma.memberProfile.findUnique" },
        { varName: "trainerProfile", prismaCall: "prisma.trainerProfile.findUnique" },
        { varName: "user", prismaCall: "prisma.user.findUnique" }
      ];

      let changed = false;
      for (const item of toFix) {
        if (content.includes(`const ${item.varName} = await ${item.prismaCall}`) && 
            !content.includes(`if (!${item.varName}) return null;`) &&
            !content.includes(`if (!${item.varName}) notFound();`)) {
            
            // Regex to find the entire findUnique block and append the guard
            const regex = new RegExp(`(const ${item.varName} = await ${item.prismaCall.replace(/\./g, '\\.')}\\([\\s\\S]*?\\);)`, 'g');
            
            content = content.replace(regex, function(match) {
               if (match.includes('where')) {
                   return match + `\n  if (!${item.varName}) return null;`;
               }
               return match;
            });
            changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDir(path.join(__dirname, 'app/gym'));
processDir(path.join(__dirname, 'app/(superadmin)'));

console.log("Profile/User TS Fix Applied.");
