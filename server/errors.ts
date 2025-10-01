import { Response } from 'express';

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resources
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  
  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // External Services
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  
  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export const ErrorMessages: Record<string, string> = {
  [ErrorCodes.UNAUTHORIZED]: 'You must be logged in to perform this action',
  [ErrorCodes.FORBIDDEN]: 'You do not have permission to perform this action',
  [ErrorCodes.INVALID_CREDENTIALS]: 'Invalid email or password',
  [ErrorCodes.SESSION_EXPIRED]: 'Your session has expired. Please log in again',
  
  [ErrorCodes.VALIDATION_ERROR]: 'The provided data is invalid',
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 'Required field is missing',
  [ErrorCodes.INVALID_INPUT]: 'Invalid input provided',
  
  [ErrorCodes.NOT_FOUND]: 'The requested resource was not found',
  [ErrorCodes.ALREADY_EXISTS]: 'This resource already exists',
  
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 'Too many requests. Please try again later',
  
  [ErrorCodes.EXTERNAL_SERVICE_ERROR]: 'An external service encountered an error',
  [ErrorCodes.PAYMENT_FAILED]: 'Payment processing failed. Please try again',
  [ErrorCodes.UPLOAD_FAILED]: 'File upload failed. Please try again',
  
  [ErrorCodes.INTERNAL_ERROR]: 'An unexpected error occurred',
  [ErrorCodes.SERVICE_UNAVAILABLE]: 'Service is temporarily unavailable',
};

export function sendError(res: Response, statusCode: number, code: string, customMessage?: string, details?: any): void {
  const message = customMessage || ErrorMessages[code] || ErrorMessages[ErrorCodes.INTERNAL_ERROR];
  
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && { details }),
    },
  });
}

export function sendValidationError(res: Response, message: string, details?: any): void {
  sendError(res, 400, ErrorCodes.VALIDATION_ERROR, message, details);
}

export function sendUnauthorized(res: Response, message?: string): void {
  sendError(res, 401, ErrorCodes.UNAUTHORIZED, message);
}

export function sendForbidden(res: Response, message?: string): void {
  sendError(res, 403, ErrorCodes.FORBIDDEN, message);
}

export function sendNotFound(res: Response, message?: string): void {
  sendError(res, 404, ErrorCodes.NOT_FOUND, message);
}

export function sendRateLimitError(res: Response, retryAfter: number): void {
  res.setHeader('Retry-After', retryAfter.toString());
  sendError(res, 429, ErrorCodes.RATE_LIMIT_EXCEEDED, undefined, { retryAfter });
}

export function sendInternalError(res: Response, message?: string): void {
  sendError(res, 500, ErrorCodes.INTERNAL_ERROR, message);
}
