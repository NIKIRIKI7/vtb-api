<template>
  <div class="space-y-8">
    <div v-if="isLoading && banksArray.every(b => b.status === 'pending')" class="text-center text-muted-foreground py-10">
      <p>Загрузка статусов банков...</p>
    </div>

    <div v-for="bank in banksArray" :key="bank.name" class="space-y-4">
      <Card>
        <CardHeader>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img :src="`/banks/${bank.name}.svg`" :alt="bank.name" class="h-8 w-8 rounded-full border p-1" />
              <CardTitle class="capitalize">{{ bank.name.replace('bank', ' Bank') }}</CardTitle>
            </div>
            <div v-if="bank.status === 'connected'" class="flex items-center gap-2 text-sm text-green-600">
              <span class="relative flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Подключен
            </div>
            <div v-else-if="bank.status === 'disconnected'" class="flex items-center gap-2 text-sm text-red-600">
              <span class="relative flex h-2 w-2 rounded-full bg-red-500"></span>
              Не подключен
            </div>
            <div v-else class="text-sm text-muted-foreground">
              Проверка...
            </div>
          </div>
        </CardHeader>

        <CardContent v-if="bank.status === 'connected'">
          <div v-if="bank.isLoadingAccounts" class="text-center py-4">
            <p>Загрузка счетов...</p>
          </div>
          <div v-else-if="bank.accounts.length > 0" class="space-y-3">
            <div
              v-for="account in bank.accounts"
              :key="account.accountId"
              class="border p-4 rounded-md hover:bg-muted/50 transition-colors"
            >
              <div class="flex justify-between items-start">
                <div>
                  <p class="font-semibold">{{ account.nickname }}</p>
                  <p class="text-sm text-muted-foreground">{{ account.accountId }}</p>
                </div>
                <div class="text-right">
                  <p v-if="account.balance && account.balance.amount" class="font-bold text-lg">
                    {{ formatCurrency(account.balance.amount.amount, account.balance.amount.currency) }}
                  </p>
                  <p v-else class="font-semibold text-lg text-muted-foreground">--</p>
                  <RouterLink
                    :to="`/transactions?accountId=${account.accountId}&bank=${bank.name}`"
                    class="text-sm text-primary hover:underline mt-1 inline-block"
                  >
                    К транзакциям &rarr;
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="text-center py-4 text-muted-foreground">
            <p>Счета не найдены.</p>
          </div>
        </CardContent>

        <CardContent v-else-if="bank.status === 'disconnected'">
          <div class="text-center py-4">
            <p class="text-muted-foreground mb-4">Для доступа к счетам необходимо подключить банк.</p>
            <Button @click="handleConnect(bank.name)" :disabled="isConnecting(bank.name)">
              <template v-if="isConnecting(bank.name)">
                Подключение...
              </template>
              <template v-else>
                Подключить {{ bank.name.replace('bank', ' Bank') }}
              </template>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAccountStore } from '@/store/AccountStore'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { BankName } from '@/entities/account/types'

const accountStore = useAccountStore()

const banksArray = computed(() => Object.values(accountStore.banks))
const isLoading = computed(() => accountStore.isLoadingStatuses)

/**
 * Проверяет, находится ли указанный банк в процессе подключения.
 * @param {BankName} bankName - Название банка для проверки.
 * @returns {boolean} Возвращает `true`, если банк в данный момент подключается, иначе `false`.
 */
const isConnecting = (bankName: BankName) => accountStore.connectingBank === bankName;

/**
 * Обработчик клика по кнопке 'Подключить'. Вызывает действие `connectBank` в `AccountStore`.
 * @param {BankName} bankName - Название банка для подключения.
 * @returns {Promise<void>}
 */
const handleConnect = async (bankName: BankName) => {
  await accountStore.connectBank(bankName)
}

/**
 * Форматирует числовое значение в строку валюты.
 * @param {string | number | undefined | null} amount - Сумма в виде строки или числа.
 * @param {string} currency - Код валюты (например, 'RUB').
 * @returns {string} Отформатированная строка валюты или прочерк.
 */
const formatCurrency = (amount: string | number | undefined | null, currency: string) => {
  const numericAmount = Number(amount);
  if (isNaN(numericAmount)) {
    console.warn(`[formatCurrency] Invalid amount received: ${amount}`);
    return '--';
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(numericAmount)
}
</script>
