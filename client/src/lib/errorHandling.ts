import { toast } from "@/hooks/use-toast";

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface RetryableOperation<T> {
  operation: () => Promise<T>;
  operationName: string;
  isIdempotent?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

const RETRYABLE_ERROR_CODES = [
  'RATE_LIMIT_EXCEEDED',
  'UPLOAD_FAILED',
  'EXTERNAL_SERVICE_ERROR',
  'SERVICE_UNAVAILABLE',
];

export function isRetryableError(error: any): boolean {
  if (error?.error?.code && RETRYABLE_ERROR_CODES.includes(error.error.code)) {
    return true;
  }
  
  if (error?.status === 429 || error?.status === 503) {
    return true;
  }
  
  return false;
}

export function getErrorMessage(error: any): string {
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
}

export function getErrorCode(error: any): string | undefined {
  return error?.error?.code;
}

export function getRetryAfter(error: any): number | undefined {
  if (error?.headers?.['retry-after']) {
    return parseInt(error.headers['retry-after'], 10);
  }
  
  if (error?.error?.details?.retryAfter) {
    return error.error.details.retryAfter;
  }
  
  return undefined;
}

export async function executeWithRetry<T>({
  operation,
  operationName,
  isIdempotent = false,
  maxRetries = 3,
  retryDelay = 1000,
}: RetryableOperation<T>): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      const canRetry = isIdempotent && isRetryableError(error);
      const isLastAttempt = attempt === maxRetries;
      
      if (!canRetry || isLastAttempt) {
        throw error;
      }
      
      const retryAfter = getRetryAfter(error);
      const delay = retryAfter ? retryAfter * 1000 : retryDelay * Math.pow(2, attempt);
      
      toast({
        title: "Retrying...",
        description: `${operationName} failed. Retrying in ${Math.ceil(delay / 1000)}s...`,
        variant: "default",
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export function showErrorToast(error: any, retryAction?: React.ReactElement) {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);
  
  const description = code ? `${message} (${code})` : message;
  
  toast({
    title: "Error",
    description,
    variant: "destructive",
    action: retryAction,
  });
}

export function handleMutationError(error: any, operationName: string, retryAction?: React.ReactElement) {
  showErrorToast(error, retryAction);
}
