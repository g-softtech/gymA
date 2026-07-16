const fs = require('fs');
const path = require('path');

const files = [
  'app/api/admin/promote/route.ts',
  'app/api/blog/[postId]/route.ts',
  'app/api/blog/route.ts',
  'app/api/community/challenges/route.ts',
  'app/api/superadmin/tenants/route.ts',
  'app/api/tenant/settings/route.ts',
  'app/api/trainer/messages/route.ts',
  'app/api/trainer/progress/route.ts',
  'app/api/trainer/schedule/route.ts',
  'app/api/trainer/workouts/route.ts'
];

for (const file of files) {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf-8');
    
    // The broken import looks like:
    // import {
    // import { verifyWriteAccess } from "@/lib/sandbox/guard";
    
    content = content.replace(/import\s*\{\s*import\s*\{\s*verifyWriteAccess\s*\}\s*from\s*"@\/lib\/sandbox\/guard";/g, 'import { verifyWriteAccess } from "@/lib/sandbox/guard";\nimport {');
    
    fs.writeFileSync(fullPath, content, 'utf-8');
    console.log('Fixed', file);
  }
}
