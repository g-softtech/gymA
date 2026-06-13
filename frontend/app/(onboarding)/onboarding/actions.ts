/** @deprecated Use /api/tenant/create instead */
"use server"

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createTenant(formData: FormData) {
  const session = await getAuthSession();
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const gymName = formData.get("gymName") as string;
  if (!gymName || gymName.trim() === "") {
    throw new Error("Gym name is required");
  }

  // Generate a URL-friendly slug for the gym
  const slug = gymName.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Math.floor(Math.random() * 1000);

  // ACID compliance: Create Tenant and update User in a single transaction
  await prisma.$transaction(async (tx: any) => {
    const tenant = await tx.tenant.create({
      data: {
        name: gymName,
        slug: slug,
      }
    });

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        tenantId: tenant.id,
        role: "ADMIN", // The creator of the gym becomes the Gym Owner (ADMIN)
      }
    });
  });

  // Clear cache and redirect to dashboard with newly assigned tenant
  revalidatePath("/dashboard");
  redirect("/dashboard");
}