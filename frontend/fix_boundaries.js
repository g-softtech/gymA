const fs = require('fs');
const glob = require('glob');

const files = glob.sync('app/api/**/*.ts');

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Pattern: await prisma.model.delete({ where: { id: ... } })
  // We only replace if there's no tenantId in where clause
  content = content.replace(
    /await\s+prisma\.([a-zA-Z0-9_]+)\.delete\(\s*\{\s*where:\s*\{\s*id:\s*([a-zA-Z0-9_]+)\s*\}\s*\}\s*\);/g,
    (match, model, idVar) => {
      // Don't touch if it's user or tenant or postLike
      if (['user', 'tenant', 'postLike', 'trainerProfile', 'memberProfile'].includes(model)) return match;
      // Assume ctx is available
      if (!content.includes('ctx.tenantId') && !content.includes('ctx?.tenantId')) return match;
      changed = true;
      return `const deleteResult = await prisma.${model}.deleteMany({ where: { id: ${idVar}, tenantId: ctx.tenantId } });\n    if (deleteResult.count === 0) return NextResponse.json({ error: "Record not found or unauthorized" }, { status: 404 });`;
    }
  );

  if (changed) {
    fs.writeFileSync(file, content);
    console.log(`Patched delete in ${file}`);
  }
}
