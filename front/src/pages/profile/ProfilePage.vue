<template>
  <div class="min-h-screen bg-background py-6">
    <div class="container mx-auto px-4">
      <!-- Заголовок -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold">Профиль пользователя</h1>
            <p class="text-muted-foreground mt-2">Управление вашими счетами и финансами</p>
          </div>
          <div class="text-right">
            <div class="flex items-center gap-3">
              <div>
                <p class="font-semibold text-lg">{{ authStore.user?.first_name }}</p>
                <p class="text-sm text-muted-foreground">{{ authStore.user?.email }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Дополнительная информация о пользователе -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>Информация о профиле</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-muted-foreground">Тип аккаунта</p>
              <p class="font-medium">{{ accountTypeText }}</p>
            </div>
            <div>
              <p class="text-sm text-muted-foreground">Статус</p>
              <p class="font-medium">
                {{ authStore.user?.premium ? 'Премиум аккаунт' : 'Базовый аккаунт' }}
              </p>
            </div>
            <div v-if="authStore.user?.company_name">
              <p class="text-sm text-muted-foreground">Компания</p>
              <p class="font-medium">{{ authStore.user.company_name }}</p>
            </div>
            <div v-if="authStore.user?.inn">
              <p class="text-sm text-muted-foreground">ИНН</p>
              <p class="font-medium">{{ authStore.user.inn }}</p>
            </div>
            <div v-if="authStore.user?.phone">
              <p class="text-sm text-muted-foreground">Телефон</p>
              <p class="font-medium">{{ authStore.user.phone }}</p>
            </div>
            <div v-if="authStore.user?.premium_expiry">
              <p class="text-sm text-muted-foreground">Премиум до</p>
              <p class="font-medium">{{ formatDate(authStore.user.premium_expiry) }}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Основная сетка -->
      <div v-if="!isLoading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Левая колонка -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Карусель счетов -->
          <AccountCarousel
            :accounts="accounts"
            :selected-account="selectedAccount"
            @account-change="handleAccountChange"
          />

          <!-- Рекламный блок -->
          <PromoCard />
        </div>

        <!-- Правая колонка -->
        <div class="lg:col-span-2 space-y-6">
          <!-- История транзакций -->
          <TransactionsHistory
            :transactions="currentTransactions"
            :loading="loadingTransactions"
            :current-account="currentAccountForTransactions"
          />

          <!-- Диаграммы аналитики -->
          <AnalyticsCharts :transactions="currentTransactions" :account="selectedAccount" />
        </div>
      </div>

      <!-- Состояние загрузки -->
      <div v-else class="text-center py-12">
        <div
          class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
        ></div>
        <p class="text-muted-foreground">Загрузка данных профиля...</p>
      </div>

      <!-- Пустое состояние -->
      <div v-if="!isLoading && accounts.length === 0" class="text-center py-12">
        <Wallet class="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 class="text-lg font-medium mb-2">Нет подключенных счетов</h3>
        <p class="text-muted-foreground mb-6">Подключите банки для просмотра аналитики</p>
        <Button @click="$router.push('/')">
          <ArrowLeft class="w-4 h-4 mr-2" />
          Перейти к подключению банков
        </Button>
      </div>

      <!-- Ошибка загрузки -->
      <Alert v-if="error" variant="destructive" class="mt-6">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAccountStore } from '@/store/AccountStore'
import { useAuthStore } from '@/store/AuthStore'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Wallet, ArrowLeft } from 'lucide-vue-next'
import AccountCarousel from '@/widgets/profile/ui/AccountCarousel.vue'
import TransactionsHistory from '@/widgets/profile/ui/TransactionsHistory.vue'
import AnalyticsCharts from '@/widgets/profile/ui/AnalyticsCharts.vue'
import PromoCard from '@/widgets/promo/ui/PromoCards.vue'
import type { Account, BankName } from '@/entities/account/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const router = useRouter()
const accountStore = useAccountStore()
const authStore = useAuthStore()

const selectedAccount = ref<(Account & { bank: string }) | null>(null)
const loadingTransactions = ref(false)
const isLoading = ref(true)
const error = ref('')

// Все счета из всех банков
const accounts = computed(() => {
  const allAccounts: Array<Account & { bank: string }> = []
  Object.values(accountStore.banks).forEach((bank) => {
    if (bank.status === 'connected' && bank.accounts.length > 0) {
      bank.accounts.forEach((account) => {
        allAccounts.push({
          ...account,
          bank: bank.name,
        })
      })
    }
  })
  return allAccounts
})

const currentTransactions = computed(() => {
  if (!selectedAccount.value) return []
  return accountStore.transactions
})

const accountTypeText = computed(() => {
  const type = authStore.user?.type_account
  switch (type) {
    case 0: return 'Физическое лицо'
    case 1: return 'Юридическое лицо'
    case 2: return 'Индивидуальный предприниматель'
    default: return 'Неизвестный тип'
  }
})

const currentAccountForTransactions = computed(() => {
  if (!selectedAccount.value) return undefined

  return {
    accountId: selectedAccount.value.accountId,
    bank: selectedAccount.value.bank,
    nickname: selectedAccount.value.nickname
  }
})

const formatDate = (dateString: string) => {
  if (!dateString) return '--'
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date)
}

const handleAccountChange = async (account: Account & { bank: string }) => {
  selectedAccount.value = account
  loadingTransactions.value = true
  error.value = ''

  try {
    const bankName = account.bank as BankName
    if (['vbank', 'abank', 'sbank'].includes(bankName)) {
      await accountStore.fetchTransactions(account.accountId, bankName)
    } else {
      throw new Error(`Неизвестный банк: ${account.bank}`)
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки транзакций'
    console.error('Error loading transactions:', e)
  } finally {
    loadingTransactions.value = false
  }
}

const loadInitialData = async () => {
  isLoading.value = true
  error.value = ''

  try {
    if (!authStore.isInitialized) {
      await authStore.initAuth()
    }

    if (!authStore.isAuthenticated) {
      await router.push('/login')
      return
    }

    if (!accountStore.isInitialized) {
      await accountStore.initializeAccounts()
    }

    if (accounts.value.length > 0 && accounts.value[0]) {
      selectedAccount.value = accounts.value[0]
      await handleAccountChange(accounts.value[0])
    } else {
      await accountStore.fetchBankStatuses()

      if (accounts.value.length > 0 && accounts.value[0]) {
        selectedAccount.value = accounts.value[0]
        await handleAccountChange(accounts.value[0])
      }
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Ошибка загрузки данных профиля'
    console.error('Error loading profile data:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  await loadInitialData()
})

watch(
  () => accountStore.connectedBanks,
  (newConnectedBanks) => {
    if (newConnectedBanks.length > 0 && accounts.value.length > 0 && !selectedAccount.value && accounts.value[0]) {
      selectedAccount.value = accounts.value[0]
      handleAccountChange(accounts.value[0])
    }
  },
  { deep: true },
)
</script>
