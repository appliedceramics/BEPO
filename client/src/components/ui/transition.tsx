import { useState, useEffect, ReactNode } from 'react';
import { Loading } from './loading';
import { cn } from '@/lib/utils';

interface DataTransitionProps {
  isLoading: boolean;
  error: Error | null;
  loadingVariant?: 'pulse' | 'wave' | 'spinner';
  loadingText?: string;
  errorText?: string;
  className?: string;
  children: ReactNode;
}

/**
 * A component for displaying smooth transitions between loading states and content
 */
export function DataTransition({
  isLoading,
  error,
  loadingVariant = 'spinner',
  loadingText,
  errorText = 'An error occurred.',
  className,
  children
}: DataTransitionProps) {
  const [showContent, setShowContent] = useState(!isLoading && !error);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isLoading && !error && !showContent) {
      // Add a small delay before showing content for a smoother transition
      setIsTransitioning(true);
      timer = setTimeout(() => {
        setShowContent(true);
        setIsTransitioning(false);
      }, 300);
    } else if ((isLoading || error) && showContent) {
      setIsTransitioning(true);
      timer = setTimeout(() => {
        setShowContent(false);
        setIsTransitioning(false);
      }, 100);
    }

    return () => clearTimeout(timer);
  }, [isLoading, error, showContent]);

  return (
    <div className={cn('relative transition-opacity duration-300', className)}>
      {(isLoading || error) && (
        <div
          className={cn(
            'transition-opacity duration-300',
            showContent ? 'opacity-0' : 'opacity-100'
          )}
        >
          {isLoading ? (
            <Loading variant={loadingVariant} text={loadingText} />
          ) : (
            <div className="p-4 text-red-600 bg-red-50 rounded-md border border-red-200 text-center">
              <p className="font-medium">{errorText}</p>
              {error && <p className="text-sm mt-1">{error.message}</p>}
            </div>
          )}
        </div>
      )}

      {(showContent || isTransitioning) && (
        <div
          className={cn(
            'transition-opacity duration-300',
            !showContent || isLoading || error ? 'opacity-0' : 'opacity-100'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
