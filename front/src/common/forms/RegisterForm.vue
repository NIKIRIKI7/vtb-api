<template>
  <form @submit.prevent="onSubmit" class="space-y-4">
    <div class="space-y-2">
      <label class="text-sm font-medium">Email</label>
      <Input
        placeholder="user@example.com"
        v-model="email"
      />
      <span v-if="errors.email" class="text-red-500 text-xs">{{ errors.email }}</span>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium">Телефон</label>
      <Input
        placeholder="+7XXXXXXXXXX"
        v-model="phone"
      />
      <span v-if="errors.phone" class="text-red-500 text-xs">{{ errors.phone }}</span>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium">Пароль</label>
      <Input
        type="password"
        placeholder="••••••••"
        v-model="password"
      />
      <span v-if="errors.password" class="text-red-500 text-xs">{{ errors.password }}</span>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium">Имя</label>
      <Input
        placeholder="Иван"
        v-model="firstName"
      />
      <span v-if="errors.firstName" class="text-red-500 text-xs">{{ errors.firstName }}</span>
    </div>

    <div class="space-y-2">
      <label class="text-sm font-medium">Тип аккаунта</label>
      <select
        v-model="typeAccount"
        class="w-full mt-1 rounded-md border px-3 py-2"
      >
        <option value="0">Физическое лицо</option>
        <option value="1">Юридическое лицо</option>
        <option value="2">ИП</option>
      </select>
    </div>

    <div v-if="typeAccount !== '0'" class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">Название компании</label>
        <Input
          placeholder="ООО Ромашка"
          v-model="companyName"
        />
        <span v-if="errors.companyName" class="text-red-500 text-xs">{{ errors.companyName }}</span>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">ИНН</label>
        <Input
          placeholder="1234567890"
          v-model="inn"
        />
        <span v-if="errors.inn" class="text-red-500 text-xs">{{ errors.inn }}</span>
      </div>

      <div v-if="typeAccount === '1'" class="space-y-2">
        <label class="text-sm font-medium">КПП</label>
        <Input
          placeholder="123456789"
          v-model="kpp"
        />
        <span v-if="errors.kpp" class="text-red-500 text-xs">{{ errors.kpp }}</span>
      </div>
    </div>

    <Button
      type="submit"
      class="w-full mt-4"
      :disabled="isDisabled || isLoading"
    >
      <template v-if="isLoading">Загрузка...</template>
      <template v-else>Зарегистрироваться</template>
    </Button>

    <p class="text-sm text-center text-gray-500">
      Уже есть аккаунт?
      <RouterLink to="/login" class="text-blue-600 hover:underline">
        Войти
      </RouterLink>
    </p>
  </form>
</template>

<script setup lang="ts">
import { computed } from "vue"
import { useForm, useField, configure } from "vee-validate"
import { registerSchema } from "@/common/shemas/RegisterShema.ts"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import type {RegisterPayload} from "@/common/types/register/RegisterPayload.ts";

interface Props {
  isLoading?: boolean
  serverError?: string
}

interface Emits {
  (e: 'submit', payload: RegisterPayload): void
  (e: 'update:isLoading', value: boolean): void
  (e: 'update:serverError', value: string): void
}

withDefaults(defineProps<Props>(), {
  isLoading: false,
  serverError: ''
})

const emit = defineEmits<Emits>()

configure({
  validateOnBlur: true,
  validateOnChange: true,
  validateOnInput: true,
  validateOnModelUpdate: true,
})

const { handleSubmit, errors, meta } = useForm({
  validationSchema: registerSchema,
  initialValues: {
    email: '',
    phone: '',
    password: '',
    firstName: '',
    typeAccount: '0',
    companyName: '',
    inn: '',
    kpp: ''
  }
})

const { value: email } = useField<string>("email")
const { value: phone } = useField<string>("phone")
const { value: password } = useField<string>("password")
const { value: firstName } = useField<string>("firstName")
const { value: typeAccount } = useField<string>("typeAccount")
const { value: companyName } = useField<string>("companyName")
const { value: inn } = useField<string>("inn")
const { value: kpp } = useField<string>("kpp")

const isDisabled = computed(() => {
  return !meta.value.valid
})

const onSubmit = handleSubmit(async (values) => {
  emit('update:isLoading', true)
  emit('update:serverError', '')

  try {
    const payload: RegisterPayload = {
      email: values.email,
      phone: values.phone,
      password: values.password,
      first_name: values.firstName,
      type_account: values.typeAccount,
    }

    if (values.typeAccount !== '0') {
      payload.company_name = values.companyName
      payload.inn = values.inn
      if (values.typeAccount === '1') {
        payload.kpp = values.kpp
      }
    }

    emit('submit', payload)
  } catch (e: unknown) {
    let message = 'Произошла неизвестная ошибка'
    if (e instanceof Error) {
      message = e.message
    }
    emit('update:serverError', message)
    emit('update:isLoading', false)
  }
})
</script>
