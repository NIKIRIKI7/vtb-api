import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'

const LoginUserSchema = z.object({
  email: z.string()
    .nonempty('Email обязателен')
    .email('Неверный формат email'),

  password: z.string()
    .nonempty('Пароль обязателен')
    .min(8, 'Пароль должен быть не менее 8 символов')
})

export const loginSchema = toTypedSchema(LoginUserSchema)
