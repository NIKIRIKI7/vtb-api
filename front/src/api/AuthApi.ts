import api from './base.ts'
import type { LoginPayload } from '@/common/types/auth/LoginPayload.ts'
import type { LoginResponse } from '@/common/types/auth/LoginResponse.ts'

export default class AuthApi {
  static async login(payload: LoginPayload) {
    const formData = new URLSearchParams()
    formData.append('username', payload.email)
    formData.append('password', payload.password)

    return api.post<LoginResponse>('auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  }

  static async logout() {
    return api.post('auth/logout')
  }

  static async getProfile() {
    return api.get('auth/me')
  }

  static async refreshToken() {
    return api.post('auth/refresh')
  }
}
