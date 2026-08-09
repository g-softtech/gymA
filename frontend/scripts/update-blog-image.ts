import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  await prisma.marketingBlog.update({
    where: { slug: "open-profitable-gym-nigeria" },
    data: { coverImage: "/images/blog/profitable-gym-nigeria.png" },
  });

  console.log("Successfully updated the cover image!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
