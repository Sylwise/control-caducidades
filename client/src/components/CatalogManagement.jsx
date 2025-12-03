import { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Package,
  PackagePlus,
  Trash2,
  X,
  RefreshCw,
  Tag,
  Search,
  Edit,
  PackageOpen,
} from "lucide-react";
import PropTypes from "prop-types";
import CreateProductModal from "./CreateProductModal";
import { useSocket } from "../hooks/useSocket";
import OfflineManager from "../services/offlineManager";
import usePreventScroll from "../hooks/usePreventScroll";
import EditProductModal from "./EditProductModal";
import { useProductScroll } from "../hooks/useProductScroll";

const TYPE_STYLES = {
  permanente: {
    color: "text-[#1d5030]",
    bg: "bg-[#1d5030]/10",
  },
  promocional: {
    color: "text-[#c17817]",
    bg: "bg-[#c17817]/10",
  },
};

// Componente extraído para evitar re-renderizados
const ProductItem = memo(({ 
  product, 
  selectedProductId, 
  deleteConfirm, 
  highlightedProductId,
  onSelect,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel
}) => {
  if (!product || !product._id) return null;

  const isDeleteConfirm = deleteConfirm === product._id;
  const isSelected = selectedProductId === product._id;
  const isHighlighted = highlightedProductId === product._id;

  return (
    <div
      data-catalog-product-id={product._id}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(product._id);
      }}
      className={`
        w-full text-left rounded-lg transition-all duration-300 select-none
        p-3 md:p-4
        ${isDeleteConfirm 
          ? "bg-red-50 border border-red-100" 
          : `${isSelected 
               ? "bg-[#1d5030]/5 border border-[#1d5030]/30 ring-1 ring-[#1d5030]/30" 
               : "bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md hover:bg-gray-50"
             }`
        }
        ${isHighlighted ? "ring-2 ring-[#1d5030] ring-offset-2 animate-highlight" : ""}
        active:scale-[0.995] cursor-pointer
      `}
    >
      {isDeleteConfirm ? (
        <div className="w-full flex justify-center items-center gap-3 animate-[fadeIn_0.2s_ease-out]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteConfirm(product._id);
            }}
            className="flex-1 max-w-[120px] py-2 bg-red-600 text-white text-sm font-medium rounded-md
              hover:bg-red-700 active:bg-red-800 transition-colors shadow-sm
              flex items-center justify-center"
          >
            Confirmar
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteCancel();
            }}
            className="flex-1 max-w-[120px] py-2 bg-white text-gray-700 text-sm font-medium rounded-md border border-gray-300
              hover:bg-gray-50 active:bg-gray-100 transition-colors shadow-sm
              flex items-center justify-center"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-1.5 rounded-full flex-shrink-0 ${TYPE_STYLES[product.tipo]?.bg || "bg-gray-100"}`}>
              <Tag
                className={`w-5 h-5 ${
                  TYPE_STYLES[product.tipo]?.color || "text-gray-400"
                }`}
              />
            </div>
            <div className="text-gray-900 font-medium truncate select-none text-base flex-1 min-w-0">
              {product.nombre}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {isSelected ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(product._id);
                  }}
                  className="p-2 text-[#1d5030] hover:bg-[#1d5030]/10 active:bg-[#1d5030]/20 transition-colors
                  rounded-lg select-none"
                  aria-label="Editar producto"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteRequest(product._id);
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 active:bg-red-100 transition-colors
                  rounded-lg select-none"
                  aria-label="Eliminar producto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
});

ProductItem.displayName = 'ProductItem';

ProductItem.propTypes = {
  product: PropTypes.object.isRequired,
  selectedProductId: PropTypes.string,
  deleteConfirm: PropTypes.string,
  highlightedProductId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func.isRequired,
  onDeleteConfirm: PropTypes.func.isRequired,
  onDeleteCancel: PropTypes.func.isRequired,
};

const CatalogManagement = ({ isOpen, onClose }) => {
  usePreventScroll(isOpen);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [highlightedProductId, setHighlightedProductId] = useState(null);
  const { socket } = useSocket();
  
  const { scrollToProductId } = useProductScroll(null, 'data-catalog-product-id');

  const groupedProducts = useMemo(() => {
    const uniqueProducts = [];
    const seen = new Set();
    
    products.forEach(product => {
      if (!seen.has(product._id)) {
        seen.add(product._id);
        uniqueProducts.push(product);
      }
    });
    
    const filtered = uniqueProducts.filter((product) =>
      product.nombre && product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return {
      permanentes: filtered
        .filter((p) => p.tipo === "permanente")
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      promocionales: filtered
        .filter((p) => p.tipo === "promocional")
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    };
  }, [products, searchTerm]);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await OfflineManager.getAllCatalogProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error completo al cargar productos:", err);
      setError(err.message || "Error al cargar el catálogo");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, loadProducts]);

  useEffect(() => {
    const handleCatalogUpdate = (data) => {
      if (data.type === "create") {
        setProducts((prevProducts) => {
          const newProduct = data.productStatus ? data.productStatus.producto : data.product;
          if (!newProduct) return prevProducts;
          if (prevProducts.some(p => p._id === newProduct._id)) {
            return prevProducts;
          }
          return [...prevProducts, newProduct];
        });
      } else if (data.type === "delete") {
        setProducts((prevProducts) =>
          prevProducts.filter((p) => p._id !== data.productId)
        );
      } else if (data.type === "update") {
        setProducts((prevProducts) => {
          if (!data.product) return prevProducts;
          if (!prevProducts.some(p => p._id === data.product._id)) {
            return prevProducts;
          }
          return prevProducts.map((p) =>
            p._id === data.product._id ? data.product : p
          );
        });
      }
    };

    if (socket) {
      socket.on("catalogUpdate", handleCatalogUpdate);
    }

    const handleLocalCatalogUpdate = (event) => {
      handleCatalogUpdate(event.detail);
    };
    window.addEventListener("localCatalogUpdate", handleLocalCatalogUpdate);

    return () => {
      if (socket) {
        socket.off("catalogUpdate", handleCatalogUpdate);
      }
      window.removeEventListener("localCatalogUpdate", handleLocalCatalogUpdate);
    };
  }, [socket]);

  const handleDeleteProduct = (productId) => {
    OfflineManager.deleteCatalogProduct(productId).catch(err => {
      console.error("Error al eliminar en background:", err);
    });

    setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
    setDeleteConfirm(null);
    if (selectedProductId === productId) {
      setSelectedProductId(null);
    }
  };

  const handleEditProduct = (productId) => {
    setSelectedProductId(productId);
    setShowEditModal(true);
  };

  const handleProductUpdated = async (updatedProduct) => {
    // Normalizar: si viene envuelto en .producto, usar eso.
    const productToUse = updatedProduct.producto || updatedProduct;

    setProducts(prevProducts => 
      prevProducts.map(p => p._id === productToUse._id ? productToUse : p)
    );
    
    setHighlightedProductId(productToUse._id);
    setTimeout(() => setHighlightedProductId(null), 2000);

    scrollToProductId(productToUse._id);
    setSearchTerm("");
  };

  const handleProductCreated = (newProduct) => {
    // Normalizar: si viene envuelto en .producto (respuesta online), usar eso.
    // Si viene directo (respuesta offline), usar newProduct.
    const productToUse = newProduct.producto || newProduct;

    setProducts(prevProducts => {
      if (prevProducts.some(p => p._id === productToUse._id)) {
        return prevProducts;
      }
      return [...prevProducts, productToUse];
    });
    
    setHighlightedProductId(productToUse._id);
    setTimeout(() => setHighlightedProductId(null), 2000);

    scrollToProductId(productToUse._id);
    setSearchTerm(""); 
  };

  const handleClose = () => {
    setSelectedProductId(null);
    setDeleteConfirm(null);
    setSearchTerm("");
    onClose();
  };

  const handleSelect = useCallback((productId) => {
    if (deleteConfirm && deleteConfirm !== productId) {
      setDeleteConfirm(null);
    }
    
    // Si no estamos en modo confirmación de borrado para este producto
    if (deleteConfirm !== productId) {
      setSelectedProductId(prev => prev === productId ? null : productId);
    }
  }, [deleteConfirm]);

  const handleDeleteRequest = useCallback((productId) => {
    setDeleteConfirm(productId);
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  const handleBackgroundClick = () => {
    setSelectedProductId(null);
    setDeleteConfirm(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4
        animate-[fadeIn_0.2s_ease-out]"
      >
        <div
          className="fixed inset-0 bg-black/50 
            animate-[fadeIn_0.2s_ease-out]"
          onClick={handleClose}
        />

        <div
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-xl z-10
          animate-[slideIn_0.3s_ease-out] select-none"
          data-modal-content
          onClick={handleBackgroundClick}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 select-none">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-[#1d5030]" />
              <h2 className="text-lg font-bold text-[#1d5030] select-none">
                Gestión de Catálogo
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors select-none"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div
            className="p-4 max-h-[calc(100vh-12rem)] overflow-y-auto select-none"
            data-scrollable
          >
            {error && (
              <div
                className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-md animate-[slideDown_0.3s_ease-out] select-none"
              >
                {error}
              </div>
            )}

            {/* Acciones */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 select-none">
              {/* Buscador */}
              <div className="w-full sm:flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 20) {
                      setSearchTerm(value);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.target.blur();
                    }
                  }}
                  enterKeyHint="search"
                  className="w-full pl-10 pr-12 h-12 border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
                    text-gray-900 placeholder-gray-500 select-none"
                  maxLength={20}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-0 top-0 h-full w-12 flex items-center justify-center
                      text-gray-400 hover:text-gray-600
                      hover:bg-gray-100/50 rounded-r-md
                      transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {/* Botón Añadir */}
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setSearchTerm(""); 
                }}
                className="flex items-center justify-center gap-2 px-4 h-12 bg-[#1d5030] text-white rounded-md
                  hover:bg-[#1d5030]/90 transition-colors font-medium select-none w-full sm:w-auto"
              >
                <PackagePlus className="w-5 h-5" />
                Añadir Producto
              </button>
            </div>

            {/* Lista de productos */}
            <div 
              className="min-h-[300px] max-h-[60vh] overflow-y-auto select-none"
            >
              {loading ? (
                <div className="flex justify-center py-8 select-none">
                  <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
                </div>
              ) : groupedProducts.permanentes.length === 0 &&
                groupedProducts.promocionales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 select-none">
                  <div className="w-16 h-16 bg-[#1d5030]/10 rounded-full flex items-center justify-center">
                    <PackageOpen className="w-8 h-8 text-[#1d5030]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {searchTerm ? "No se encontraron resultados" : "Catálogo vacío"}
                    </h3>
                    <p className="text-gray-500 max-w-xs mx-auto">
                      {searchTerm 
                        ? `No hay productos que coincidan con "${searchTerm}"`
                        : "No hay productos registrados en el catálogo. ¡Añade el primero!"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 select-none">
                  {/* Productos Permanentes */}
                  <div className="space-y-1 mb-4 select-none">
                    <h3 className="px-1 font-medium text-sm text-gray-500 select-none">
                      Productos Permanentes ({groupedProducts.permanentes.length})
                    </h3>
                    <div className="space-y-1.5 select-none">
                      {groupedProducts.permanentes.length === 0 ? (
                        <p className="text-sm text-gray-500 italic p-2 select-none">
                          No hay productos permanentes
                        </p>
                      ) : (
                        <div className="space-y-1.5 px-4">
                          {groupedProducts.permanentes.map((product) => (
                            <ProductItem 
                              key={product._id} 
                              product={product}
                              selectedProductId={selectedProductId}
                              deleteConfirm={deleteConfirm}
                              highlightedProductId={highlightedProductId}
                              onSelect={handleSelect}
                              onEdit={handleEditProduct}
                              onDeleteRequest={handleDeleteRequest}
                              onDeleteConfirm={handleDeleteProduct}
                              onDeleteCancel={handleDeleteCancel}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Productos Promocionales */}
                  <div className="space-y-1 select-none">
                    <h3 className="px-1 font-medium text-sm text-gray-500 select-none">
                      Productos Promocionales ({groupedProducts.promocionales.length})
                    </h3>
                    <div className="space-y-1.5 select-none">
                      {groupedProducts.promocionales.length === 0 ? (
                        <p className="text-sm text-gray-500 italic p-2 select-none">
                          No hay productos promocionales
                        </p>
                      ) : (
                        <div className="space-y-1.5 px-4">
                          {groupedProducts.promocionales.map((product) => (
                            <ProductItem 
                              key={product._id} 
                              product={product}
                              selectedProductId={selectedProductId}
                              deleteConfirm={deleteConfirm}
                              highlightedProductId={highlightedProductId}
                              onSelect={handleSelect}
                              onEdit={handleEditProduct}
                              onDeleteRequest={handleDeleteRequest}
                              onDeleteConfirm={handleDeleteProduct}
                              onDeleteCancel={handleDeleteCancel}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateProductModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onProductCreated={handleProductCreated}
      />

      {/* Modal de edición */}
      {showEditModal && (
        <EditProductModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          productId={selectedProductId}
          onProductUpdated={handleProductUpdated}
        />
      )}
    </>
  );
};

CatalogManagement.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
export default CatalogManagement;
