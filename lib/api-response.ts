export type ApiSuccess<T> = {
  success: true
  data: T
  error?: never
}

export type ApiFailure = {
  success: false
  data?: never
  error: string
  status?: number
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
