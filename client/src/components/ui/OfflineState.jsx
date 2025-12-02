import React from 'react';
import { WifiOff } from 'lucide-react';

const OfflineState = () => {
  return (
    <div className="w-full max-w-lg mx-auto p-6 flex flex-col items-center justify-center text-center bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm my-8">
      <div className="bg-yellow-100 p-4 rounded-full mb-4">
        <WifiOff className="h-8 w-8 text-yellow-700" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Sin conexión
      </h3>
      <p className="text-gray-600 max-w-md">
        No se puede acceder al módulo de Formaciones mientras no tengas conexión a internet. Por favor, verifica tu red.
      </p>
    </div>
  );
};

export default OfflineState;
