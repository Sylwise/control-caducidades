import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
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

const CatalogManagement = ({ isOpen, onClose }) => {
  // Usar el hook para prevenir scroll
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
  
  // Refs para elementos de producto
  const productRefs = useRef({});
  const scrollContainerRef = useRef(null);

  // Agrupar productos por tipo
  const groupedProducts = useMemo(() => {
    // Filtrar duplicados y clasificar productos
    const uniqueProducts = [];
    const seen = new Set();
    
    // Eliminar duplicados basados en ID
    products.forEach(product => {
      if (!seen.has(product._id)) {
        seen.add(product._id);
        uniqueProducts.push(product);
      }
    });
    
    // Aplicar filtro de búsqueda
    const filtered = uniqueProducts.filter((product) =>
      product.nombre && product.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    // Clasificar productos únicos por tipo
    return {
      permanentes: filtered
        .filter((p) => p.tipo === "permanente")
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
      promocionales: filtered
        .filter((p) => p.tipo === "promocional")
        .sort((a, b) => a.nombre.localeCompare(b.nombre)),
    };
  }, [products, searchTerm]);

  // Cargar productos
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

  // Scroll a producto y resaltado
  const scrollToProduct = useCallback((productId) => {
    if (!productId || !productRefs.current[productId]) return;
    
    // Obtener el elemento del producto
    const productElement = productRefs.current[productId];
    
    // Hacer scroll
    if (productElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const elementTop = productElement.offsetTop;
      const containerTop = container.scrollTop;
      const containerHeight = container.clientHeight;
      
      // Centrar el elemento en el contenedor
      container.scrollTo({
        top: elementTop - (containerHeight / 2) + (productElement.clientHeight / 2),
        behavior: 'smooth'
      });
      
      // Resaltar el producto
      setHighlightedProductId(productId);
      
      // Eliminar el resaltado después de 2 segundos
      setTimeout(() => {
        setHighlightedProductId(null);
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, loadProducts]);

  // Escuchar eventos de socket y locales
  useEffect(() => {
    const handleCatalogUpdate = (data) => {
      if (data.type === "create") {
        // Verificar que el producto no exista antes de añadirlo
        setProducts((prevProducts) => {
          // El evento puede venir del socket (productStatus) o local (productStatus)
          // Necesitamos extraer el producto del catálogo
          const newProduct = data.productStatus ? data.productStatus.producto : data.product;
          
          if (!newProduct) return prevProducts;

          // Si el producto ya existe, no lo añadimos de nuevo
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
          // Verificar que data.product exista
          if (!data.product) return prevProducts;

          // Si el producto no existe en el array, no intentamos actualizarlo
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

    // Escuchar eventos locales para modo offline
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

  // Eliminar producto
  const handleDeleteProduct = async (productId) => {
    try {
      setLoading(true);

      await OfflineManager.deleteCatalogProduct(productId);
      // Actualizar el estado local sin recargar todos los productos
      setProducts(prevProducts => prevProducts.filter(p => p._id !== productId));
      setDeleteConfirm(null);
      setError(null);
      setSearchTerm(""); // Limpiar el buscador
    } catch (err) {
      console.error("Error completo al eliminar:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Manejar edición de producto
  const handleEditProduct = (productId) => {
    setSelectedProductId(productId);
    setShowEditModal(true);
  };

  // Manejar producto actualizado
  const handleProductUpdated = async (updatedProduct) => {
    // Actualizar el producto en el estado local sin recargar toda la lista
    setProducts(prevProducts => 
      prevProducts.map(p => p._id === updatedProduct._id ? updatedProduct : p)
    );
    
    // Scroll al producto editado
    setTimeout(() => {
      scrollToProduct(updatedProduct._id);
    }, 300);
    setSearchTerm(""); // Limpiar el buscador
  };

  // Manejar producto creado
  const handleProductCreated = async (newProduct) => {
    // Verificar que el producto no exista antes de añadirlo
    setProducts(prevProducts => {
      // Si el producto ya existe, no lo añadimos de nuevo
      if (prevProducts.some(p => p._id === newProduct._id)) {
        return prevProducts;
      }
      return [...prevProducts, newProduct];
    });
    
    // Scroll al nuevo producto
    setTimeout(() => {
      scrollToProduct(newProduct._id);
    }, 300);
    setSearchTerm(""); // Limpiar el buscador
  };

  // Renderizar producto (memorizado)
  const ProductItem = memo(({ product }) => {
    // Verificar que el producto tenga un ID válido
    if (!product || !product._id) {
      return null;
    }
    
    return (
      <div
        ref={(el) => (productRefs.current[product._id] = el)}
        onClick={() => {
          // Si seleccionamos un producto diferente, cancelar cualquier confirmación previa
          if (deleteConfirm && deleteConfirm !== product._id) {
            setDeleteConfirm(null);
          }
          
          setSelectedProductId(
            selectedProductId === product._id ? null : product._id
          );
        }}
        className={`
          flex items-center justify-between p-3 w-full
          ${selectedProductId === product._id ? "bg-gray-100" : "bg-gray-50"}
          ${highlightedProductId === product._id ? "animate-pulse bg-gray-100" : ""}
          rounded-md transition-colors
          active:bg-gray-200 select-none
        `}
      >
        {/* Información del producto - asegurarnos que no crezca demasiado */}
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2 select-none">
          <Tag
            className={`w-5 h-5 flex-shrink-0 ${
              TYPE_STYLES[product.tipo]?.color || "text-gray-400"
            }`}
          />
          <span className="text-gray-900 truncate select-none">{product.nombre}</span>
        </div>

        {/* Contenedor de botones con ancho fijo */}
        <div className="w-[140px] flex justify-end">
          {deleteConfirm === product._id ? (
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteProduct(product._id);
                }}
                className="px-4 py-3 min-h-[48px] min-w-[80px] bg-red-600 text-white text-sm rounded
                  hover:bg-red-700 transition-colors whitespace-nowrap flex items-center justify-center select-none"
              >
                Confirmar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(null);
                }}
                className="px-4 py-3 min-h-[48px] min-w-[80px] bg-gray-200 text-gray-700 text-sm rounded
                  hover:bg-gray-300 transition-colors whitespace-nowrap flex items-center justify-center select-none"
              >
                Cancelar
              </button>
            </div>
          ) : (
            selectedProductId === product._id ? (
              <div className="flex items-center gap-1 justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProduct(product._id);
                  }}
                  className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center text-[#1d5030] hover:bg-[#1d5030]/10 transition-colors
                  rounded-lg select-none"
                  aria-label="Editar producto"
                >
                  <Edit className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(product._id);
                  }}
                  className="p-2 min-w-[48px] min-h-[48px] flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors
                  rounded-lg select-none"
                  aria-label="Eliminar producto"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ) : (
              // Espacio invisible pero con el mismo ancho para mantener el layout consistente
              <div className="w-[140px]"></div>
            )
          )}
        </div>
      </div>
    );
  });
  
  // Prevenir re-renderizados innecesarios
  ProductItem.displayName = 'ProductItem';

  const handleClose = () => {
    // Limpiar selecciones al cerrar el modal
    setSelectedProductId(null);
    setDeleteConfirm(null);
    setSearchTerm(""); // Limpiar el buscador
    onClose();
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
            <div className="flex items-center justify-between gap-4 mb-4 select-none">
              {/* Buscador */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Permitir letras, números y espacios, máximo 20 caracteres
                    if (
                      /^[a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s]*$/.test(value) &&
                      value.length <= 20
                    ) {
                      setSearchTerm(value);
                    }
                  }}
                  className="w-full pl-3 pr-10 py-3 min-h-[48px] border border-gray-300 rounded-md
                    focus:outline-none focus:ring-2 focus:ring-[#1d5030]/50 focus:border-transparent
                    text-gray-900 placeholder-gray-500 select-none"
                  maxLength={20}
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>

              {/* Botón Añadir */}
              <button
                onClick={() => {
                  setShowCreateModal(true);
                  setSearchTerm(""); // Limpiar el buscador al pulsar "Añadir Producto"
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 min-h-[48px] bg-[#1d5030] text-white rounded-md
                  hover:bg-[#1d5030]/90 transition-colors font-medium select-none"
              >
                <PackagePlus className="w-5 h-5" />
                Añadir Producto
              </button>
            </div>

            {/* Lista de productos */}
            <div 
              className="min-h-[300px] max-h-[60vh] overflow-y-auto select-none"
              ref={scrollContainerRef}
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
                        groupedProducts.permanentes.map((product) => (
                          <ProductItem key={product._id} product={product} />
                        ))
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
                        groupedProducts.promocionales.map((product) => (
                          <ProductItem key={product._id} product={product} />
                        ))
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
