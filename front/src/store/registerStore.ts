import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import RegisterApi from '@/api/RegisterApi.ts';
import { useFetch } from '@/composables/useFetch.ts';
import type { RegisterPayload } from '@/common/types/auth/RegisterPayload.ts';
import type {RegisterErrorResponse} from "@/common/types/auth/RegisterErrorResponse.ts";
import type {ApiError} from "@/common/types/auth/ApiError.ts";

export const useRegisterStore = defineStore(
  'register',
  () => {
    const isRegistered = ref(false);
    const router = useRouter();

    const { isLoading, error, makeRequest, resetFetch } = useFetch();

    const register = async (payload: RegisterPayload) => {
      try {
        const response = await makeRequest(() => RegisterApi.register(payload), true);

        isRegistered.value = true;
        resetFetch();

        await router.push('/login');

        return response.data;
      } catch (e: unknown) {
        let errorMessage = 'Ошибка регистрации';

        if (typeof e === 'object' && e !== null && 'response' in e) {
          const apiError = e as ApiError;
          if (apiError.response?.data) {
            const errorData: RegisterErrorResponse = apiError.response.data;

            if (Array.isArray(errorData.detail)) {
              errorMessage = errorData.detail.map(err => err.msg).join(', ');
            } else {
              errorMessage = errorData.detail;
            }
          }
        } else if (e instanceof Error) {
          errorMessage = e.message;
        }

        error.value = errorMessage;
        throw new Error(errorMessage);
      }
    };

    const clearRegistration = () => {
      isRegistered.value = false;
      error.value = '';
      resetFetch();
    };

    const $reset = () => {
      clearRegistration();
    };

    return {
      isRegistered,
      isLoading,
      error,
      register,
      clearRegistration,
      $reset,
    };
  }
);
