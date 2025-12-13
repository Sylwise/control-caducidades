import { memo, useMemo } from "react";
import { Box, Clock, Edit3, Trash2, Package, History, PackageOpen } from "lucide-react";
import PropTypes from "prop-types";
import { isExpired } from "../utils/dateUtils";

const formatDate = (dateString) => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Fecha inválida";

    return date.getFullYear() !== new Date().getFullYear()
      ? `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}/${date.getFullYear().toString().slice(-2)}`
      : `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}`;
  } catch {
    return "Fecha inválida";
  }
};

const ProductCard = memo(({
  product,
  isSelected,
  isExpiringSoon,
  lastUpdatedProductId,
  onProductClick,
  onUpdateClick,
  onDeleteClick,
  viewMode = 'card',
}) => {

  const freshnessLevel = useMemo(() => {
    if (!product.updatedAt) return 0;
    const daysDiff = (new Date() - new Date(product.updatedAt)) / (1000 * 60 * 60 * 24);
    
    if (daysDiff > 7) return 3; // ABANDONED: > 7 days
    if (daysDiff > 4) return 2; // OLD: > 4 days
    if (daysDiff > 2) return 1; // STALE: > 2 days
    return 0; // FRESH
  }, [product.updatedAt]);

  const getStatusColor = () => {
    if (product.producto?.isDirectConsumption) {
       let hasExpired = false;
       let hasExpiringSoon = false;

       // Helper to check a single date
       const checkDate = (d) => {
         if (!d) return;
         if (isExpired(d)) hasExpired = true;
         else if (isExpiringSoon(d)) hasExpiringSoon = true;
       };

       // Check standard fields if they exist (though mostly only fechasAlmacen used)
       checkDate(product.fechaAlmacen);
       
       // Check array
       if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
         product.fechasAlmacen.forEach(f => {
            const dateVal = typeof f === 'object' ? f.date : f;
            checkDate(dateVal);
         });
       }

       if (hasExpired) return 'bg-red-500 animate-pulse';
       if (hasExpiringSoon) return 'bg-[#ffb81c] animate-pulse';
       return null;
    }

    if (isExpired(product.fechaFrente)) return 'bg-red-500 animate-pulse';
    if (isExpiringSoon(product.fechaFrente)) return 'bg-[#ffb81c] animate-pulse';
    return null;
  };

  const nextDate = useMemo(() => {
    if (!product.fechasAlmacen || product.fechasAlmacen.length === 0 || !product.fechaFrente) return null;
    
    const frontTime = new Date(product.fechaFrente).getTime();
    if (isNaN(frontTime)) return null;

    const sortedDates = [...product.fechasAlmacen]
      .map(d => {
        // Handle both object structure {date, boxes} and simple date string
        const dateValue = d.date || d;
        const boxes = d.boxes !== undefined ? d.boxes : 1;
        return { date: dateValue, time: new Date(dateValue).getTime(), boxes };
      })
      .filter(d => !isNaN(d.time))
      .sort((a, b) => a.time - b.time);

    const next = sortedDates.find(d => d.time > frontTime);
    return next || null;
  }, [product.fechasAlmacen, product.fechaFrente]);

  const isSameDate = useMemo(() => {
     if (!product.fechaFrente || !product.fechaAlmacen) return false;
     return formatDate(product.fechaFrente) === formatDate(product.fechaAlmacen);
  }, [product.fechaFrente, product.fechaAlmacen]);

  return (
    <div
      data-product-id={product.producto?._id}
      onClick={() => onProductClick(product)}
      className={`
        w-full text-left 
        rounded-lg
        transition-all duration-300
        ${viewMode === 'compact' 
          ? 'py-2 px-3 sm:px-2 border border-gray-200 shadow-sm mb-2 hover:shadow-md bg-white select-none' 
          : 'p-3 md:p-4 shadow hover:shadow-md border'}
        
        ${/* STYLES BASED ON FRESHNESS LEVEL */ ''}
        ${freshnessLevel === 0 ? "bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50" : ""}
        ${freshnessLevel === 1 ? "bg-[#fafafa] border-gray-300 hover:bg-gray-100" : ""}
        ${freshnessLevel === 2 ? "bg-white border-amber-200/60 shadow-sm hover:bg-amber-50/10" : ""}
        ${freshnessLevel === 3 ? "bg-gray-50 border-red-300/50 opacity-75 grayscale-[0.3] hover:opacity-100 hover:grayscale-0" : ""}

        ${isSelected ? "ring-1 ring-[#1d5030]/30 bg-[#1d5030]/5" : ""}
        ${
          lastUpdatedProductId === product.producto?._id
            ? "animate-highlight bg-[#1d5030]/5"
            : ""
        }
        active:scale-[0.995]
        product-card
        cursor-pointer
      `}
    >
      {viewMode === 'compact' ? (
        // VISTA COMPACTA - Layout Aplanado (Flattened)
        <div className="flex flex-wrap md:flex-nowrap items-center w-full gap-y-1 md:gap-4 p-0">
          
          {/* 1. SECCIÓN NOMBRE (Arriba Izquierda en Móvil / Izquierda en Desktop) */}
          <div className="order-1 flex items-center gap-3 flex-1 min-w-0">
            {/* Nombre del producto - Mínimo ancho para no desaparecer */}
            <span className="font-['Noto Sans'] font-medium text-gray-700 text-sm md:text-sm truncate block">
              {product.producto?.nombre}
            </span>
          </div>

          {/* 2. SECCIÓN BOTONES (Arriba Derecha en Móvil / Derecha en Desktop) */}
          <div className="order-2 md:order-3 flex items-center justify-end gap-2 md:gap-1 flex-shrink-0 ml-2 md:ml-0 min-h-[32px] w-[72px]">
             {/* TOGGLE: Iconos vs Botones */}
             {!isSelected ? (
                /* ESTADO NORMAL: Iconos de estado y frescura */
                <>
                  <div className={`
                      w-2.5 h-2.5 rounded-full flex-shrink-0
                      ${getStatusColor() || 'hidden'}
                  `} />

                  {freshnessLevel > 0 && (
                    <div 
                      className={`
                        flex items-center justify-center p-1.5 rounded-full flex-shrink-0 ring-1
                        ${freshnessLevel === 1 ? "bg-gray-100 ring-gray-200 text-gray-400" : ""}
                        ${freshnessLevel === 2 ? "bg-amber-50 ring-amber-100/50 text-amber-500/80" : ""}
                        ${freshnessLevel === 3 ? "bg-red-50 ring-red-100/50 text-red-500/70" : ""}
                      `}
                    >
                      {freshnessLevel === 1 && <Clock size={12} />}
                      {freshnessLevel === 2 && <History size={14} />}
                      {freshnessLevel === 3 && <History size={14} />}
                    </div>
                  )}
                </>
             ) : (
                /* ESTADO SELECCIONADO: Botones de acción */
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateClick(product, e);
                    }}
                    className="
                      flex items-center justify-center
                      h-8 w-8
                      text-gray-400 hover:text-[#1d5030] hover:bg-[#1d5030]/10 
                      rounded-full sm:rounded transition-colors
                    "
                    title="Editar"
                  >
                    <Edit3 className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  {(product.estado !== "sin-clasificar" || product.fechaFrente || product.fechaAlmacen) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteClick(product, e);
                      }}
                      className="
                        flex items-center justify-center
                        h-8 w-8
                        text-gray-400 hover:text-red-500 hover:bg-red-50 
                        rounded-full sm:rounded transition-colors
                      "
                      title="Eliminar"
                    >
                      <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  )}
                </>
             )}
          </div>

          {/* 3. SECCIÓN FECHAS (Fila 2 en Móvil / Centro en Desktop) */}
          <div className="order-3 md:order-2 w-full md:w-[280px]">
            <div className="flex flex-wrap gap-2 text-xs">
              {product.producto?.isDirectConsumption ? (
                  // LOGIC FOR DIRECT CONSUMPTION (COMPACT)
                  (() => {
                        const allDates = [];
                        if (product.fechaAlmacen) allDates.push({ date: product.fechaAlmacen, boxes: product.cajasAlmacen || 0 });
                        if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
                            product.fechasAlmacen.forEach(f => {
                                const d = typeof f === 'object' ? f.date : f;
                                const b = typeof f === 'object' ? f.boxes : 1;
                                if (d) allDates.push({ date: d, boxes: b });
                            });
                        }
                        allDates.sort((a, b) => new Date(a.date) - new Date(b.date));

                        if (allDates.length === 0) return <div className="col-span-2 text-gray-400 italic">Sin fechas</div>;

                        // Show up to 2 dates, or scroll? Let's show up to 2 rows (4 dates) or just list them.
                        // Given the grid-cols-2, mapping them directly works well.
                        return allDates.map((item, idx) => (
                             <div key={idx} className="flex items-center justify-start gap-1 bg-gray-50 px-2 h-7 rounded border border-gray-100 w-auto overflow-hidden">
                                <span className="font-medium text-gray-700 truncate">{formatDate(item.date)}</span>
                                {item.boxes > 0 && (
                                  <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">
                                    x{item.boxes}
                                  </span>
                                )}
                             </div>
                        ));
                  })()
              ) : (
                  // NORMAL LOGIC
                  isSameDate ? (
                    <>
                      <div className="flex items-center justify-between gap-1.5 bg-gray-50 px-2 h-7 rounded border border-gray-100 w-auto overflow-hidden">
                        <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">F/A:</span>
                        <span className="font-medium text-gray-700 truncate">{formatDate(product.fechaFrente)}</span>
                        {product.cajasAlmacen > 1 && (
                          <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">
                            x{product.cajasAlmacen}
                          </span>
                        )}
                      </div>
                      
                      {nextDate ? (
                         <div className="flex items-center justify-between gap-1.5 bg-gray-50 px-2 h-7 rounded border border-gray-100 w-auto overflow-hidden">
                            <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">A:</span>
                            <span className="font-medium text-gray-700 truncate">{formatDate(nextDate.date)}</span>
                            {nextDate.boxes > 0 && (
                              <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">
                                x{nextDate.boxes}
                              </span>
                            )}
                         </div>
                      ) : (
                        <div></div>
                      )}
                    </>
                  ) : (
                    <>
                      {product.fechaFrente ? (
                        <div className="flex items-center justify-between gap-1.5 bg-gray-50 px-2 h-7 rounded border border-gray-100 w-auto overflow-hidden">
                          <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">F:</span>
                          <span className="font-medium text-gray-700 truncate">{formatDate(product.fechaFrente)}</span>
                        </div>
                      ) : (
                         <div></div>
                      )}
                      {product.fechaAlmacen ? (
                        <div className="flex items-center justify-between gap-1.5 bg-gray-50 px-2 h-7 rounded border border-gray-100 w-auto overflow-hidden">
                          <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">A:</span>
                          <span className="font-medium text-gray-700 truncate">{formatDate(product.fechaAlmacen)}</span>
                          {product.cajasAlmacen > 0 && (
                            <span className="text-[#1d5030] text-xs font-bold flex-shrink-0">
                              x{product.cajasAlmacen}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div></div>
                      )}
                    </>
                  )
              )}
            </div>
          </div>

        </div>
      ) : (
        // VISTA TARJETA (Unified 2-Column Grid)
        <>
          <div className="flex items-center gap-2">
            <span className="font-['Noto Sans'] font-semibold text-gray-700 text-base flex-1 select-none">
              {product.producto?.nombre}
            </span>
            {freshnessLevel > 0 && (
              <div 
                className={`
                  flex items-center justify-center p-1.5 rounded-full ml-2 ring-1
                  ${freshnessLevel === 1 ? "bg-gray-100 ring-gray-200 text-gray-400" : ""}
                  ${freshnessLevel === 2 ? "bg-amber-50 ring-amber-100/50 text-amber-500/80" : ""}
                  ${freshnessLevel === 3 ? "bg-red-50 ring-red-100/50 text-red-500/70" : ""}
                `}
                title="Pendiente de revisar"
              >
                {freshnessLevel === 1 && <Clock size={14} />}
                {freshnessLevel === 2 && <History size={16} />}
                {freshnessLevel === 3 && <History size={16} />}
              </div>
            )}
            
            {/* Indicador de estado (punto) */}
            {/* Indicador de estado (punto) - Siempre renderizado para mantener alineación */}
            <div className={`
              w-2.5 h-2.5 rounded-full flex-shrink-0
              ${getStatusColor() || 'invisible'}
            `} />
          </div>

          {/* Contenido expandible */}
          <div
            className={`
              grid transition-[grid-template-rows] duration-300 ease-out
              ${isSelected ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
            `}
          >
            <div className="overflow-hidden min-h-0">
              <div className="pt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {(() => {
                  // Lógica de Renderizado por Estados
                  const state = product.estado;
                  
                  // Estilo unificado para badges
                  const badgeStyle = "bg-white px-2 py-0.5 rounded shadow-sm flex items-center gap-1 text-xs font-bold text-[#1d5030] border border-gray-100";

                   // Función helper de renderizado
                  const renderColumn = (title, date, badge, isDisabled) => (
                    <div className={`w-full bg-white border border-gray-200 rounded-md overflow-hidden border-l-4 flex flex-col h-full ${
                      isDisabled ? 'border-l-gray-300' : 'border-l-[#1d5030]'
                    }`}>
                      <div className="bg-slate-100 w-full h-9 flex justify-between items-center px-2 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                          {title}
                        </span>
                        {badge && badge}
                      </div>
                      <div className={`p-2 text-center flex-1 flex items-center justify-center min-h-[44px] ${isDisabled ? 'bg-gray-50' : ''}`}>
                        {isDisabled || !date ? (
                          <span className="text-sm font-medium text-gray-400 select-none">
                            --
                          </span>
                        ) : (
                          <div className="text-lg font-bold text-gray-700 leading-tight select-none">
                            {formatDate(date)}
                          </div>
                        )}
                      </div>
                    </div>
                  );

                  // CASE: DIRECT CONSUMPTION
                  if (product.producto?.isDirectConsumption) {
                       // Helper to extract and sort all dates
                       const allDates = [];
                       if (product.fechaAlmacen) {
                           allDates.push({ 
                               date: product.fechaAlmacen, 
                               boxes: product.cajasAlmacen || 0 
                           });
                       }
                       if (product.fechasAlmacen && Array.isArray(product.fechasAlmacen)) {
                           product.fechasAlmacen.forEach(f => {
                               const d = typeof f === 'object' ? f.date : f;
                               const b = typeof f === 'object' ? f.boxes : 1;
                               if (d) allDates.push({ date: d, boxes: b });
                           });
                       }
                       // Sort by date ascending
                       allDates.sort((a, b) => new Date(a.date) - new Date(b.date));

                       if (allDates.length === 0) {
                           return (
                               <div className="col-span-2">
                                   {renderColumn("FECHA DE CADUCIDAD", null, null, true)}
                               </div>
                           );
                       }

                       return (
                           <div className="col-span-2 space-y-2">
                               <div className="bg-slate-100 w-full h-9 flex items-center px-4 rounded-t-md border border-gray-200 border-b-0">
                                   <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">
                                     FECHAS DE CADUCIDAD
                                   </span>
                               </div>
                               <div className="bg-white border border-gray-200 rounded-b-md p-2 space-y-2">
                                   {allDates.map((item, idx) => (
                                       <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-100">
                                            <span className="text-sm font-bold text-gray-700">
                                                {formatDate(item.date)}
                                            </span>
                                            {item.boxes > 0 && (
                                                <div className={badgeStyle}>
                                                    <Package size={12} />
                                                    <span>{item.boxes}</span>
                                                </div>
                                            )}
                                       </div>
                                   ))}
                               </div>
                           </div>
                       );
                  }
                  
                  // Default/Fallbacks
                  let leftDate = product.fechaFrente;
                  let rightDate = product.fechaAlmacen;
                  let leftBadge = null;
                  let rightBadge = null;
                  let rightDisabled = false;
                  
                  // Estilo unificado para badges


                  if (state === 'frente-agota') {
                    // Caso 1: Frente y Agota (Stock solo en frente)
                    rightDate = null;
                    rightDisabled = true;
                  } else if (state === 'abierto-cambia') {
                    // Caso 3: Abierto y Cambia (Hay una caja abierta en almacén entre medias)
                    leftBadge = (
                      <div className={badgeStyle}>
                        <Box size={12} />
                        <span>+1</span>
                      </div>
                    );
                    rightDate = nextDate ? nextDate.date : null; 
                    if (!rightDate) rightDisabled = true; 
                    
                    if (nextDate && nextDate.boxes > 0) {
                        rightBadge = (
                            <div className={badgeStyle}>
                                <Package size={12} />
                                <span>{nextDate.boxes}</span>
                            </div>
                        );
                    }

                  } else if (state === 'abierto-agota') {
                    // Caso 4: Abierto y Agota (Frente coincide con última caja en almacén)
                    rightBadge = (
                      <div className={badgeStyle}>
                        <PackageOpen size={14} />
                      </div>
                    );
                  } else {
                    // Default / frente-cambia
                    // Mostrar badge de stock en almacén si existe
                    if (product.cajasAlmacen > 0) {
                        rightBadge = (
                            <div className={badgeStyle}>
                                <Package size={12} />
                                <span>{product.cajasAlmacen}</span>
                            </div>
                        );
                    }
                  }



                  return (
                    <>
                      {renderColumn("FRENTE", leftDate, leftBadge, false)}
                      {renderColumn("ALMACÉN", rightDate, rightBadge, rightDisabled)}
                    </>
                  );
                })()}
              </div>
              
              {/* Botones */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdateClick(product, e);
                  }}
                  className="flex-1 py-2 text-white rounded-md
                    bg-[#1d5030] hover:bg-[#1d5030]/90
                    transition-colors duration-200
                    font-medium text-sm select-none
                    flex items-center justify-center gap-1.5
                    shadow-sm hover:shadow
                    mr-2"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Actualizar Estado
                </button>
                {(product.estado !== "sin-clasificar" ||
                  product.fechaFrente ||
                  product.fechaAlmacen) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteClick(product, e);
                    }}
                    className="min-w-[48px] h-[40px] flex items-center justify-center
                      text-gray-400 rounded-md
                      hover:text-red-500 hover:bg-red-50
                      transition-colors duration-200
                      active:bg-red-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
});

ProductCard.displayName = "ProductCard";

ProductCard.propTypes = {
  product: PropTypes.shape({
    producto: PropTypes.shape({
      _id: PropTypes.string,
      nombre: PropTypes.string,
    }),
    estado: PropTypes.string,
    fechaFrente: PropTypes.string,
    fechaAlmacen: PropTypes.string,
    fechasAlmacen: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          date: PropTypes.string,
          boxes: PropTypes.number
        })
      ])
    ),
    cajasAlmacen: PropTypes.number,
    cajaUnica: PropTypes.bool,
    hayOtrasFechas: PropTypes.bool,
    updatedAt: PropTypes.string,
  }).isRequired,
  isSelected: PropTypes.bool.isRequired,
  isExpiringSoon: PropTypes.func.isRequired,
  lastUpdatedProductId: PropTypes.string,
  onProductClick: PropTypes.func.isRequired,
  onUpdateClick: PropTypes.func.isRequired,
  onDeleteClick: PropTypes.func.isRequired,
  viewMode: PropTypes.string,
};

export default ProductCard;