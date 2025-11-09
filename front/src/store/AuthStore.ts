import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AuthApi from '@/api/AuthApi.ts'
import { useFetch } from '@/composables/useFetch.ts'
import type { LoginPayload } from '@/common/types/auth/LoginPayload.ts'
import { parseApiError } from '@/composables/parseApiError.ts'
import type {UserProfile} from "@/common/types/auth/UserProfile.ts";
import { useChatStore } from './ChatStore.ts'
import { useAccountStore } from './AccountStore.ts'



export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const isAuthenticated = ref(false)
  const router = useRouter()
  const { isLoading, error, makeRequest } = useFetch()
  const isInitialized = ref(false)


  const isLoggedIn = computed(() => isAuthenticated.value && !!user.value)

  const $reset = () => {
    user.value = null
    isAuthenticated.value = false
    error.value = ''
    isInitialized.value = false
  }

  const makeAuthRequest = async <T>(requestFn: () => Promise<T>): Promise<T> => {
    try {
      return await requestFn()
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } }
      if (err.response?.status === 401) {
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          return requestFn()
        } else {
          $reset()
          await router.push('/login')
          throw new Error('Сессия истекла. Пожалуйста, войдите снова.')
        }
      }
      throw e
    }
  }

  const login = async (payload: LoginPayload) => {
    try {
      const chatStore = useChatStore()
      const accountStore = useAccountStore()
      chatStore.$reset()
      accountStore.$reset()

      await makeRequest(() => AuthApi.login(payload))
      isAuthenticated.value = true
      error.value = ''
      await fetchProfile()
      await chatStore.loadHistory()

      await router.push('/')
    } catch (e: unknown) {
      const message = parseApiError(e)
      error.value = message
      console.warn('Ошибка входа:', message)
      throw e
    }
  }

  const logout = async () => {
    try {
      await makeRequest(() => AuthApi.logout())
    } catch (e) {
      console.warn('Ошибка выхода', e)
    } finally {
      // const chatStore = useChatStore()
      // chatStore.resetOnLogout()

      await forceLogout();
    }
  }

  const fetchProfile = async () => {
    try {
      const response = await makeRequest(() => AuthApi.getProfile())
      user.value = response.data
      isAuthenticated.value = true
      return true
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } }
      console.warn('Ошибка получения профиля:', err)

      if (err?.response?.status === 402 || err?.response?.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          try {
            const response = await makeRequest(() => AuthApi.getProfile());
            user.value = response.data;
            isAuthenticated.value = true;
            return true;
          } catch {
            console.warn('Токен недействителен даже после обновления');
            $reset()
          }
        } else {
          $reset()
        }
      }
      return false
    }
  }

  const refreshAccessToken = async () => {
    try {
      await AuthApi.refreshToken()
      return true
    } catch (e: unknown) {
      console.warn('Ошибка обновления токена:', parseApiError(e))
      $reset()
      return false
    }
  }

  const forceLogout = async () => {
    // const chatStore = useChatStore()
    const accountStore = useAccountStore()

    // chatStore.resetOnLogout()
    accountStore.$reset()

    $reset()
    await router.push('/login')
  }

  const initAuth = async () => {
    try {
      const ok = await fetchProfile()
      if (!ok) {
        console.log('Не удалось получить профиль — разлогиниваем')
        $reset()
      }
      isInitialized.value = true
    } catch (e) {
      console.error('Ошибка инициализации аутентификации:', e)
      $reset()
      isInitialized.value = true
    }
  }
  const getAuthState = () => {
    return {
      user: user.value,
      isAuthenticated: isAuthenticated.value,
      isInitialized: isInitialized.value,
      isLoggedIn: isLoggedIn.value,
      userId: user.value?.id
    }
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    isLoggedIn,
    isInitialized,
    login,
    logout,
    fetchProfile,
    refreshAccessToken,
    $reset,
    makeAuthRequest,
    initAuth,
    getAuthState,
  }
})
