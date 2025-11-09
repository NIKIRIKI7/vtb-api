import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import RegisterApi from '@/api/RegisterApi.ts'
import { useFetch } from '@/composables/useFetch.ts'
import type { RegisterPayload } from '@/common/types/register/RegisterPayload.ts'
import { parseApiError } from '@/composables/parseApiError.ts'
import { useAuthStore } from '@/store/AuthStore.ts'


export const useRegisterStore = defineStore('register', () => {
  const isRegistered = ref(false)
  const router = useRouter()
  const authStore = useAuthStore()


  const { isLoading, error, makeRequest, resetFetch } = useFetch()

  const register = async (payload: RegisterPayload) => {
    try {
      const response = await makeRequest(() => RegisterApi.register(payload), true)
      isRegistered.value = true
      resetFetch()
      await authStore.fetchProfile()
      await router.push('/')
      return response.data
    } catch (e: unknown) {
      const message = parseApiError(e)
      error.value = message
      console.warn('Ошибка регистрации:', message)
    }
  }

  const clearRegistration = () => {
    isRegistered.value = false
    error.value = ''
    resetFetch()
  }

  const $reset = () => {
    clearRegistration()
  }

  return {
    isRegistered,
    isLoading,
    error,
    register,
    clearRegistration,
    $reset,
  }
})
