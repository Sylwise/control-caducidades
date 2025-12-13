import React from 'react';
import PropTypes from 'prop-types';

const ProductStatusIndicator = ({ bgColorClass }) => {
  if (!bgColorClass) return null;

  return (
    <div className={`
      w-2.5 h-2.5 rounded-full flex-shrink-0
      ${bgColorClass}
    `} />
  );
};

ProductStatusIndicator.propTypes = {
  bgColorClass: PropTypes.string,
};

export default ProductStatusIndicator;
