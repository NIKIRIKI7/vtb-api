import { ref } from 'vue';
import { parseApiError } from '@/composables/parseApiError.ts';

export const useFetch = () => {
  const isLoading = ref(false);
  const error = ref('');

  const makeRequest = async <T>(requestFn: () => Promise<T>, resetError = true): Promise<T> => {
    isLoading.value = true;
    if (resetError) error.value = '';

    try {
      return await requestFn();
    } catch (e: unknown) {
      error.value = parseApiError(e);
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const resetFetch = () => {
    isLoading.value = false;
    error.value = '';
  };

  return {
    isLoading,
    error,
    makeRequest,
    resetFetch,
  };
};
