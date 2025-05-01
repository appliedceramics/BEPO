import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from './loading';

/**
 * Props for the ContentSkeleton component
 */
interface ContentSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  lines?: number;
  imageSize?: 'small' | 'medium' | 'large' | 'avatar' | 'none';
  imagePosition?: 'top' | 'left';
  hasAction?: boolean;
  isCard?: boolean;
  lineWidths?: string[];
  rounded?: boolean;
}

/**
 * A skeleton loader for content with customizable lines, image placeholder, and layout
 */
export function ContentSkeleton({
  lines = 3,
  imageSize = 'medium',
  imagePosition = 'left',
  hasAction = false,
  isCard = false,
  lineWidths = [],
  rounded = false,
  className,
  ...props
}: ContentSkeletonProps) {
  // Generate default line widths if none provided
  const generatedLineWidths = lineWidths.length ? 
    lineWidths : 
    Array(lines)
      .fill(0)
      .map((_, i) => {
        // First line is often the title, so make it longer
        if (i === 0) return 'w-3/4';
        
        // Last line is often shorter
        if (i === lines - 1 && lines > 1) return 'w-2/3';
        
        // Random width for others between 60% and 95%
        const randomWidth = Math.floor(Math.random() * 35) + 60;
        return `w-[${randomWidth}%]`;
      });

  // Determine image dimensions based on size
  const getImageDimensions = () => {
    switch (imageSize) {
      case 'small':
        return 'h-12 w-12';
      case 'medium':
        return 'h-24 w-24';
      case 'large':
        return 'h-40 w-full';
      case 'avatar':
        return 'h-10 w-10 rounded-full';
      case 'none':
        return '';
      default:
        return 'h-24 w-24';
    }
  };

  const Container = ({ children }: { children: React.ReactNode }) => (
    <div
      className={cn(
        'animate-pulse',
        isCard ? 'p-4 border rounded-lg bg-card' : '',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );

  if (imagePosition === 'top' && imageSize !== 'none') {
    return (
      <Container>
        {imageSize !== 'none' && (
          <div className="mb-4">
            <Skeleton
              className={cn(
                getImageDimensions(),
                rounded && imageSize !== 'avatar' ? 'rounded-lg' : ''
              )}
            />
          </div>
        )}
        <div className="space-y-2">
          {Array(lines)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                className={cn('h-4', generatedLineWidths[i] || 'w-full')}
              />
            ))}
        </div>
        {hasAction && (
          <div className="mt-4 flex justify-end">
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex gap-4">
        {imageSize !== 'none' && imagePosition === 'left' && (
          <Skeleton
            className={cn(
              getImageDimensions(),
              rounded && imageSize !== 'avatar' ? 'rounded-lg' : ''
            )}
          />
        )}
        <div className="flex-1 space-y-2">
          {Array(lines)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                className={cn('h-4', generatedLineWidths[i] || 'w-full')}
              />
            ))}
          {hasAction && (
            <div className="mt-4 flex justify-end">
              <Skeleton className="h-9 w-20 rounded-md" />
            </div>
          )}
        </div>
      </div>
    </Container>
  );
}

/**
 * A skeleton loader specifically for cards with common card layouts
 */
export function CardSkeleton({
  hasImage = true,
  hasFooter = true,
  lines = 2,
  className,
}: {
  hasImage?: boolean;
  hasFooter?: boolean;
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border bg-card', className)}>
      {hasImage && (
        <Skeleton className="h-48 w-full rounded-t-lg" />
      )}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
          {Array(lines)
            .fill(0)
            .map((_, i) => (
              <Skeleton
                key={i}
                className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')}
              />
            ))}
        </div>
      </div>
      {hasFooter && (
        <div className="border-t p-4 flex justify-between items-center">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      )}
    </div>
  );
}

/**
 * A skeleton loader for a grid of items
 */
export function GridSkeleton({
  columns = 3,
  rows = 2,
  cardProps = {},
  className,
  columnClassName,
}: {
  columns?: number;
  rows?: number;
  cardProps?: Partial<React.ComponentProps<typeof CardSkeleton>>;
  className?: string;
  columnClassName?: string;
}) {
  return (
    <div
      className={cn(
        'grid gap-4',
        {
          'grid-cols-1': columns === 1,
          'grid-cols-2 sm:grid-cols-2': columns === 2,
          'grid-cols-1 sm:grid-cols-2 md:grid-cols-3': columns === 3,
          'grid-cols-2 sm:grid-cols-3 md:grid-cols-4': columns === 4,
          'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5': columns === 5,
          'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6': columns >= 6,
        },
        className
      )}
    >
      {Array(rows * columns)
        .fill(0)
        .map((_, i) => (
          <div key={i} className={columnClassName}>
            <CardSkeleton {...cardProps} />
          </div>
        ))}
    </div>
  );
}

/**
 * A skeleton loader for a data table
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  hasHeader = true,
  hasActions = false,
  className,
}: {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  hasActions?: boolean;
  className?: string;
}) {
  // Calculate column widths based on whether there are actions
  const effectiveColumns = hasActions ? columns - 1 : columns;
  
  return (
    <div className={cn('w-full overflow-hidden', className)}>
      <div className="rounded-md border">
        <div className="relative w-full overflow-auto">
          <table className="w-full caption-bottom text-sm">
            {hasHeader && (
              <thead className="border-b bg-muted/50">
                <tr className="hover:bg-muted/50">
                  {Array(effectiveColumns)
                    .fill(0)
                    .map((_, i) => (
                      <th key={i} className="p-3 text-left align-middle font-medium">
                        <Skeleton className="h-4 w-20" />
                      </th>
                    ))}
                  {hasActions && (
                    <th className="p-3 text-left align-middle font-medium">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </th>
                  )}
                </tr>
              </thead>
            )}
            <tbody>
              {Array(rows)
                .fill(0)
                .map((_, rowIndex) => (
                  <tr key={rowIndex} className="border-b hover:bg-muted/50">
                    {Array(effectiveColumns)
                      .fill(0)
                      .map((_, colIndex) => (
                        <td key={colIndex} className="p-3 align-middle">
                          <Skeleton 
                            className={cn(
                              'h-4',
                              colIndex === 0 ? 'w-28' : 'w-20'
                            )}
                          />
                        </td>
                      ))}
                    {hasActions && (
                      <td className="p-3 align-middle text-right">
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded-md" />
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
