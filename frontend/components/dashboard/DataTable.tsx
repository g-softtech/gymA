import React from "react";
import Link from "next/link";

export interface DataTableProps {
  columns: { key: string; label: string }[];
  children: React.ReactNode;
  currentPage: number;
  totalPages: number;
  baseHref: string; // e.g. "/gym/slug/dashboard/admin/members/health"
}

export function DataTable({ columns, children, currentPage, totalPages, baseHref }: DataTableProps) {
  return (
    <div className="bg-card text-card-foreground border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {children}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Link
              href={`${baseHref}?page=${Math.max(1, currentPage - 1)}`}
              className={`px-3 py-1 text-sm border border-border rounded-md ${
                currentPage === 1 ? "opacity-50 pointer-events-none" : "hover:bg-muted"
              }`}
            >
              Previous
            </Link>
            <Link
              href={`${baseHref}?page=${Math.min(totalPages, currentPage + 1)}`}
              className={`px-3 py-1 text-sm border border-border rounded-md ${
                currentPage === totalPages ? "opacity-50 pointer-events-none" : "hover:bg-muted"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
