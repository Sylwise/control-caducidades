import PropTypes from "prop-types";
import CategorySection from "./CategorySection";

const ProductListContainer = ({
  filteredProducts,
  selectedProduct,
  isExpiringSoon,
  lastUpdatedProductId,
  onProductClick,
  onUpdateClick,
  onDeleteClick,
  searchTerm,
}) => {
  // Verificar si hay productos en alguna categoría
  const hasProducts = Object.values(filteredProducts).some(
    (products) => products.length > 0
  );

  if (!hasProducts) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg px-4 break-words">
          {searchTerm
            ? `No se encontraron productos que coincidan con "${searchTerm.slice(
                0,
                15
              )}"`
            : "Selecciona los artículos sin clasificar para gestionar sus caducidades."}
        </p>
      </div>
    );
  }

  return (
    <div className="product-list-container">
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
              />
            </div>
          )
      )}
    </div>
  );
};

ProductListContainer.propTypes = {
  filteredProducts: PropTypes.object.isRequired,
  selectedProduct: PropTypes.object,
  isExpiringSoon: PropTypes.func.isRequired,
  lastUpdatedProductId: PropTypes.string,
  onProductClick: PropTypes.func.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  searchTerm: PropTypes.string.isRequired,
};

export default ProductListContainer;
