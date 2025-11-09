<!-- src/pages/profile/ui/AccountCarousel.vue -->
<template>
  <Card class="h-64">
    <CardHeader>
      <CardTitle class="text-lg flex items-center justify-between">
        <span>Мои счета</span>
        <span v-if="accounts.length > 0" class="text-sm font-normal text-muted-foreground">
          {{ currentIndex + 1 }} / {{ accounts.length }}
        </span>
      </CardTitle>
    </CardHeader>
    <CardContent class="h-48 flex flex-col justify-between">
      <!-- Пустое состояние -->
      <div
        v-if="accounts.length === 0"
        class="flex-1 flex flex-col items-center justify-center text-muted-foreground"
      >
        <Wallet class="h-8 w-8 mb-2 opacity-50" />
        <p class="text-sm">Нет доступных счетов</p>
      </div>

      <!-- Счет -->
      <div v-else class="flex-1 space-y-4">
        <!-- Банк и номер счета -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img
              :src="`/banks/${currentAccount?.bank}.svg`"
              :alt="currentAccount?.bank"
              class="h-6 w-6 rounded-full"
              @error="handleImageError"
            />
            <span class="text-sm font-medium capitalize">
              {{ currentAccount?.bank?.replace('bank', ' Bank') || 'Банк' }}
            </span>
          </div>
          <span class="text-xs text-muted-foreground">
            {{ formatAccountNumber(currentAccount?.accountId) }}
          </span>
        </div>

        <!-- Название счета -->
        <div>
          <h3 class="text-xl font-semibold truncate">
            {{ currentAccount?.nickname || 'Основной счет' }}
          </h3>
          <p class="text-sm text-muted-foreground">
            {{ getAccountTypeName(currentAccount?.accountType) }}
          </p>
        </div>

        <!-- Баланс -->
        <div class="text-center">
          <p class="text-2xl font-bold">
            {{ formatCurrency(currentAccount) }}
          </p>
          <p class="text-sm text-muted-foreground mt-1">
            Текущий баланс
          </p>
        </div>
      </div>

      <!-- Навигация -->
      <div v-if="accounts.length > 1" class="flex justify-between items-center">
        <Button
          variant="outline"
          size="sm"
          @click="prevAccount"
          :disabled="currentIndex === 0"
          class="bg-white hover:bg-gray-50"
        >
          <ChevronLeft class="h-4 w-4" />
        </Button>

        <div class="flex gap-1">
          <div
            v-for="(_, index) in accounts"
            :key="index"
            class="w-2 h-2 rounded-full transition-colors"
            :class="index === currentIndex ? 'bg-primary' : 'bg-muted'"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          @click="nextAccount"
          :disabled="currentIndex === accounts.length - 1"
          class="bg-white hover:bg-gray-50"
        >
          <ChevronRight class="h-4 w-4" />
        </Button>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Wallet } from 'lucide-vue-next'
import type { Account } from '@/entities/account/types'

interface Props {
  accounts: Array<Account & { bank: string }>
  selectedAccount: (Account & { bank: string }) | null
}

interface Emits {
  (e: 'account-change', account: Account & { bank: string }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const currentIndex = ref(0)

const currentAccount = computed(() => {
  if (props.accounts.length === 0) return null
  return props.accounts[currentIndex.value] || props.accounts[0]
})


const prevAccount = () => {
  if (currentIndex.value > 0) {
    currentIndex.value--
    const account = props.accounts[currentIndex.value]
    if (account) {
      emit('account-change', account)
    }
  }
}

const nextAccount = () => {
  if (currentIndex.value < props.accounts.length - 1) {
    currentIndex.value++
    const account = props.accounts[currentIndex.value]
    if (account) {
      emit('account-change', account)
    }
  }
}

const formatCurrency = (account: any) => {
  if (!account?.balance?.balance || !Array.isArray(account.balance.balance)) {
    return '--'
  }

  const availableBalance = account.balance.balance.find((b: any) => b.type === 'InterimAvailable')
  const bookedBalance = account.balance.balance.find((b: any) => b.type === 'InterimBooked')

  const balance = availableBalance || bookedBalance

  if (!balance?.amount?.amount || !balance?.amount?.currency) {
    return '--'
  }

  const numericAmount = Number(balance.amount.amount)
  if (isNaN(numericAmount)) return '--'

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: balance.amount.currency,
  }).format(numericAmount)
}
const formatAccountNumber = (accountId: string) => {
  if (!accountId) return '--'
  if (accountId.length > 8) {
    return `...${accountId.slice(-4)}`
  }
  return accountId
}

const getAccountTypeName = (type: string) => {
  const types: { [key: string]: string } = {
    'Personal': 'Личный счет',
    'CurrentAccount': 'Текущий счет',
    'SavingsAccount': 'Сберегательный счет',
    'CreditCard': 'Кредитная карта',
    'DebitCard': 'Дебетовая карта',
    'Checking': 'Расчетный счет'

  }
  return types[type] || 'Банковский счет'
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  target.src = '/banks/default.svg'
}
</script>
