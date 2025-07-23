// src/hooks/useOnClickOutside.js

import { useEffect } from 'react';

/**
 * Hook that alerts when you click outside of the passed ref
 * @param {React.RefObject} ref - Reference to the element to detect clicks outside of
 * @param {Function} handler - Callback function to run when a click outside is detected
 */
export const useOnClickOutside = (ref, handler) => {
  useEffect(() => {
    const listener = (event) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) {
        return;
      }
      
      handler(event);
    };
    
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [ref, handler]);
};