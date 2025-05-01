import React from 'react';
import { ChevronUpCircle, CircleCheck, Heart, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingVariant = 'spinner' | 'pulse' | 'dots' | 'wave' | 'heart' | 'success';

interface LoadingProps {
  variant?: LoadingVariant;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  text?: string;
  className?: string;
}

export function Loading({
  variant = 'spinner',
  size = 'md',
  color,
  text,
  className
}: LoadingProps) {
  // Maps size string to actual pixel size
  const sizeMap = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  // Maps size to text size
  const textSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const colorClass = color ? color : 'text-primary';

  // Define different loading variants
  const renderLoadingIndicator = () => {
    switch (variant) {
      case 'spinner':
        return (
          <Loader2 className={cn(sizeMap[size], colorClass, 'animate-spin')} />
        );
      case 'pulse':
        return (
          <div
            className={cn(
              'rounded-full bg-current animate-pulse',
              sizeMap[size],
              colorClass
            )}
          />
        );
      case 'dots':
        return (
          <div className="flex space-x-1">
            <div
              className={cn(
                'rounded-full bg-current animate-bounce',
                size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3',
                colorClass,
                'animation-delay-0'
              )}
            />
            <div
              className={cn(
                'rounded-full bg-current animate-bounce',
                size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3',
                colorClass,
                'animation-delay-100'
              )}
            />
            <div
              className={cn(
                'rounded-full bg-current animate-bounce',
                size === 'sm' ? 'h-1 w-1' : size === 'md' ? 'h-2 w-2' : 'h-3 w-3',
                colorClass,
                'animation-delay-200'
              )}
            />
          </div>
        );
      case 'wave':
        return (
          <div className="flex items-end space-x-1 h-full">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'bg-current animate-wave',
                  size === 'sm' ? 'w-1' : size === 'md' ? 'w-1.5' : 'w-2',
                  colorClass,
                  `animation-delay-${i * 100}`
                )}
                style={{
                  height: `${Math.max(20, 30 + Math.sin(i / 4) * 10)}%`,
                  animationDelay: `${i * 0.1}s`
                }}
              />
            ))}
          </div>
        );
      case 'heart':
        return (
          <Heart 
            className={cn(
              sizeMap[size], 
              colorClass, 
              'animate-pulse'
            )} 
            fill="currentColor" 
          />
        );
      case 'success':
        return (
          <div className="relative">
            <CircleCheck 
              className={cn(
                sizeMap[size], 
                colorClass,
                'animate-success-appear'
              )} 
            />
            <ChevronUpCircle 
              className={cn(
                'absolute top-0 left-0 animate-success-disappear opacity-0',
                sizeMap[size], 
                colorClass
              )} 
            />
          </div>
        );
      default:
        return (
          <Loader2 className={cn(sizeMap[size], colorClass, 'animate-spin')} />
        );
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2',
        className
      )}
    >
      {renderLoadingIndicator()}
      {text && <span className={cn('text-muted-foreground', textSizeMap[size])}>{text}</span>}
    </div>
  );
}

export function FullPageLoading({
  variant = 'spinner',
  size = 'lg',
  color = 'text-primary',
  text = 'Loading...',
  className
}: LoadingProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <Loading
        variant={variant}
        size={size}
        color={color}
        text={text}
        className={className}
      />
    </div>
  );
}

export function LoadingOverlay({
  isLoading,
  children,
  variant = 'spinner',
  text
}: {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: LoadingVariant;
  text?: string;
}) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg z-10">
          <Loading variant={variant} text={text} />
        </div>
      )}
    </div>
  );
}

// Component for skeleton loading states
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
      {...props}
    />
  );
}
