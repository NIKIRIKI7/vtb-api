export interface ApiError<T = unknown> {
  response?: {
    status?: number
    data?: T;
  }
  message?: string
}
export type DefaultErrorResponse = {
  detail: string | Array<{ msg: string; loc?: string[] }>
}
