import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function TenantPage({
  params,
}: {
  params: { tenant: string };
}) {
  const tenant = await prisma.tenant.findUnique({
    where: { slug: params.tenant },
    select: { name: true },
  });

  if (!tenant) {
    notFound();
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Welcome to {tenant.name}</h1>
        <p className="mt-2 text-lg text-gray-600">This is the main page for the tenant: {params.tenant}</p>
      </div>
    </div>
  );
}