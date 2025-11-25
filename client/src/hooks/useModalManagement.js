import { useState, useCallback } from "react";
import { MODAL_ANIMATION_DURATION } from "../constants/productConstants";

export const useModalManagement = () => {
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isExpiringModalOpen, setIsExpiringModalOpen] = useState(false);
  const [showUnclassified, setShowUnclassified] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [showCatalogManagement, setShowCatalogManagement] = useState(false);

  // Estados para las animaciones de cierre
  const [isClosingUnclassified, setIsClosingUnclassified] = useState(false);
  const [isClosingUpdateModal, setIsClosingUpdateModal] = useState(false);
  const [isClosingExpiringModal, setIsClosingExpiringModal] = useState(false);

  const handleCloseUnclassified = useCallback(() => {
    setIsClosingUnclassified(true);
    setTimeout(() => {
      setShowUnclassified(false);
      setIsClosingUnclassified(false);
      document.body.style.overflow = "";
    }, MODAL_ANIMATION_DURATION);
  }, []);

  const handleCloseUpdateModal = useCallback(() => {
    setIsClosingUpdateModal(true);
    setTimeout(() => {
      setIsUpdateModalOpen(false);
      setIsClosingUpdateModal(false);
      document.body.style.overflow = "";
    }, MODAL_ANIMATION_DURATION);
  }, []);

  const handleCloseExpiringModal = useCallback(() => {
    setIsClosingExpiringModal(true);
    setTimeout(() => {
      setIsExpiringModalOpen(false);
      setIsClosingExpiringModal(false);
    }, MODAL_ANIMATION_DURATION);
  }, []);

  return {
    // Estados de los modales
    isUpdateModalOpen,
    isExpiringModalOpen,
    showUnclassified,
    isUserManagementOpen,
    showCatalogManagement,

    // Estados de animaciones
    isClosingUnclassified,
    isClosingUpdateModal,
    isClosingExpiringModal,

    // Setters
    setIsUpdateModalOpen,
    setIsExpiringModalOpen,
    setShowUnclassified,
    setIsUserManagementOpen,
    setShowCatalogManagement,

    // Handlers
    handleCloseUnclassified,
    handleCloseUpdateModal,
    handleCloseExpiringModal,
  };
};
