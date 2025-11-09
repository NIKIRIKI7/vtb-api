<template>
  <div class="flex min-h-screen items-center justify-center">
    <Card class="w-full max-w-md shadow-xl rounded-2xl border border-gray-200">
      <CardHeader class="text-center">
        <div class="flex justify-center mb-2">
          <AppLogo class="h-12 w-auto" />
        </div>
        <h1 class="text-2xl font-semibold">Вход в систему</h1>
        <p class="text-sm text-gray-500 mt-1">Введите данные для входа</p>
      </CardHeader>

      <CardContent>
        <LoginForm
          :is-loading="authStore.isLoading"
          :server-error="authStore.error"
          @submit="handleSubmit"
        />
      </CardContent>

      <CardFooter>
        <Alert v-if="authStore.error" variant="destructive">
          <AlertDescription>{{ authStore.error }}</AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import AppLogo from '@/app/ui/AppLogo.vue'
import LoginForm from '@/common/forms/LoginForm.vue'
import { useAuthStore } from '@/store/AuthStore.ts'
import type { LoginPayload } from '@/common/types/auth/LoginPayload.ts'

const authStore = useAuthStore()

const handleSubmit = async (payload: LoginPayload) => {
  try {
    await authStore.login(payload)
  } catch (e: unknown) {
    console.error('Login failed:', e)
  }
}
</script>
