// API Error Handling Utilities

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function handleApiError(error: any): string {
  // Network errors
  if (!error.response) {
    if (error.message === "Network Error" || error.code === "ERR_NETWORK") {
      return "Cannot connect to server. Please check your internet connection.";
    }
    return "Network error. Please try again.";
  }

  // HTTP errors
  const status = error.response?.status;
  const data = error.response?.data;

  switch (status) {
    case 400:
      return data?.detail || "Invalid request. Please check your input.";
    
    case 401:
      return "Your session has expired. Please log in again.";
    
    case 403:
      return "You don't have permission to perform this action.";
    
    case 404:
      return data?.detail || "The requested resource was not found.";
    
    case 409:
      return data?.detail || "This action conflicts with existing data.";
    
    case 422:
      // Validation errors - format nicely
      if (data?.detail && Array.isArray(data.detail)) {
        const errors = data.detail
          .map((err: any) => {
            const field = err.loc?.join(" > ") || "Unknown field";
            return `${field}: ${err.msg}`;
          })
          .join(", ");
        return `Validation error: ${errors}`;
      }
      return data?.detail || "Validation error. Please check your input.";
    
    case 500:
      return "Server error. Please try again later.";
    
    case 503:
      return "Service temporarily unavailable. Please try again.";
    
    default:
      return data?.detail || error.message || "An unexpected error occurred.";
  }
}

export function isAuthError(error: any): boolean {
  return error.response?.status === 401;
}

export function isValidationError(error: any): boolean {
  return error.response?.status === 422;
}

export function isNetworkError(error: any): boolean {
  return !error.response || error.code === "ERR_NETWORK";
}

// Retry logic for failed requests
export async function retryRequest<T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on client errors (4xx) except 408 (timeout)
      const status = error.response?.status;
      if (status && status >= 400 && status < 500 && status !== 408) {
        throw error;
      }

      // Don't retry if this is the last attempt
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError;
}

// Toast notification helper (can integrate with toast library)
export function showErrorToast(error: any) {
  const message = handleApiError(error);
  console.error("API Error:", message, error);
  
  // Can integrate with react-hot-toast or similar
  // toast.error(message);
  
  return message;
}

// Loading state manager
export class LoadingManager {
  private loading: Set<string> = new Set();
  private listeners: ((keys: string[]) => void)[] = [];

  start(key: string) {
    this.loading.add(key);
    this.notify();
  }

  stop(key: string) {
    this.loading.delete(key);
    this.notify();
  }

  isLoading(key: string): boolean {
    return this.loading.has(key);
  }

  hasAnyLoading(): boolean {
    return this.loading.size > 0;
  }

  private notify() {
    const keys = Array.from(this.loading);
    this.listeners.forEach(listener => listener(keys));
  }

  subscribe(listener: (keys: string[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
}

export const globalLoadingManager = new LoadingManager();
