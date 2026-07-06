export default function AnalyticsLoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* HEADER */}
      <div>
        <div className="h-8 bg-muted rounded w-48 mb-2"></div>
        <div className="h-4 bg-muted rounded w-96"></div>
      </div>

      <div className="space-y-8">
        {/* TIME CONTROLS SKELETON */}
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-9 bg-muted rounded-full w-28"></div>
          ))}
        </div>

        {/* INSIGHT LAYER SKELETON (Show 2) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-border bg-muted/20 flex gap-4 h-[88px]">
              <div className="w-8 h-8 rounded-full bg-muted mt-1"></div>
              <div className="flex-1 space-y-2 py-1">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2 opacity-60"></div>
              </div>
            </div>
          ))}
        </div>

        {/* KPI GRID SKELETON */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-card rounded-xl p-5 border border-border h-[106px] flex flex-col justify-between">
              <div className="h-3 bg-muted rounded w-1/2"></div>
              <div className="h-8 bg-muted rounded w-3/4 my-2"></div>
              <div className="h-3 bg-muted rounded w-2/3 opacity-60"></div>
            </div>
          ))}
        </div>

        {/* MAIN CHART SKELETON */}
        <div className="bg-card rounded-xl border border-border p-6 h-[400px] flex flex-col">
          <div className="h-6 bg-muted rounded w-64 mb-6"></div>
          <div className="flex-1 bg-muted/30 rounded-lg border border-dashed border-border flex items-end p-4 gap-2">
            {/* Fake bar chart silhouette for structure */}
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex-1 bg-muted/40 rounded-t-sm" style={{ height: `${Math.max(10, Math.random() * 100)}%` }}></div>
            ))}
          </div>
        </div>

        {/* SECONDARY ROW SKELETON */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card rounded-xl border border-border p-6 h-[340px] flex flex-col">
              <div className="h-6 bg-muted rounded w-48 mb-6"></div>
              <div className="flex-1 bg-muted/20 rounded-full aspect-square max-h-[200px] mx-auto opacity-50"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
