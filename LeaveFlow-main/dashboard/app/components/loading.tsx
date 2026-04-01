/**
 * Shared Loading Component
 * Provides consistent loading UI across the application
 */

interface LoadingProps {
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function Loading({ text = "Loading...", fullScreen = false, className = "" }: LoadingProps) {
  const baseClasses = "flex items-center justify-center text-muted-foreground";
  const fullScreenClasses = fullScreen ? "py-20" : "py-8";
  
  return (
    <div className={`${baseClasses} ${fullScreenClasses} ${className}`}>
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p>{text}</p>
      </div>
    </div>
  );
}

/**
 * Error Display Component
 * Provides consistent error UI across the application
 */

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorMessage({ message, onRetry, className = "" }: ErrorMessageProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
      <div className="text-center max-w-md">
        <p className="text-xl mb-2">⚠️</p>
        <p className="text-red-600 font-medium mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn btn-primary"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}
