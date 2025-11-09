<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <div class="space-y-2">
      <label for="email" class="text-sm font-medium">Email</label>
      <Input
        id="email"
        type="email"
        placeholder="user@example.com"
        v-model="form.email"
        required
      />
      <span v-if="errors.email" class="text-red-500 text-xs">{{ errors.email }}</span>
    </div>

    <div class="space-y-2">
      <label for="password" class="text-sm font-medium">Пароль</label>
      <Input
        id="password"
        type="password"
        placeholder="••••••••"
        v-model="form.password"
        required
      />
      <span v-if="errors.password" class="text-red-500 text-xs">{{ errors.password }}</span>
    </div>

    <Button type="submit" class="w-full mt-4" :disabled="isLoading">
      <template v-if="isLoading">Загрузка...</template>
      <template v-else>Войти</template>
    </Button>

    <p class="text-sm text-center text-gray-500">
      Нет аккаунта?
      <RouterLink to="/register" class="text-blue-600 hover:underline">
        Зарегистрироваться
      </RouterLink>
    </p>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useForm, useField, configure } from 'vee-validate'
import { loginSchema } from '@/common/shemas/LoginShema.ts'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { LoginPayload } from '@/common/types/auth/LoginPayload.ts'

interface Props {
  isLoading?: boolean
}

interface Emits {
  (e: 'submit', payload: LoginPayload): void
}

withDefaults(defineProps<Props>(), {
  isLoading: false
})

const emit = defineEmits<Emits>()

configure({
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: true,
  validateOnModelUpdate: true,
})

const { handleSubmit, errors } = useForm({
  validationSchema: loginSchema,
  initialValues: {
    email: '',
    password: ''
  }
})

const { value: email } = useField<string>('email')
const { value: password } = useField<string>('password')

const form = reactive({
  get email() {
    return email.value
  },
  set email(v: string) {
    email.value = v
  },
  get password() {
    return password.value
  },
  set password(v: string) {
    password.value = v
  }
})

const onSubmit = handleSubmit((values) => {
  emit('submit', { ...values })
})
</script>
