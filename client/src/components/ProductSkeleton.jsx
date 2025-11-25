const ProductSkeleton = () => (
  <div className="bg-white p-3 rounded-lg shadow-sm border border-[#ffb81c]/20">
    <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse mb-2" />
    <div className="space-y-2 border-t border-[#ffb81c]/10 pt-2">
      {[1, 2].map((index) => (
        <div key={index}>
          <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mb-1" />
          <div className="h-7 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      ))}
      <div className="space-y-2 mt-3">
        {[1, 2].map((index) => (
          <div
            key={index}
            className="h-10 bg-gray-200 rounded w-full animate-pulse"
          />
        ))}
      </div>
    </div>
  </div>
);

export default ProductSkeleton;
