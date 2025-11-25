import PropTypes from "prop-types";
import { AlertCircle } from "lucide-react";
import ProductSkeleton from "./ProductSkeleton";

const LoadingErrorContainer = ({
  loading,
  error,
  onRetry,
  skeletonCount = 3,
  children,
}) => {
  if (loading) {
    return (
      <div className="max-w-md mx-auto p-4 space-y-4">
        {[...Array(skeletonCount)].map((_, index) => (
          <ProductSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto p-4 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
        <h3 className="mt-2 text-lg font-semibold text-gray-900">
          Error al cargar los productos
        </h3>
        <p className="mt-1 text-gray-500">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-4 py-2 bg-[#1d5030] text-white rounded-md hover:bg-[#1d5030]/90"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return children;
};

LoadingErrorContainer.propTypes = {
  loading: PropTypes.bool.isRequired,
  error: PropTypes.string,
  onRetry: PropTypes.func,
  skeletonCount: PropTypes.number,
  children: PropTypes.node.isRequired,
};

export default LoadingErrorContainer;
