import type { RegisterPayload } from '../common/types/auth/RegisterPayload.ts';
import type { RegisterResponse } from '../common/types/auth/RegisterResponse.ts';
import api from './base.ts';

export default class RegisterApi {

  static async register(payload: RegisterPayload) {
    return api.post<RegisterResponse>('auth/register', payload);
  }
}
