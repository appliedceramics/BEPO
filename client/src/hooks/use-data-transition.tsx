import { useState, useEffect } from 'react';

/**
 * Hook for handling transition states when data changes
 * @param data The data to watch for changes
 * @param options Configuration options
 * @returns Transition state and the data to display
 */
export function useDataTransition<T>(
  data: T | undefined,
  options: {
    /**
     * Duration of the transition in milliseconds
     * @default 300
     */
    duration?: number;
    
    /**
     * Whether to show transition when data first loads
     * @default true
     */
    transitionOnMount?: boolean;
    
    /**
     * Whether to show loading state when data is undefined
     * @default true
     */
    showLoadingOnUndefined?: boolean;
    
    /**
     * Custom function to compare previous and current data to determine if data has changed
     * By default, uses JSON.stringify for comparison
     */
    compareData?: (prevData: T | undefined, newData: T | undefined) => boolean;
  } = {}
) {
  const {
    duration = 300,
    transitionOnMount = true,
    showLoadingOnUndefined = true,
    compareData = (prev, next) => JSON.stringify(prev) === JSON.stringify(next),
  } = options;
  
  // Previous data used for transitions
  const [prevData, setPrevData] = useState<T | undefined>(undefined);
  
  // Data to display (may be previous data during transition)
  const [displayData, setDisplayData] = useState<T | undefined>(data);
  
  // State for transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Whether the component has mounted
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    // If this is the first render, mark as mounted
    if (!hasMounted) {
      setHasMounted(true);
      return;
    }

    // If data is the same as previous, no need to transition
    if (compareData(prevData, data)) {
      return;
    }
    
    // Start transition
    setIsTransitioning(true);
    
    // Store previous data for animation
    if (data !== undefined) {
      setPrevData(data);
    }
    
    // Update the display data after the transition duration
    const timer = setTimeout(() => {
      setDisplayData(data);
      setIsTransitioning(false);
    }, duration);
    
    return () => clearTimeout(timer);
  }, [data, duration, compareData, prevData, hasMounted]);
  
  // Handle initial mount
  useEffect(() => {
    if (!transitionOnMount) {
      setDisplayData(data);
    }
  }, [transitionOnMount, data]);
  
  const isLoading = showLoadingOnUndefined && data === undefined;
  
  return {
    isTransitioning,
    isLoading,
    displayData: isTransitioning ? prevData : displayData,
    hasData: displayData !== undefined,
  };
}
