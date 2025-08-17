// Type-safe error handling utilities

export function isErrorWithMessage(error: unknown): error is { message: string } {
  return (
    error !== null &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  );
}

export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unknown error occurred';
}

export function isDatabaseRelationError(error: unknown): boolean {
  if (!isErrorWithMessage(error)) {
    return false;
  }
  
  const message = error.message.toLowerCase();
  return message.includes('relation') || 
         message.includes('does not exist') || 
         message.includes('table') && message.includes('exist');
}