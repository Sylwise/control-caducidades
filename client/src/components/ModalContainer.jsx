import { X } from "lucide-react";
import PropTypes from "prop-types";
import { createPortal } from "react-dom";

const ModalContainer = ({
  isOpen,
  isClosing = false,
  onClose,
  title,
  children,
  showHeader = true,
  containerClassName = "",
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className={`
        fixed inset-0 z-[70] flex items-center justify-center p-4
        ${isClosing ? "animate-fade-out" : "animate-fade-in"}
      `}
      onClick={onClose}
      data-modal-backdrop
    >
      <div className="fixed inset-0 bg-black/50 transition-opacity duration-300" />
      <div
        className={`
          relative w-full max-w-md
          bg-white rounded-2xl shadow-xl overflow-hidden
          min-h-[200px] max-h-[90vh]
          flex flex-col z-10
          ${isClosing ? "animate-slide-up" : "animate-slide-down"}
          transition-all duration-300 ease-out
          ${containerClassName}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {showHeader && (
          <div className="flex-none sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1d5030] select-none">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

ModalContainer.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  isClosing: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  children: PropTypes.node.isRequired,
  showHeader: PropTypes.bool,
  containerClassName: PropTypes.string,
};

export default ModalContainer;
