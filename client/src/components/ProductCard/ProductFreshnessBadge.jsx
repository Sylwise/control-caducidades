import React from 'react';
import PropTypes from 'prop-types';
import { Clock, History } from 'lucide-react';

const ProductFreshnessBadge = ({ freshnessLevel, className = "" }) => {
  if (freshnessLevel <= 0) return null;

  return (
    <div 
      className={`
        flex items-center justify-center p-1.5 rounded-full flex-shrink-0 ring-1
        ${freshnessLevel === 1 ? "bg-gray-100 ring-gray-200 text-gray-400" : ""}
        ${freshnessLevel === 2 ? "bg-amber-50 ring-amber-100/50 text-amber-500/80" : ""}
        ${freshnessLevel === 3 ? "bg-red-50 ring-red-100/50 text-red-500/70" : ""}
        ${className}
      `}
      title={freshnessLevel === 1 ? "Reciente" : freshnessLevel === 2 ? "Antiguo" : "Abandonado"}
    >
      {freshnessLevel === 1 && <Clock size={12} />}
      {freshnessLevel === 2 && <History size={14} />}
      {freshnessLevel === 3 && <History size={14} />}
    </div>
  );
};

ProductFreshnessBadge.propTypes = {
  freshnessLevel: PropTypes.number.isRequired,
  className: PropTypes.string,
};

export default ProductFreshnessBadge;
