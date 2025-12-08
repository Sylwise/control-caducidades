import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

const BackButtonContext = createContext(null);

export const useBackButton = () => {
  const context = useContext(BackButtonContext);
  if (!context) {
    throw new Error('useBackButton must be used within a BackButtonProvider');
  }
  return context;
};

export const BackButtonProvider = ({ children }) => {
  const [stack, setStack] = useState([]);
  const isHandlingBackRef = useRef(false);
  // Nuevo ref para ignorar eventos popstate que nosotros mismos provocamos
  const shouldIgnorePopStateRef = useRef(false);

  // Debug helper
  useEffect(() => {
    console.log('[BackButton] Stack updated:', stack.map(s => s.id));
  }, [stack]);

  const removeHandler = useCallback((id) => {
    setStack(prev => prev.filter(item => item.id !== id));
  }, []);

  const register = useCallback((id, handler, priority = 10) => {
    // Check if we already have this ID registered to prevent duplicates
    // We check stackRef (synchronous) so we don't depend on async state
    if (stackRef.current.find(item => item.id === id)) {
      console.log('[BackButton] Register ignored (duplicate):', id);
      return;
    }

    console.log('[BackButton] Registering:', id);

    // Push state to browser history to capture the back button
    // Only if we are not currently handling a back action
    if (!isHandlingBackRef.current) {
      window.history.pushState({ modalId: id }, '', window.location.href);
    }

    setStack(prev => {
      // Avoid duplicates (double check inside updater)
      if (prev.find(item => item.id === id)) return prev;

      const newItem = { id, handler, priority };
      // Sort by priority (asc), then by insertion order (newer first)
      const newStack = [...prev, newItem].sort((a, b) => {
        if (a.priority !== b.priority) return a.priority - b.priority; 
        return 0; 
      });
      return newStack;
    });
  }, []);

  const unregister = useCallback((id) => {
    // 1. Remove from our internal stack immediately
    setStack(prev => {
      const newStack = prev.filter(item => item.id !== id);
      console.log('[BackButton] Unregistering:', id, 'New Stack:', newStack.map(i => i.id));
      return newStack;
    });
    
    // 2. Check if we need to clean up the browser history
    if (!isHandlingBackRef.current && window.history.state?.modalId === id) {
      console.log('[BackButton] Manual close detected for tip of history. Popping state... Target ID:', id);
      
      shouldIgnorePopStateRef.current = true;
      window.history.back();
    } else {
      console.log('[BackButton] Unregister (Manual) but NO history pop.', {
        isHandlingBack: isHandlingBackRef.current,
        historyState: window.history.state,
        targetId: id
      });
    }
  }, []);

  // Correct Event Listener Implementation
  const stackRef = useRef(stack);
  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  useEffect(() => {
    const handlePopState = (event) => {
      console.log('[BackButton] PopState detected. State:', event.state, 'IgnoreFlag:', shouldIgnorePopStateRef.current);

      // If we triggered this popstate manually (in unregister), ignore it.
      if (shouldIgnorePopStateRef.current) {
        console.log('[BackButton] Ignoring self-triggered popstate.');
        shouldIgnorePopStateRef.current = false;
        return;
      }

      isHandlingBackRef.current = true;
      
      const currentStack = stackRef.current;
      console.log('[BackButton] Handling PopState. Current Stack:', currentStack.map(s => s.id));
      
      // If we have items in our stack, we want to close the top one.
      if (currentStack.length > 0) {
        const candidate = currentStack[currentStack.length - 1];

        if (candidate) {
          console.log('[BackButton] Intercepting for:', candidate.id);
          candidate.handler();
        }
      } else {
        console.log('[BackButton] Stack empty, no interception.');
      }
      
      setTimeout(() => {
        isHandlingBackRef.current = false;
      }, 50);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <BackButtonContext.Provider value={{ register, unregister }}>
      {children}
    </BackButtonContext.Provider>
  );
};

BackButtonProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
