import { cn } from '@/lib/utils';

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
  lineWidths,
  rounded = false,
  className,
  ...props
}: ContentSkeletonProps) {
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

  // Generate random widths for lines if not provided
  const getLineWidth = (index: number) => {
    if (lineWidths && lineWidths[index]) {
      return lineWidths[index];
    }

    // Last line is shorter
    if (index === lines - 1) {
      return 'w-2/3';
    }

    // Other lines random between 70% and 100%
    const randomWidth = Math.floor(Math.random() * 30) + 70;
    return `w-[${randomWidth}%]`;
  };

  const renderLines = () => {
    return Array.from({ length: lines }).map((_, index) => (
      <div
        key={index}
        className={cn(
          'h-4 bg-gray-200 animate-pulse rounded',
          getLineWidth(index),
          index !== 0 && 'mt-2'
        )}
      />
    ));
  };

  const renderImage = () => {
    if (imageSize === 'none') return null;
    return (
      <div
        className={cn(
          'bg-gray-200 animate-pulse',
          getImageDimensions(),
          rounded && (imageSize === 'small' || imageSize === 'medium' || imageSize === 'large') && 'rounded-md'
        )}
      />
    );
  };

  const renderAction = () => {
    if (!hasAction) return null;
    return (
      <div className="h-9 w-24 bg-gray-200 animate-pulse rounded-md mt-4" />
    );
  };

  const wrapperClasses = cn(
    'flex',
    isCard && 'p-4 border rounded-lg shadow-sm',
    imagePosition === 'top' ? 'flex-col' : 'items-start',
    className
  );

  const contentClasses = cn(
    'flex flex-col',
    imagePosition === 'left' && 'ml-4',
    imagePosition === 'top' && 'mt-4',
    imageSize !== 'none' ? 'flex-1' : 'w-full'
  );

  return (
    <div className={wrapperClasses} {...props}>
      {renderImage()}
      <div className={contentClasses}>
        {renderLines()}
        {renderAction()}
      </div>
    </div>
  );
}

/**
 * A skeleton loader specifically for cards with common card layouts
 */
export function CardSkeleton({
  hasImage = true,
  hasAction = true,
  lines = 3,
  className,
  ...props
}: {
  hasImage?: boolean;
  hasAction?: boolean;
  lines?: number;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <ContentSkeleton
      isCard
      rounded
      lines={lines}
      imageSize={hasImage ? 'medium' : 'none'}
      hasAction={hasAction}
      className={className}
      {...props}
    />
  );
}

/**
 * A skeleton loader for a grid of items
 */
export function GridSkeleton({
  columns = 3,
  rows = 2,
  gap = 4,
  itemProps,
  className,
  ...props
}: {
  columns?: number;
  rows?: number;
  gap?: number;
  itemProps?: ContentSkeletonProps;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        `grid grid-cols-1 sm:grid-cols-2 md:grid-cols-${columns} gap-${gap}`,
        className
      )}
      {...props}
    >
      {Array.from({ length: rows * columns }).map((_, i) => (
        <CardSkeleton key={i} {...itemProps} />
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
  className,
  ...props
}: {
  rows?: number;
  columns?: number;
  hasHeader?: boolean;
  className?: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border rounded-md overflow-hidden', className)}
      {...props}
    >
      <div className="min-w-full divide-y divide-gray-200">
        {hasHeader && (
          <div className="bg-gray-100">
            <div className="flex">
              {Array.from({ length: columns }).map((_, i) => (
                <div key={`header-${i}`} className="px-4 py-3 flex-1">
                  <div className="h-4 bg-gray-200 animate-pulse rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={`row-${rowIndex}`} className="flex">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="px-4 py-3 flex-1"
                >
                  <div
                    className={cn(
                      'h-4 bg-gray-200 animate-pulse rounded',
                      Math.random() > 0.5 ? 'w-full' : 'w-2/3'
                    )}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
