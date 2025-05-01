import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Loading } from './loading';

interface TransitionProps {
  show: boolean;
  children: React.ReactNode;
  /** Transition type for when the component enters the DOM */
  enter?: 'fade' | 'slide-up' | 'slide-down' | 'scale';
  /** Transition type for when the component leaves the DOM */
  exit?: 'fade' | 'slide-up' | 'slide-down' | 'scale';
  /** Duration of the transition in milliseconds */
  duration?: number;
  /** Delay before the transition starts in milliseconds */
  delay?: number;
  /** Class names to apply to the transition container */
  className?: string;
  /** Whether the component should be removed from the DOM after the exit transition */
  unmountOnExit?: boolean;
  /** Whether to show a loading state during data fetching */
  isLoading?: boolean;
  /** Text to display during loading */
  loadingText?: string;
  /** Variant of loading indicator */
  loadingVariant?: 'spinner' | 'pulse' | 'dots' | 'wave' | 'heart' | 'success';
}

/**
 * Transition component that animates elements entering and exiting the DOM
 */
export const Transition = ({
  show = true,
  children,
  enter = 'fade',
  exit = 'fade',
  duration = 300,
  delay = 0,
  className,
  unmountOnExit = true,
  isLoading = false,
  loadingText,
  loadingVariant = 'spinner'
}: TransitionProps) => {
  const [shouldRender, setShouldRender] = useState(show);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (show) {
      setShouldRender(true);
      setIsAnimating(true);
    } else {
      setIsAnimating(true);
      timeout = setTimeout(() => {
        setIsAnimating(false);
        if (unmountOnExit) {
          setShouldRender(false);
        }
      }, duration);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [show, duration, unmountOnExit]);

  if (!shouldRender) return null;

  // Map transition types to TailwindCSS classes
  const enterClasses = {
    fade: 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'slide-down': 'animate-slide-down',
    scale: 'animate-scale-in',
  };

  const exitClasses = {
    fade: 'animate-fade-out',
    'slide-up': 'animate-slide-down', // Reversed for exit
    'slide-down': 'animate-slide-up', // Reversed for exit
    scale: 'animate-scale-out',
  };

  const style = {
    animationDuration: `${duration}ms`,
    animationDelay: delay ? `${delay}ms` : undefined,
  };

  const activeClass = show ? enterClasses[enter] : exitClasses[exit];

  return (
    <div
      className={cn(
        activeClass,
        isAnimating ? 'pointer-events-none' : '',
        className
      )}
      style={style}
      onAnimationEnd={() => setIsAnimating(false)}
    >
      {isLoading ? (
        <div className="flex justify-center items-center py-4">
          <Loading variant={loadingVariant} text={loadingText} />
        </div>
      ) : (
        children
      )}
    </div>
  );
};

/**
 * Transition group that animates a list of items entering and exiting the DOM
 */
export const TransitionGroup = ({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('transition-group', className)}>
      {children}
    </div>
  );
};

/**
 * Data transition component that handles loading states and animations for data fetching
 */
export const DataTransition = ({
  isLoading,
  error,
  children,
  loadingText = 'Loading data...',
  loadingVariant = 'spinner',
  errorComponent,
  className
}: {
  isLoading: boolean;
  error?: Error | null;
  children: React.ReactNode;
  loadingText?: string;
  loadingVariant?: 'spinner' | 'pulse' | 'dots' | 'wave' | 'heart' | 'success';
  errorComponent?: React.ReactNode;
  className?: string;
}) => {
  // If there's an error, show the error component
  if (error && errorComponent) {
    return <div className={className}>{errorComponent}</div>;
  }

  return (
    <Transition
      show={true}
      enter="fade"
      isLoading={isLoading}
      loadingText={loadingText}
      loadingVariant={loadingVariant}
      className={className}
    >
      {!isLoading && children}
    </Transition>
  );
};
