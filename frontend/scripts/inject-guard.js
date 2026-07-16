const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const apiFiles = walk(path.join(__dirname, '../app/api'));

let modifiedCount = 0;

for (const file of apiFiles) {
  let content = fs.readFileSync(file, 'utf-8');
  
  if (!content.includes('export async function POST') && 
      !content.includes('export async function PUT') && 
      !content.includes('export async function PATCH') && 
      !content.includes('export async function DELETE')) {
    continue;
  }
  
  if (content.includes('verifyWriteAccess')) {
    continue;
  }
  
  // Exclude webhooks and auth
  if (file.includes('webhook') || file.includes('auth')) {
    continue;
  }

  // We only care if it gets session
  if (!content.includes('getAuthSession')) {
    continue;
  }

  // Inject import at the top
  const importStatement = `import { verifyWriteAccess } from "@/lib/sandbox/guard";\n`;
  
  // Find where imports end
  const importRegex = /^import\s+.*?;?\s*$/gm;
  let lastImportMatch;
  while ((match = importRegex.exec(content)) !== null) {
    lastImportMatch = match;
  }
  
  if (lastImportMatch) {
    const insertPos = lastImportMatch.index + lastImportMatch[0].length + 1;
    content = content.slice(0, insertPos) + importStatement + content.slice(insertPos);
  } else {
    content = importStatement + content;
  }

  // Inject the guard call after session is fetched
  // Looks for `const session = await getAuthSession();` or similar
  const sessionRegex = /(const|let|var)\s+session\s*=\s*await\s+getAuthSession\s*\(\s*\)\s*;/g;
  
  let matchFound = false;
  content = content.replace(sessionRegex, (match) => {
    matchFound = true;
    return `${match}\n    if (session?.user?.tenantId) {\n      await verifyWriteAccess(session.user.tenantId);\n    }`;
  });

  if (matchFound) {
    fs.writeFileSync(file, content, 'utf-8');
    modifiedCount++;
    console.log(`Updated: ${file}`);
  }
}

console.log(`\nSuccessfully injected guard into ${modifiedCount} endpoints.`);
