const fs = require('fs');
const path = require('path');

const files = [
  'app/gym/[slug]/dashboard/admin/blog/[postId]/page.tsx',
  'app/gym/[slug]/dashboard/admin/domains/page.tsx',
  'app/gym/[slug]/dashboard/admin/branding/page.tsx',
  'app/gym/[slug]/dashboard/admin/checkin/page.tsx',
  'app/gym/[slug]/dashboard/member/nutrition/log/page.tsx',
  'app/gym/[slug]/dashboard/member/bookings/page.tsx',
  'app/gym/[slug]/dashboard/trainer/page.tsx',
  'app/(superadmin)/admin/page.tsx'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove `if (!session?.user) return null;`
    content = content.replace(/^[ \t]*if\s*\(!session\?\.user\)\s*return\s*null;\s*$/gm, '');

    // Remove `if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPERADMIN")) { redirect(...) }`
    content = content.replace(/^[ \t]*if\s*\(!session\?\.user\s*\|\|[^{]*\)\s*\{\s*redirect\([^)]*\);\s*\}\s*$/gm, '');

    // Remove `if (!session?.user?.id) return null;`
    content = content.replace(/^[ \t]*if\s*\(!session\?\.user\?\.id\)\s*return\s*null;\s*$/gm, '');

    // Remove `if (!tenant) return null;`
    content = content.replace(/^[ \t]*if\s*\(!tenant\)\s*return\s*null;\s*$/gm, '');

    // Remove `if (ctx.role !== "SUPERADMIN") redirect(...)`
    content = content.replace(/^[ \t]*if\s*\([^{]*role[^{]*\)\s*redirect\([^)]*\);\s*$/gm, '');
    
    // Remove `if (session.user.role === "TRAINER") redirect(...)`
    content = content.replace(/^[ \t]*if\s*\([^{]*role[^{]*\)\s*\{\s*redirect\([^)]*\);\s*\}\s*$/gm, '');

    // Replace `import { redirect } from "next/navigation"` with `` if unused
    if (!content.includes('redirect(') && content.includes('redirect')) {
      content = content.replace(/import\s*\{\s*redirect\s*,?\s*\}\s*from\s*['"]next\/navigation['"];?/g, '');
      content = content.replace(/import\s*\{\s*redirect\s*,\s*notFound\s*\}\s*from\s*['"]next\/navigation['"];?/g, 'import { notFound } from "next/navigation";');
      content = content.replace(/import\s*\{\s*notFound\s*,\s*redirect\s*\}\s*from\s*['"]next\/navigation['"];?/g, 'import { notFound } from "next/navigation";');
    }

    fs.writeFileSync(fullPath, content);
    console.log(`Cleaned: ${relPath}`);
  }
}
