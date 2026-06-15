export default function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
      <div className="h-4 bg-gray-100 rounded w-1/3 mt-2"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-gray-50 h-32 rounded-xl"></div>
        ))}
      </div>
      
      <div className="bg-gray-50 h-64 rounded-xl mt-6"></div>
    </div>
  );
}
