export default function LoadingApps() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, index) => (
        <div 
          key={index} 
          className="border rounded-lg p-6 animate-pulse"
        >
          <div className="flex justify-between mb-4">
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/6"></div>
          </div>
          
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
          </div>
          
          <div className="h-4 bg-gray-200 rounded w-1/3 mt-4"></div>
        </div>
      ))}
    </div>
  );
} 