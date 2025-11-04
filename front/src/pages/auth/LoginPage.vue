<template>
  <div class="min-h-screen flex items-center justify-center">
    <Card class="w-full max-w-md rounded-2xl border shadow-xl">
      <CardHeader class="text-center">
        <h1 class="text-2xl font-semibold">Вход</h1>
        <p class="text-sm text-gray-500 mt-1">Введите свои данные</p>
      </CardHeader>

      <CardContent class="space-y-4">
        <div>
          <Label for="email">Email</Label>
          <Input
            id="email"
            v-model="form.email"
            type="email"
            placeholder="you@example.com"
          />
          <p v-if="errors.email" class="text-sm text-red-500">{{ errors.email }}</p>
        </div>

        <div>
          <Label for="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            v-model="form.password"
            placeholder="••••••••"
          />
          <p v-if="errors.password" class="text-sm text-red-500">{{ errors.password }}</p>
        </div>

        <Button class="w-full mt-4" :loading="isLoading" @click="handleLogin">
          Войти
        </Button>

        <p class="text-sm text-center text-gray-500 mt-2">
          Нет аккаунта?
          <RouterLink to="/register" class="text-blue-600 hover:underline">Регистрация</RouterLink>
        </p>
      </CardContent>

      <CardFooter>
        <Alert v-if="serverError" variant="destructive">
          <AlertDescription>{{ serverError }}</AlertDescription>
        </Alert>
      </CardFooter>
    </Card>
  </div>
</template>

<script setup lang="ts">
import {ref, reactive} from 'vue'
import {useRouter} from 'vue-router'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {Card, CardHeader, CardContent, CardFooter} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Alert, AlertDescription} from '@/components/ui/alert'

const router = useRouter()
const isLoading = ref(false)
const serverError = ref('')

const form = reactive({
  email: '',
  password: ''
})

const errors = reactive({
  email: '',
  password: ''
})

function validateForm() {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  errors.email = !form.email
    ? 'Email обязателен'
    : !emailPattern.test(form.email)
      ? 'Введите корректный email'
      : ''
  errors.password = !form.password
    ? 'Пароль обязателен'
    : form.password.length < 6
      ? 'Пароль должен быть минимум 6 символов'
      : ''
  return !errors.email && !errors.password
}

async function handleLogin() {
  serverError.value = ''
  if (!validateForm()) return

  isLoading.value = true
  try {
    const res = await fetch('http://localhost:8000/auth/login', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(form)
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.detail || `Ошибка ${res.status}`)

    localStorage.setItem('access_token', data.access_token)
    router.push('/')
  } catch (e: unknown) {
    if (e instanceof Error) {
      serverError.value = e.message || 'Ошибка входа'
    } else {
      serverError.value = 'Неизвестная ошибка'
    }
  } finally {
    isLoading.value = false
  }
}
</script>
