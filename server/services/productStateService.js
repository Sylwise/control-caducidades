/**
 * Calcula el estado y las banderas del producto basándose en sus fechas y stock.
 * @param {Object} productData - Objeto con los datos del producto (fechas, cajas, etc.)
 * @returns {Object} - Objeto con los campos calculados (estado, cajaUnica, hayUnicaCajaActual)
 */
const calculateProductStatus = (productData) => {
  const { fechaFrente, fechaAlmacen, cajasAlmacen, fechasAlmacen, estadoActual } = productData;

  // Resultado por defecto (mantiene lo que hay o resetea flags)
  const result = {
    estado: estadoActual || "sin-clasificar",
    cajaUnica: false,
    hayUnicaCajaActual: false
  };

  // 1. Caso base: Si es "sin-clasificar" y no tiene fechas, se queda igual
  if (result.estado === "sin-clasificar" && !fechaFrente && !fechaAlmacen) {
    return result;
  }

  // 2. Si no hay fecha de almacén -> frente-agota
  if (!fechaAlmacen) {
    result.estado = "frente-agota";
    return result;
  }

  // Normalización de fechas (para ignorar horas)
  const frontDate = new Date(fechaFrente).setHours(0, 0, 0, 0);
  const storageDate = new Date(fechaAlmacen).setHours(0, 0, 0, 0);

  // 3. Si las fechas son diferentes -> frente-cambia
  if (frontDate !== storageDate) {
    result.estado = "frente-cambia";
    return result;
  }

  // 4. Si las fechas coinciden (Lógica de cajas)
  if (frontDate === storageDate) {
    const hasMoreDates = fechasAlmacen && fechasAlmacen.length > 0;

    // Caso: Última caja y NO hay más fechas detrás
    if (cajasAlmacen === 1 && !hasMoreDates) {
      result.estado = "abierto-agota";
      result.cajaUnica = true;
    } 
    // Caso: Última caja de esta fecha, pero SÍ hay más fechas detrás
    else if (cajasAlmacen === 1 && hasMoreDates) {
      result.estado = "abierto-cambia";
      result.hayUnicaCajaActual = true;
    } 
    // Caso: Stock suficiente
    else {
      result.estado = "sin-clasificar";
    }
  }

  return result;
};

module.exports = { calculateProductStatus };