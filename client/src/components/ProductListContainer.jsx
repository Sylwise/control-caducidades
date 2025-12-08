import { memo } from "react";
import PropTypes from "prop-types";
import CategorySection from "./CategorySection";
import { Search, ClipboardList } from "lucide-react";

const ProductListContainer = memo(({
  filteredProducts,
  selectedProduct,
  isExpiringSoon,
  lastUpdatedProductId,
  onProductClick,
  onUpdateClick,
  onDeleteClick,
  searchTerm,
  viewMode,
}) => {
  // Verificar si hay productos en alguna categoría
  const hasProducts = Object.values(filteredProducts).some(
    (products) => products.length > 0
  );

  if (!hasProducts) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
        {searchTerm ? (
          <>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                No se encontraron resultados
              </h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                No hay productos que coincidan con "{searchTerm.slice(0, 20)}{searchTerm.length > 20 ? '...' : ''}"
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-[#1d5030]/10 rounded-full flex items-center justify-center">
              <ClipboardList className="w-8 h-8 text-[#1d5030]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Lista de caducidades vacía
              </h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                Selecciona los artículos en <span className="font-medium text-[#1d5030]">"Sin Clasificar"</span> para comenzar a gestionar sus fechas.
              </p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="product-list-container pb-20 md:pb-0">
      {Object.entries(filteredProducts).map(
        ([category, productList], index) =>
          productList.length > 0 && (
            <div key={category} className={index > 0 ? "mt-6" : ""}>
              <CategorySection
                category={category}
                products={productList}
                selectedProduct={selectedProduct}
                isExpiringSoon={isExpiringSoon}
                lastUpdatedProductId={lastUpdatedProductId}
                onProductClick={onProductClick}
                onUpdateClick={onUpdateClick}
                onDeleteClick={onDeleteClick}
                viewMode={viewMode}
              />
            </div>
          )
      )}
    </div>
  );
});

ProductListContainer.displayName = "ProductListContainer";

ProductListContainer.propTypes = {
  filteredProducts: PropTypes.object.isRequired,
  selectedProduct: PropTypes.object,
  isExpiringSoon: PropTypes.func.isRequired,
  lastUpdatedProductId: PropTypes.string,
  onProductClick: PropTypes.func.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
  viewMode: PropTypes.string,
};

export default ProductListContainer;
