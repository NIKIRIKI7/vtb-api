<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAccountStore } from '@/store/AccountStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  History,
  ArrowRightLeft,
  CreditCard as CreditCardIcon,
  Landmark,
  ChevronLeft,
  ChevronRight,
} from 'lucide-vue-next'

const accountStore = useAccountStore()

const currentIndex = ref(0)

const connectedBanksWithAccounts = computed(() => {
  return Object.values(accountStore.banks).filter(
    (bank) => bank.status === 'connected' && bank.accounts.length > 0
  )
})

const currentBank = computed(() => {
  return connectedBanksWithAccounts.value[currentIndex.value]
})

const currentBankBalance = computed(() => {
  if (!currentBank.value) return 0
  return currentBank.value.accounts.reduce((total, account) => {
    if (account.balance && account.balance.amount && account.balance.amount.currency === 'RUB') {
      return total + Number(account.balance.amount.amount)
    }
    return total
  }, 0)
})

const formatCurrency = (amount: number, currency: string) => {
  if (isNaN(amount)) return '--'
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const nextBank = () => {
  currentIndex.value = (currentIndex.value + 1) % connectedBanksWithAccounts.value.length
}

const prevBank = () => {
  currentIndex.value =
    (currentIndex.value - 1 + connectedBanksWithAccounts.value.length) %
    connectedBanksWithAccounts.value.length
}

const goToBank = (index: number) => {
  currentIndex.value = index
}
</script>

<template>
  <div class="space-y-6">
    <!-- Connected banks section -->
    <div v-if="connectedBanksWithAccounts.length > 0">
      <Card
        class="bg-slate-900 text-primary-foreground border-slate-700 shadow-lg relative overflow-hidden"
      >
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-lg font-medium text-white">Мой Баланс</CardTitle>
          <span v-if="currentBank" class="text-sm font-semibold capitalize caret-amber-200 text-white">
            {{ currentBank.name.replace('bank', ' Bank') }}
          </span>
        </CardHeader>
        <CardContent class="text-left">
          <p class="text-4xl font-bold tracking-tight caret-amber-200 text-white">
            {{ formatCurrency(currentBankBalance, 'RUB') }}
          </p>
          <div class="mt-6 grid grid-cols-4 gap-2 text-center">
            <div class="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="bg-cyan-200 hover:bg-cyan-400 rounded-lg h-12 w-12"
              >
                <CreditCardIcon class="h-6 w-6" />
              </Button>
              <span class="text-xs caret-amber-200 text-white">Оплатить</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="bg-cyan-200 hover:bg-cyan-400 rounded-lg h-12 w-12"
              >
                <ArrowRightLeft class="h-6 w-6" />
              </Button>
              <span class="text-xs caret-amber-200 text-white">Перевести</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <a
                v-if="currentBank"
                :href="`/transactions?accountId=${currentBank.accounts[0]?.accountId}&bank=${currentBank.name}`"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  class="bg-cyan-200 hover:bg-cyan-400 rounded-lg h-12 w-12"
                >
                  <History class="h-6 w-6" />
                </Button>
              </a>
              <span class="text-xs caret-amber-200 text-white">История</span>
            </div>
            <div class="flex flex-col items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                class="bg-cyan-200 hover:bg-cyan-400 rounded-lg h-12 w-12"
              >
                <Landmark class="h-6 w-6" />
              </Button>
              <span class="text-xs caret-amber-200 text-white">Вклады</span>
            </div>
          </div>
        </CardContent>

        <!-- Pagination dots -->
        <div
          v-if="connectedBanksWithAccounts.length > 1"
          class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
        >
          <button
            v-for="(bank, index) in connectedBanksWithAccounts"
            :key="bank.name"
            @click="goToBank(index)"
            class="h-2 w-2 rounded-full transition-colors"
            :class="currentIndex === index ? 'bg-white' : 'bg-white/30 hover:bg-white/50'"
          />
        </div>

        <!-- Navigation arrows -->
        <template v-if="connectedBanksWithAccounts.length > 1">
          <Button
            @click="prevBank"
            variant="ghost"
            size="icon"
            class="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
          >
            <ChevronLeft />
          </Button>
          <Button
            @click="nextBank"
            variant="ghost"
            size="icon"
            class="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-white/50 hover:text-white hover:bg-white/10"
          >
            <ChevronRight />
          </Button>
        </template>
      </Card>
    </div>

    <!-- No connected banks section -->
    <div v-else>
      <Card class="bg-slate-900 text-primary-foreground border-slate-700 shadow-lg">
        <CardHeader>
          <CardTitle class="text-lg font-medium text-white">Мой Баланс</CardTitle>
        </CardHeader>
        <CardContent class="text-center pb-4">
          <div class="h-16 flex items-center justify-center">
            <p v-if="accountStore.isLoadingStatuses" class="text-white">Загрузка...</p>
            <p v-else class="text-muted-foreground text-slate-400">Нет подключенных счетов</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Disconnected banks list -->
    <div v-for="bank in accountStore.banks" :key="bank.name">
      <div v-if="bank.status === 'disconnected'">
        <Card>
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <img
                  :src="`/banks/${bank.name}.svg`"
                  :alt="bank.name"
                  class="h-8 w-8 rounded-full border p-1"
                />
                <CardTitle class="capitalize">
                  {{ bank.name.replace('bank', ' Bank') }}
                </CardTitle>
              </div>
              <div class="flex items-center gap-2 text-sm text-red-600">
                <span class="relative flex h-2 w-2 rounded-full bg-red-500"></span>
                Не подключен
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div class="text-center py-4">
              <p class="text-muted-foreground mb-4">
                Для доступа к счетам необходимо подключить банк.
              </p>
              <Button
                @click="accountStore.connectBank(bank.name)"
                :disabled="accountStore.connectingBank === bank.name"
              >
                <template v-if="accountStore.connectingBank === bank.name">
                  Подключение...
                </template>
                <template v-else>Подключить {{ bank.name.replace('bank', ' Bank') }}</template>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
