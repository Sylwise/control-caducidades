import { useEffect, useRef } from 'react';
import { useBackButton } from '../contexts/BackButtonContext';

/**
 * Hook to handle hardware back button press.
 * @param {boolean} isOpen - Whether the modal/overlay is currently open/active.
 * @param {Function} onBack - Function to call when back button is pressed.
 * @param {number} priority - Priority of this handler (higher = handles first). DEFAULT: 10.
 * @param {string} id - Optional unique ID. If not provided, one is generated.
 */
const useHardwareBackButton = (isOpen, onBack, priority = 10, id = null) => {
  const { register, unregister } = useBackButton();
  const idRef = useRef(id || `modal-${Math.random().toString(36).substr(2, 9)}`);
  
  // Keep the handler fresh without re-registering
  const handlerRef = useRef(onBack);
  useEffect(() => {
    handlerRef.current = onBack;
  }, [onBack]);

  useEffect(() => {
    const currentId = idRef.current;

    if (isOpen) {
      register(currentId, () => {
        if (handlerRef.current) {
          handlerRef.current();
        }
      }, priority);
    }

    return () => {
      unregister(currentId);
    };
  }, [isOpen, priority, register, unregister]);
};

export default useHardwareBackButton;
