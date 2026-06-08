export interface SuccessResponse<T = any> {
  data: T
  message?: string
}

export interface ErrorResponse {
  error: {
    message: string
    statusCode: number
    details?: any
    stack?: string
  }
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedResponse<T = any> {
  data: T[]
  pagination: PaginationMeta
}

export function successResponse<T>(data: T, message?: string): SuccessResponse<T> {
  return { data, ...(message && { message }) }
}

export function paginatedResponse<T>(data: T[], pagination: PaginationMeta): PaginatedResponse<T> {
  return { data, pagination }
}
