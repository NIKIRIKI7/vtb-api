<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAccountStore } from '@/store/AccountStore'
import TransactionsTableWidget from '@/widgets/transactions-table/ui/TransactionsTableWidget.vue'
import { columns } from '@/widgets/transactions-table/model/columns'
import type { BankName } from '@/entities/account/types'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, Download, X } from 'lucide-vue-next'
import type { MappedTransaction } from '@/widgets/transactions-table/model/types'

const route = useRoute()
const accountStore = useAccountStore()

const accountId = ref(route.query.accountId as string || '')
const bank = ref(route.query.bank as BankName || '')

const transactions = computed(() => accountStore.transactions)

const totalIncome = computed(() => {
  return transactions.value
    .filter(t => t.creditDebitIndicator === 'Credit')
    .reduce((sum, t) => sum + parseFloat(t.amount.amount), 0)
})

const totalExpense = computed(() => {
  return transactions.value
    .filter(t => t.creditDebitIndicator === 'Debit')
    .reduce((sum, t) => sum + parseFloat(t.amount.amount), 0)
})

const balance = computed(() => totalIncome.value - totalExpense.value)

const formatCurrency = (amount: number, currency: string = 'RUB') => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency }).format(amount)
}

const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long', timeStyle: 'medium' }).format(new Date(dateString))
}

const getCategoryName = (category: string | undefined, indicator: 'Credit' | 'Debit'): string => {
  if (category) {
    const categoryMap: Record<string, string> = {
      grocery: 'Продукты',
      cafe: 'Рестораны',
    }
    return categoryMap[category] || category
  }
  if (indicator === 'Credit') return 'Поступление'
  return 'Списание'
}

const tableData = computed((): MappedTransaction[] => {
  console.log('[TransactionsPage] Recalculating tableData based on transactions:', transactions.value)
  if (!transactions.value) return []
  return transactions.value.map(t => ({
    id: t.transactionId,
    date: t.bookingDateTime,
    description: t.transactionInformation,
    merchantName: t.merchant?.name,
    cardInfo: t.card ? { name: t.card.cardName, number: t.card.cardNumber } : undefined,
    amount: parseFloat(t.amount.amount),
    currency: t.amount.currency as 'RUB' | 'USD' | 'EUR',
    type: t.creditDebitIndicator === 'Credit' ? 'credit' : 'debit',
    category: getCategoryName(t.merchant?.category, t.creditDebitIndicator),
  }))
})

const fetch_transactions = () => {
  if (accountId.value && bank.value) {
    console.log(`[TransactionsPage] Fetching transactions for account ${accountId.value}`)
    accountStore.fetchTransactions(accountId.value, bank.value)
  } else {
    console.warn('[TransactionsPage] AccountId or Bank is missing, skipping fetch.')
  }
}

onMounted(fetch_transactions)
watch(() => route.query, (newQuery) => {
  console.log('[TransactionsPage] Route query changed:', newQuery)
  accountId.value = newQuery.accountId as string || ''
  bank.value = newQuery.bank as BankName || ''
  fetch_transactions()
})

const exportToPDF = () => {
  alert('Экспорт в PDF (функция в разработке)')
}
</script>

<template>
  <div class="space-y-6">
    <!-- Заголовок с действиями -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 class="text-3xl font-bold tracking-tight">
          История транзакций
        </h1>
        <p class="text-muted-foreground mt-1">
          Счет: <span class="font-medium">{{ accountId }}</span> | Банк: <span class="font-medium uppercase">{{ bank }}</span>
        </p>
      </div>
      <div class="flex gap-2">
        <Button variant="outline" @click="exportToPDF">
          <Download class="mr-2 h-4 w-4" />
          Экспорт в PDF
        </Button>
      </div>
    </div>

    <Alert v-if="accountStore.error" variant="destructive">
      <AlertDescription>{{ accountStore.error }}</AlertDescription>
    </Alert>

    <!-- Карточки статистики -->
    <div v-if="!accountStore.isLoadingTransactions && transactions.length > 0" class="grid gap-4 md:grid-cols-3">
      <div class="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Сальдо за период</p>
            <h3 class="text-2xl font-bold mt-2" :class="balance >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(balance) }}
            </h3>
          </div>
          <div class="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet class="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
      <div class="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Доходы</p>
            <h3 class="text-2xl font-bold text-green-600 mt-2">
              {{ formatCurrency(totalIncome) }}
            </h3>
          </div>
          <div class="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
            <TrendingUp class="h-6 w-6 text-green-600" />
          </div>
        </div>
      </div>
      <div class="rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Расходы</p>
            <h3 class="text-2xl font-bold text-red-600 mt-2">
              {{ formatCurrency(totalExpense) }}
            </h3>
          </div>
          <div class="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
            <TrendingDown class="h-6 w-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Таблица транзакций -->
    <div class="rounded-lg border bg-card shadow-sm">
      <div v-if="accountStore.isLoadingTransactions" class="text-center py-20 text-muted-foreground">
        Загрузка транзакций...
      </div>
      <div v-else-if="!accountId || !bank" class="text-center py-20 text-muted-foreground">
        <p>Выберите счет для просмотра транзакций.</p>
      </div>
      <TransactionsTableWidget v-else :columns="columns" :data="tableData" />
    </div>

    <!-- Модальное окно деталей транзакции -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition-opacity duration-200 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div v-if="accountStore.isDetailsModalOpen && accountStore.transactionForDetails" @click.self="accountStore.hideTransactionDetails()" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-200 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <Card class="w-full max-w-2xl relative bg-white">
              <CardHeader class="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Детали транзакции</CardTitle>
                  <CardDescription class="truncate max-w-md">{{ accountStore.transactionForDetails.transactionId }}</CardDescription>
                </div>
                <Button variant="ghost" size="icon-sm" @click="accountStore.hideTransactionDetails()">
                  <X class="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent class="grid gap-4 text-sm">
                <div class="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div class="font-semibold text-muted-foreground">Сумма</div>
                  <div class="text-right font-bold" :class="accountStore.transactionForDetails.creditDebitIndicator === 'Credit' ? 'text-green-600' : 'text-red-600'">
                    {{ formatCurrency(Number(accountStore.transactionForDetails.amount.amount), accountStore.transactionForDetails.amount.currency) }}
                  </div>

                  <div class="font-semibold text-muted-foreground">Статус</div>
                  <div class="text-right capitalize">{{ accountStore.transactionForDetails.status }}</div>

                  <div class="font-semibold text-muted-foreground">Дата операции</div>
                  <div class="text-right">{{ formatDate(accountStore.transactionForDetails.bookingDateTime) }}</div>

                  <div v-if="accountStore.transactionForDetails.valueDateTime" class="font-semibold text-muted-foreground">Дата валютирования</div>
                  <div v-if="accountStore.transactionForDetails.valueDateTime" class="text-right">{{ formatDate(accountStore.transactionForDetails.valueDateTime) }}</div>
                </div>

                <div v-if="accountStore.transactionForDetails.card" class="border-t pt-4 grid grid-cols-2 gap-x-8 gap-y-3">
                  <h4 class="col-span-2 font-semibold text-base mb-1">Карта</h4>
                  <div class="font-semibold text-muted-foreground">Название</div>
                  <div class="text-right">{{ accountStore.transactionForDetails.card.cardName }}</div>
                  <div class="font-semibold text-muted-foreground">Номер</div>
                  <div class="text-right">{{ accountStore.transactionForDetails.card.cardNumber }}</div>
                  <div class="font-semibold text-muted-foreground">Тип</div>
                  <div class="text-right capitalize">{{ accountStore.transactionForDetails.card.cardType }}</div>
                </div>

                <div v-if="accountStore.transactionForDetails.merchant" class="border-t pt-4 grid grid-cols-2 gap-x-8 gap-y-3">
                  <h4 class="col-span-2 font-semibold text-base mb-1">Продавец</h4>
                  <div class="font-semibold text-muted-foreground">Название</div>
                  <div class="text-right">{{ accountStore.transactionForDetails.merchant.name }}</div>
                  <div class="font-semibold text-muted-foreground">Категория</div>
                  <div class="text-right capitalize">{{ accountStore.transactionForDetails.merchant.category }} (MCC: {{ accountStore.transactionForDetails.merchant.mccCode }})</div>
                  <div class="font-semibold text-muted-foreground">Адрес</div>
                  <div class="text-right">{{ accountStore.transactionForDetails.merchant.address }}</div>
                </div>

              </CardContent>
              <CardFooter>
                <Button variant="outline" class="ml-auto" @click="accountStore.hideTransactionDetails()">Закрыть</Button>
              </CardFooter>
            </Card>
          </Transition>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
