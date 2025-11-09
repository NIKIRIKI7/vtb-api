<template>
  <div class="flex min-h-screen items-center justify-center">
    <Card class="w-full max-w-md shadow-xl rounded-2xl border border-gray-200">
      <CardHeader class="text-center">
        <div class="flex justify-center mb-2">
          <AppLogo class="h-12 w-auto" />
        </div>
        <h1 class="text-2xl font-semibold">Регистрация</h1>
        <p class="text-sm text-gray-500 mt-1">Создайте новый аккаунт</p>
      </CardHeader>

      <CardContent>
        <RegisterForm
          :is-loading="registerStore.isLoading"
          :server-error="registerStore.error"
          @submit="handleSubmit"
          @update:isLoading="registerStore.isLoading = $event"
          @update:server-error="registerStore.error = $event"
        />
      </CardContent>

      <CardFooter>
        <Alert v-if="registerStore.error" variant="destructive">
          <AlertDescription>{{ registerStore.error }}</AlertDescription>
        </Alert>
        <Alert v-if="registerStore.isRegistered" variant="default" class="bg-green-50 border-green-200">
          <AlertDescription class="text-green-800">
            Регистрация успешна! Перенаправляем на страницу входа...
          </AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {onMounted} from "vue"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import AppLogo from "@/app/ui/AppLogo.vue"
import RegisterForm from "@/common/forms/RegisterForm.vue"
import type {RegisterPayload} from "@/common/types/register/RegisterPayload.ts";
import {useRegisterStore} from "@/store/RegisterStore.ts";

const registerStore = useRegisterStore()

onMounted(() => {
  registerStore.clearRegistration()
})

const handleSubmit = async (payload: RegisterPayload) => {
  try {
    await registerStore.register(payload)
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('Registration error:', e.message)
    } else {
      console.error('Unknown registration error:', e)
    }
  }
}
</script>
