import type { RegisterPayload } from '@/common/types/register/RegisterPayload.ts';
import type { RegisterResponse } from '@/common/types/register/RegisterResponse.ts';
import api from './base.ts';

export default class RegisterApi {

  static async register(payload: RegisterPayload) {
    return api.post<RegisterResponse>('auth/register', payload);
  }
}
