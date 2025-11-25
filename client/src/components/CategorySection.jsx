import PropTypes from "prop-types";
import ProductCard from "./ProductCard";
import { CATEGORY_TITLES } from "../constants/productConstants";

const CategorySection = ({
  category,
  products,
  selectedProduct,
  isExpiringSoon,
  lastUpdatedProductId,
  onProductClick,
  onUpdateClick,
  onDeleteClick,
}) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="category-section">
      {/* Header de categoría */}
      <h2
        className="
        bg-[#f3f4f6] 
        border-l-4 border-[#1d5030] 
        py-3 px-4
        text-[14px] font-semibold 
        text-[#1d5030]
        uppercase tracking-wide
        mb-3
        select-none
      "
      >
        {CATEGORY_TITLES[category]}
      </h2>

      {/* Lista de productos */}
      <div className="space-y-2 ml-2">
        {products.map((product) => (
          <ProductCard
            key={product.producto?._id}
            product={product}
            isSelected={
              selectedProduct?.producto?._id === product.producto?._id
            }
            isExpiringSoon={isExpiringSoon}
            lastUpdatedProductId={lastUpdatedProductId}
            onProductClick={onProductClick}
            onUpdateClick={onUpdateClick}
            onDeleteClick={onDeleteClick}
          />
        ))}
      </div>
    </div>
  );
};

CategorySection.propTypes = {
  category: PropTypes.string.isRequired,
  products: PropTypes.array.isRequired,
  selectedProduct: PropTypes.object,
  isExpiringSoon: PropTypes.func.isRequired,
  lastUpdatedProductId: PropTypes.string,
  onProductClick: PropTypes.func.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
};

export default CategorySection;
