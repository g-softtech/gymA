import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { TenantThemeProvider } from "@/components/TenantThemeProvider";
import { notFound } from "next/navigation";

export default async function GymLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  
  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    include: { settings: true }
  });

  if (!tenant) {
    notFound();
  }

  return (
    <TenantThemeProvider settings={tenant.settings} tenantName={tenant.name}>
      {children}
    </TenantThemeProvider>
  );
}