import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils/cn';
import { AlertCircle, XCircle } from 'lucide-react';

export interface ErrorMessageProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  message?: string;
  variant?: 'inline' | 'banner' | 'card';
  onDismiss?: () => void;
}

const ErrorMessage = forwardRef<HTMLDivElement, ErrorMessageProps>(
  (
    {
      className,
      title = 'Error',
      message,
      variant = 'inline',
      onDismiss,
      children,
      ...props
    },
    ref
  ) => {
    const content = children || message;

    const variants = {
      inline: 'flex items-start gap-2 p-3 text-sm',
      banner: 'flex items-start gap-3 p-4',
      card: 'flex flex-col gap-2 p-6 rounded-lg shadow-md',
    };

    return (
      <div
        ref={ref}
        role="alert"
        aria-live="polite"
        className={cn(
          'bg-red-50 border border-red-200 text-red-800 rounded-md dark:bg-red-900/20 dark:border-red-900 dark:text-red-300',
          variants[variant],
          className
        )}
        {...props}
      >
        <AlertCircle
          className={cn(
            'flex-shrink-0 text-red-600 dark:text-red-400',
            variant === 'card' ? 'h-6 w-6' : 'h-5 w-5'
          )}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          {title && (
            <h3
              className={cn(
                'font-semibold',
                variant === 'card' ? 'text-lg mb-1' : 'text-sm'
              )}
            >
              {title}
            </h3>
          )}
          {content && (
            <div className={cn(variant === 'card' ? 'text-base' : 'text-sm')}>
              {content}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
            aria-label="Dismiss error"
          >
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          </button>
        )}
      </div>
    );
  }
);

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;
