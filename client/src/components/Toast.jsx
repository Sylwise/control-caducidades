import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import PropTypes from "prop-types";

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: AlertCircle,
};

const colors = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-blue-500",
};

const Toast = ({ message, type = "info", onClose }) => {
  const Icon = icons[type];

  return (
    <div
      className={`${colors[type]} text-white p-4 rounded-lg shadow-lg 
      flex items-center justify-between gap-3 animate-slide-in`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "info"]),
  onClose: PropTypes.func.isRequired,
};

Toast.defaultProps = {
  type: "info",
};

export default Toast;
