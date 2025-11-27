import { Minus, Plus } from "lucide-react";
import PropTypes from "prop-types";

const QuantitySelector = ({ value, onChange, min = 1, max = 99, disabled = false, className = "" }) => {
  const handleDecrement = (e) => {
    e.stopPropagation();
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = (e) => {
    e.stopPropagation();
    if (value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={`flex items-center bg-gray-50 rounded-lg border border-gray-200 p-1 h-[42px] ${className}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-[#1d5030] hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
      >
        <Minus className="w-4 h-4" />
      </button>
      
      <div className="w-8 flex items-center justify-center font-semibold text-[#1d5030] select-none">
        {value}
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className="w-7 h-full flex items-center justify-center text-gray-500 hover:text-[#1d5030] hover:bg-white rounded-md transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
};

QuantitySelector.propTypes = {
  value: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  min: PropTypes.number,
  max: PropTypes.number,
  disabled: PropTypes.bool,
};

export default QuantitySelector;
