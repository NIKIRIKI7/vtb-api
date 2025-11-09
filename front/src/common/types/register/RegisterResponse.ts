import type { UserProfile } from '../auth/UserProfile.ts'
export type RegisterResponse = {
  user: UserProfile
  token: string;
};
