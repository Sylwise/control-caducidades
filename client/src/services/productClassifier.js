/**
 * Estados posibles de un producto
 */
export const PRODUCT_STATES = {
  SIN_CLASIFICAR: "sin-clasificar",
  FRENTE_AGOTA: "frente-agota",
  FRENTE_CAMBIA: "frente-cambia",
  ABIERTO_CAMBIA: "abierto-cambia",
  ABIERTO_AGOTA: "abierto-agota",
};

/**
 * Clasifica un producto basado en sus fechas y estado
 * Esta función replica la lógica exacta del servidor
 */
export function classifyProduct({
  fechaFrente,
  fechaAlmacen,
  fechasAlmacen = [],
  cajaUnica = false,
  hayUnicaCajaActual = false,
}) {
  // Validar fechas requeridas
  if (!fechaFrente) {
    throw new Error("La fecha de frente es requerida");
  }

  // Si no hay fecha de almacén, es "frente-agota"
  if (!fechaAlmacen) {
    return PRODUCT_STATES.FRENTE_AGOTA;
  }

  // Convertir fechas a timestamps para comparación
  const frontDate = new Date(fechaFrente).setHours(0, 0, 0, 0);
  const storageDate = new Date(fechaAlmacen).setHours(0, 0, 0, 0);

  // Si las fechas son diferentes, es "frente-cambia"
  if (frontDate !== storageDate) {
    return PRODUCT_STATES.FRENTE_CAMBIA;
  }

  // Si las fechas coinciden
  if (frontDate === storageDate) {
    if (cajaUnica) {
      return PRODUCT_STATES.ABIERTO_AGOTA;
    } else if (fechasAlmacen && fechasAlmacen.length > 0 && hayUnicaCajaActual) {
      // Solo es "abierto-cambia" si hay solo una caja de la fecha actual 
      // y hay otras fechas diferentes en almacén
      return PRODUCT_STATES.ABIERTO_CAMBIA;
    } else {
      return PRODUCT_STATES.SIN_CLASIFICAR;
    }
  }

  // Por defecto, sin clasificar
  return PRODUCT_STATES.SIN_CLASIFICAR;
}

/**
 * Valida los datos de un producto antes de clasificarlo
 */
export function validateProductData(data) {
  const errors = [];

  // Validar fecha de frente
  if (!data.fechaFrente) {
    errors.push("La fecha de frente es requerida");
  } else if (isNaN(new Date(data.fechaFrente).getTime())) {
    errors.push("La fecha de frente no es válida");
  }

  // Validar fecha de almacén si existe
  if (data.fechaAlmacen && isNaN(new Date(data.fechaAlmacen).getTime())) {
    errors.push("La fecha de almacén no es válida");
  }

  // Validar fechas adicionales de almacén
  if (data.fechasAlmacen) {
    if (!Array.isArray(data.fechasAlmacen)) {
      errors.push("Las fechas de almacén deben ser un array");
    } else {
      data.fechasAlmacen.forEach((fecha, index) => {
        if (isNaN(new Date(fecha).getTime())) {
          errors.push(`La fecha de almacén #${index + 1} no es válida`);
        }
      });
    }
  }

  // Validar caja única
  if (
    typeof data.cajaUnica !== "undefined" &&
    typeof data.cajaUnica !== "boolean"
  ) {
    errors.push("El campo cajaUnica debe ser un booleano");
  }

  // Validar hayUnicaCajaActual
  if (
    typeof data.hayUnicaCajaActual !== "undefined" &&
    typeof data.hayUnicaCajaActual !== "boolean"
  ) {
    errors.push("El campo hayUnicaCajaActual debe ser un booleano");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Procesa y clasifica un producto, incluyendo validación
 */
export function processProduct(data) {
  // Validar datos
  const validation = validateProductData(data);
  if (!validation.isValid) {
    throw new Error(validation.errors.join(", "));
  }

  // Clasificar producto
  const estado = classifyProduct(data);

  // Retornar objeto completo
  return {
    ...data,
    estado,
  };
}

/**
 * Compara la clasificación local con la del servidor para detectar discrepancias
 */
export function compareClassifications(localResult, serverResult) {
  const differences = [];

  if (localResult.estado !== serverResult.estado) {
    differences.push({
      field: "estado",
      local: localResult.estado,
      server: serverResult.estado,
    });
  }

  return {
    match: differences.length === 0,
    differences,
  };
}
