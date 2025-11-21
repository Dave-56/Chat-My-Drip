export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number) => void;
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export const isNetworkError = (error: unknown): boolean => {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  if (error instanceof Error) {
    return (
      error.message.includes('network') ||
      error.message.includes('Network') ||
      error.message.includes('Failed to fetch') ||
      error.message.includes('timeout')
    );
  }
  return false;
};

export const isRetryableError = (error: unknown): boolean => {
  if (error instanceof RetryableError) {
    return error.retryable;
  }
  return isNetworkError(error);
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | unknown;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Call retry callback
      if (onRetry) {
        onRetry(attempt + 1);
      }

      // Wait before retrying with exponential backoff
      await sleep(Math.min(delay, maxDelay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
};

export const createErrorHandler = (onError: (error: Error) => void) => {
  return (error: unknown) => {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    const errorObj = error instanceof Error ? error : new Error(errorMessage);
    onError(errorObj);
  };
};

