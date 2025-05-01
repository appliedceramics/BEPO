import { useState, useEffect } from 'react';

interface UseDataTransitionOptions {
  /**
   * Duration of the fade out animation in milliseconds
   */
  fadeOutDuration?: number;
  /**
   * Duration to wait before showing new data in milliseconds
   */
  switchDuration?: number;
  /**
   * Duration of the fade in animation in milliseconds
   */
  fadeInDuration?: number;
  /**
   * Whether to disable all transitions (for testing or when transitions are not desired)
   */
  disableTransitions?: boolean;
}

interface UseDataTransitionReturn<T> {
  /**
   * The visible data that should be rendered (may be previous data during transition)
   */
  visibleData: T | null;
  /**
   * Whether the transition is currently in progress
   */
  isTransitioning: boolean;
  /**
   * CSS classes for the transition container
   */
  transitionClasses: string;
}

/**
 * Hook for smooth transitions when data changes
 */
export function useDataTransition<T>(
  data: T | null,
  isLoading: boolean,
  options: UseDataTransitionOptions = {}
): UseDataTransitionReturn<T> {
  const {
    fadeOutDuration = 200,
    switchDuration = 100,
    fadeInDuration = 300,
    disableTransitions = false
  } = options;

  const [visibleData, setVisibleData] = useState<T | null>(data);
  const [previousData, setPreviousData] = useState<T | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'fadeOut' | 'switch' | 'fadeIn'>('idle');

  useEffect(() => {
    if (disableTransitions) {
      setVisibleData(data);
      return;
    }

    // If loading, don't change the visible data yet
    if (isLoading) return;

    // If no data change, do nothing
    if (JSON.stringify(data) === JSON.stringify(visibleData)) return;

    let timeoutId: NodeJS.Timeout;

    if (transitionPhase === 'idle') {
      // Save the current data for transitioning
      setPreviousData(visibleData);
      setIsTransitioning(true);
      setTransitionPhase('fadeOut');

      timeoutId = setTimeout(() => {
        setTransitionPhase('switch');

        timeoutId = setTimeout(() => {
          // Update to the new data
          setVisibleData(data);
          setTransitionPhase('fadeIn');

          timeoutId = setTimeout(() => {
            setIsTransitioning(false);
            setTransitionPhase('idle');
          }, fadeInDuration);
        }, switchDuration);
      }, fadeOutDuration);
    }

    return () => clearTimeout(timeoutId);
  }, [data, visibleData, isLoading, transitionPhase, fadeOutDuration, switchDuration, fadeInDuration, disableTransitions]);

  // Compute classes based on transition phase
  const getTransitionClasses = () => {
    if (disableTransitions) return '';

    switch (transitionPhase) {
      case 'fadeOut':
        return `transition-opacity duration-${fadeOutDuration} opacity-0`;
      case 'switch':
        return 'opacity-0';
      case 'fadeIn':
        return `transition-opacity duration-${fadeInDuration} opacity-100`;
      default:
        return 'opacity-100';
    }
  };

  return {
    visibleData,
    isTransitioning,
    transitionClasses: getTransitionClasses()
  };
}
