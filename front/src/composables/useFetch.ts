import { ref } from 'vue';

export const useFetch = () => {
  const isLoading = ref(false);
  const error = ref('');

  const makeRequest = async <T>(requestFn: () => Promise<T>, resetError = true): Promise<T> => {
    isLoading.value = true;
    if (resetError) error.value = '';

    try {
      const response = await requestFn();
      return response;
    } catch (e: unknown) {
      if (e instanceof Error) {
        error.value = e.message || 'Произошла ошибка';
      } else {
        error.value = 'Произошла неизвестная ошибка';
      }
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
