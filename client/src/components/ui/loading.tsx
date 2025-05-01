import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The text to display under the loading spinner
   */
  text?: string;
  /**
   * The variant of the loading animation
   */
  variant?: "pulse" | "wave" | "spinner";
  /**
   * Whether to display the loading animation as a card
   */
  isCard?: boolean;
}

/**
 * A component for displaying loading states with animations
 */
export function Loading({
  text,
  variant = "spinner",
  className,
  isCard = false,
  ...props
}: LoadingProps) {
  const containerClass = cn(
    "flex flex-col items-center justify-center",
    isCard ? "bepo-card" : "p-4",
    className
  );

  const renderLoadingIndicator = () => {
    switch (variant) {
      case "pulse":
        return (
          <div className="flex space-x-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`h-3 w-3 bg-primary rounded-full animate-pulse-delay-${i}`}
              />
            ))}
          </div>
        );
      case "wave":
        return (
          <div className="flex h-10 items-end space-x-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 0.1}s` }}
                className="bg-primary/80 w-2 h-5 rounded-full animate-wave"
              />
            ))}
          </div>
        );
      case "spinner":
      default:
        return (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        );
    }
  };

  return (
    <div className={containerClass} {...props}>
      {renderLoadingIndicator()}
      {text && (
        <p className="mt-3 text-sm text-primary/80 font-medium">{text}</p>
      )}
    </div>
  );
}
