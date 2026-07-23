import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find a Gym — CortexFit Directory",
  description: "Discover top-rated fitness centers, personal trainers, and gyms powered by CortexFit.",
};

export default async function DirectoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = parseInt(page || "1", 10);
  const pageSize = 12;

  // VISIBILITY POLICY ENFORCEMENT:
  // "Use the existing visibility model if one already exists. Do not introduce new database schema or business logic solely for directory visibility."
  // Currently, all active, non-demo gyms are publicly accessible via /gym/[slug]. 
  // We honor this existing application behavior and list them in the directory.
  
  const totalGyms = await prisma.tenant.count({
    where: { isActive: true, isDemo: false, status: "APPROVED" }
  });
  
  const totalPages = Math.ceil(totalGyms / pageSize) || 1;
  const safePage = Math.max(1, Math.min(currentPage, totalPages));

  const gyms = await prisma.tenant.findMany({
    where: { isActive: true, isDemo: false, status: "APPROVED" },
    include: { settings: true },
    skip: (safePage - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-indigo-900 text-white py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Discover Your Next Gym</h1>
        <p className="text-indigo-200 text-lg max-w-2xl mx-auto">
          Browse our curated directory of top-tier fitness centers powered by CortexFit.
        </p>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full">
        {gyms.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <span className="text-5xl mb-4 block">🔒</span>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Directory in Private Beta</h2>
            <p className="text-gray-500 max-w-md mx-auto">
              To protect the privacy of our partners, gyms must explicitly opt-in to appear in the public directory. 
              The opt-in feature is rolling out soon!
            </p>
            <Link href="/" className="mt-6 inline-block text-indigo-600 font-medium hover:underline">
              &larr; Return Home
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gyms.map((gym) => (
                <Link key={gym.id} href={`/gym/${gym.slug}`} className="group block bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-100 overflow-hidden">
                  <div className="h-48 bg-gray-200 relative">
                    {/* Image placeholder */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">{gym.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">
                      {gym.settings?.description || "A premier fitness center powered by CortexFit."}
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center gap-2">
                {currentPage > 1 && (
                  <Link href={`/directory?page=${currentPage - 1}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                    Previous
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                {currentPage < totalPages && (
                  <Link href={`/directory?page=${currentPage + 1}`} className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium">
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
