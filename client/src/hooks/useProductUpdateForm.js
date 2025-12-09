import { useState, useCallback } from 'react';

export const useProductUpdateForm = ({
  handleUpdateProduct,
  addToast,
  setIsUpdateModalOpen,
  setShowUnclassified,
  setSearchTerm,
  setSelectedProduct,
  scrollToProductId // Función del hook de scroll
}) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    fechaFrente: "",
    fechaAlmacen: "",
    fechaAlmacen2: "",
    fechaAlmacen3: "",
    cajaUnica: false,
    hayUnicaCajaActual: false,
    showSecondDate: false,
    showThirdDate: false,
  });

  const prepareFormForUpdate = useCallback((product, e) => {
    e?.stopPropagation();
    setEditingProduct(product);

    // Extraer fechas adicionales si existen
    const fechas = product.fechasAlmacen || [];
    // fechas es ahora un array de objetos { date, boxes }
    const segundaFechaObj = fechas[0]; // La primera en el array es la segunda en total (fechaAlmacen es la principal)
    const terceraFechaObj = fechas[1];

    setUpdateForm({
      fechaFrente: product.fechaFrente
        ? new Date(product.fechaFrente).toISOString().split("T")[0]
        : "",
      fechaAlmacen:
        product.estado === "frente-agota"
          ? ""
          : product.fechaAlmacen
          ? new Date(product.fechaAlmacen).toISOString().split("T")[0]
          : "",
      cajasAlmacen: product.cajasAlmacen || 1,
      
      fechaAlmacen2: segundaFechaObj?.date
        ? new Date(segundaFechaObj.date).toISOString().split("T")[0]
        : "",
      cajasAlmacen2: segundaFechaObj?.boxes || 1,

      fechaAlmacen3: terceraFechaObj?.date
        ? new Date(terceraFechaObj.date).toISOString().split("T")[0]
        : "",
      cajasAlmacen3: terceraFechaObj?.boxes || 1,

      cajaUnica: product.cajaUnica || false,
      hayUnicaCajaActual: product.hayUnicaCajaActual || false,
      showSecondDate: Boolean(segundaFechaObj),
      showThirdDate: Boolean(terceraFechaObj),
    });

    setIsUpdateModalOpen(true);
  }, [setIsUpdateModalOpen]);

  const submitUpdate = async () => {
    try {
      setIsUpdating(true);

      if (!editingProduct) {
        addToast("No hay producto seleccionado.", "error");
        return;
      }

      const isDirectConsumption = editingProduct.producto?.isDirectConsumption;
      
      if (!updateForm.fechaFrente && !isDirectConsumption) {
        addToast("La fecha de frente es obligatoria.", "error");
        return;
      }

      // Preparar array de fechas de almacén
      const fechasAlmacen = [];
      // La primera fecha va en fechaAlmacen, las siguientes en el array
      if (updateForm.showSecondDate && updateForm.fechaAlmacen2) {
        fechasAlmacen.push({
          date: updateForm.fechaAlmacen2,
          boxes: updateForm.cajasAlmacen2 || 1
        });
      }
      if (updateForm.showThirdDate && updateForm.fechaAlmacen3) {
        fechasAlmacen.push({
          date: updateForm.fechaAlmacen3,
          boxes: updateForm.cajasAlmacen3 || 1
        });
      }

      const hasStorage = !!updateForm.fechaAlmacen;

      const updateData = {
        fechaFrente: updateForm.fechaFrente,
        fechaAlmacen: updateForm.fechaAlmacen || null,
        cajasAlmacen: hasStorage ? (updateForm.cajasAlmacen || 1) : 0,
        fechasAlmacen: fechasAlmacen,
        cajaUnica: Boolean(updateForm.cajaUnica),
        hayUnicaCajaActual: Boolean(updateForm.hayUnicaCajaActual),
        estado: hasStorage ? "frente-cambia" : "frente-agota",
        isDirectConsumption: isDirectConsumption, // Pass flag to service for validation bypass
      };

      const success = await handleUpdateProduct(
        editingProduct.producto._id,
        updateData
      );

      if (success) {
        setIsUpdateModalOpen(false);
        setShowUnclassified(false);
        
        // Guardar el ID antes de limpiar el estado para el scroll
        const updatedProductId = editingProduct.producto._id;
        
        setEditingProduct(null);
        setSelectedProduct(null);
        setSearchTerm("");

        // Usar la función de scroll inyectada
        if (scrollToProductId) {
            scrollToProductId(updatedProductId);
        }
      }
    } catch (error) {
      addToast(`Error al actualizar: ${error.message}.`, "error");
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateForm,
    setUpdateForm,
    editingProduct,
    isUpdating,
    prepareFormForUpdate,
    submitUpdate
  };
};
