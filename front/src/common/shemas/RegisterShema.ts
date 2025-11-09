import {toTypedSchema} from '@vee-validate/zod';
import * as z from 'zod';

const simplePasswords = ['12345678', '12345', '123456', 'qwerty', 'password', 'admin', '111111'];

const RegisterUserSchema = z.object({
  email: z.string()
    .nonempty('Email обязателен')
    .email('Неверный формат email'),

  phone: z.string()
    .nonempty('Телефон обязателен')
    .regex(/^\+7\d{10}$/, 'Неверный формат телефона'),

  password: z.string()
    .nonempty('Пароль обязателен')
    .min(8, 'Пароль должен быть не менее 8 символов')
    .refine((val: string) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[\W_])/.test(val), {
      message: 'Пароль должен содержать заглавную букву, цифру и спецсимвол'
    })
    .refine((val) => !simplePasswords.some(p => val.toLowerCase().includes(p)), {
      message: 'Пароль слишком простой: содержит очевидную комбинацию'
    })
    .refine((val, ctx) => {
      if (!ctx?.parent) return true;
      const email = ctx?.parent?.email ?? ''
      const loginPart = email ? email.split('@')[0].toLowerCase() : ''
      return !loginPart || !val.toLowerCase().includes(loginPart)
    }, { message: 'Пароль не должен содержать логин/email' }),

  firstName: z.string()
    .nonempty('Введите имя')
    .min(2, 'Имя слишком короткое')
    .regex(/^[A-ZА-Я]/, 'Имя должно начинаться с заглавной буквы')
    ,

  typeAccount: z.enum(['0', '1', '2'], {required_error: 'Тип аккаунта обязателен'}),

  companyName: z.string()
    .optional()
    .refine((val, ctx) => {
      if (!ctx?.parent) return true;
      return ctx.parent.typeAccount === '0' || (val && val.trim().length > 0);
    }, {message: 'Введите название компании'}),

  inn: z.string()
    .optional()
    .refine((val, ctx) => {
      if (!ctx?.parent) return true;
      if (ctx.parent.typeAccount === '0') return true;
      return val && /^\d{10,12}$/.test(val);
    }, {message: 'Введите корректный ИНН (10-12 цифр)'}),

  kpp: z.string()
    .optional()
    .refine((val, ctx) => {
      if (!ctx?.parent) return true;
      if (ctx.parent.typeAccount !== '1') return true;
      return val && /^\d{9}$/.test(val);
    }, {message: 'Введите корректный КПП (9 цифр)'}),
});

export const registerSchema = toTypedSchema(RegisterUserSchema);
