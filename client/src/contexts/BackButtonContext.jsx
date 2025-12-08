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
  const shouldIgnorePopStateRef = useRef(false);

  const removeHandler = useCallback((id) => {
    setStack(prev => prev.filter(item => item.id !== id));
  }, []);

  const register = useCallback((id, handler, priority = 10) => {
    // Check if we already have this ID registered to prevent duplicates
    if (stackRef.current.find(item => item.id === id)) {
      return;
    }

    // Push state to browser history to capture the back button
    if (!isHandlingBackRef.current) {
      window.history.pushState({ modalId: id }, '', window.location.href);
    }

    setStack(prev => {
      if (prev.find(item => item.id === id)) return prev;

      const newItem = { id, handler, priority };
      // Sort by priority (asc), then by insertion order
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
      return newStack;
    });
    
    // 2. Check if we need to clean up the browser history
    if (!isHandlingBackRef.current && window.history.state?.modalId === id) {
      shouldIgnorePopStateRef.current = true;
      window.history.back();
    }
  }, []);

  // Correct Event Listener Implementation
  const stackRef = useRef(stack);
  useEffect(() => {
    stackRef.current = stack;
  }, [stack]);

  useEffect(() => {
    const handlePopState = (event) => {
      // If we triggered this popstate manually (in unregister), ignore it.
      if (shouldIgnorePopStateRef.current) {
        shouldIgnorePopStateRef.current = false;
        return;
      }

      isHandlingBackRef.current = true;
      
      const currentStack = stackRef.current;
      
      // If we have items in our stack, we want to close the top one.
      if (currentStack.length > 0) {
        const candidate = currentStack[currentStack.length - 1];

        if (candidate) {
          candidate.handler();
        }
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
