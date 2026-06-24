const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/api/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern: const updated = await prisma.model.update({ where: { id: ... }, data: { ... } })
  // We only replace if there's no tenantId in where clause
  content = content.replace(
    /(?:const\s+[a-zA-Z0-9_]+\s*=\s*)?await\s+prisma\.([a-zA-Z0-9_]+)\.update\(\s*\{\s*where:\s*\{\s*id:\s*([a-zA-Z0-9_]+)\s*\}\s*,\s*data:\s*\{([^]*?)\}\s*\}\s*\);/g,
    (match, model, idVar, dataObj) => {
      // Don't touch if it's user or tenant or trainerProfile etc
      if (['user', 'tenant', 'tenantSettings', 'postLike', 'trainerProfile', 'memberProfile'].includes(model)) return match;
      if (!content.includes('ctx.tenantId') && !content.includes('ctx?.tenantId')) return match;
      changed = true;
      return `const updateResult = await prisma.${model}.updateMany({ where: { id: ${idVar}, tenantId: ctx.tenantId }, data: {${dataObj}} });\n    if (updateResult.count === 0) return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });`;
    }
  );

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Patched update in ${file}`);
  }
}
