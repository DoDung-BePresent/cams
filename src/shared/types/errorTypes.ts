export enum ErrorCodeEnum {
  Success = 'Success',
  Unauthorized = 'Unauthorized',
  Forbidden = 'Forbidden',
  InvalidCredentials = 'InvalidCredentials',
  TokenExpired = 'TokenExpired',
  InvalidToken = 'InvalidToken',
  ValidationFailed = 'ValidationFailed',
  InvalidInput = 'InvalidInput',
  DuplicateEntry = 'DuplicateEntry',
  InvalidOperation = 'InvalidOperation',
  TooManyRequests = 'TooManyRequests',
  NotFound = 'NotFound',
  InternalError = 'InternalError',
  ExternalServiceError = 'ExternalServiceError',
  EmailSendFailed = 'EmailSendFailed',
  BusinessRuleViolation = 'BusinessRuleViolation',
}

export const ERROR_MESSAGES: Record<ErrorCodeEnum, string> = {
  [ErrorCodeEnum.Success]: 'Success',
  [ErrorCodeEnum.Unauthorized]: 'You are not authorized to perform this action',
  [ErrorCodeEnum.Forbidden]:
    'You do not have permission to access this resource',
  [ErrorCodeEnum.InvalidCredentials]: 'Invalid email or password',
  [ErrorCodeEnum.TokenExpired]: 'Your session has expired. Please login again',
  [ErrorCodeEnum.InvalidToken]: 'Invalid authentication token',
  [ErrorCodeEnum.ValidationFailed]: 'Please check your input and try again',
  [ErrorCodeEnum.InvalidInput]: 'Invalid input provided',
  [ErrorCodeEnum.DuplicateEntry]: 'This entry already exists',
  [ErrorCodeEnum.InvalidOperation]: 'This action cannot be completed right now',
  [ErrorCodeEnum.TooManyRequests]:
    'Too many requests. Please wait a moment and try again',
  [ErrorCodeEnum.NotFound]: 'Resource not found',
  [ErrorCodeEnum.InternalError]:
    'An unexpected error occurred. Please try again later',
  [ErrorCodeEnum.ExternalServiceError]:
    'An external service is unavailable. Please try again later',
  [ErrorCodeEnum.EmailSendFailed]:
    'We could not send the email. Please try again later',
  [ErrorCodeEnum.BusinessRuleViolation]:
    'This action violates business rules. Please check the conditions and try again',
};
