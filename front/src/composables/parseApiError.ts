import type { ApiError, DefaultErrorResponse } from '@/common/types/ApiError.ts'

export function parseApiError(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'response' in e) {
    const apiError = e as ApiError<DefaultErrorResponse>;
    const status = apiError.response?.status;
    const data = apiError.response?.data;

    if (data?.detail) {
      if (typeof data.detail === 'string') return data.detail;
      if (Array.isArray(data.detail)) return data.detail.map(d => d.msg).join(', ');
    }

    switch (status) {
      case 400: return 'Некорректные данные. Проверьте введённые поля.';
      case 401: return 'Неверный логин или пароль.';
      case 403: return 'У вас нет доступа.';
      case 404: return 'Ресурс не найден.';
      case 500: return 'Ошибка на сервере. Попробуйте позже.';
      default: return 'Произошла ошибка при выполнении запроса.';
    }
  }

  if (e instanceof Error) return e.message || 'Произошла неизвестная ошибка';

  return 'Неизвестная ошибка';
}
