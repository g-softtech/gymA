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

    // Replace session.user with session!.user
    content = content.replace(/session\.user/g, 'session!.user');
    
    // Replace session?.user with session!.user
    content = content.replace(/session\?\.user/g, 'session!.user');

    // Replace tenant.id with tenant!.id
    content = content.replace(/tenant\.id/g, 'tenant!.id');
    
    // Replace tenant.name with tenant!.name
    content = content.replace(/tenant\.name/g, 'tenant!.name');

    // Replace tenant.slug with tenant!.slug
    content = content.replace(/tenant\.slug/g, 'tenant!.slug');

    fs.writeFileSync(fullPath, content);
    console.log(`Patched: ${relPath}`);
  }
}
