<!-- src/pages/profile/ui/TransactionsHistory.vue -->
<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg flex items-center justify-between">
        <span>История операций</span>
        <Badge variant="secondary">
          {{ transactions.length }} операций
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Состояние загрузки -->
      <div v-if="loading" class="text-center py-8 text-muted-foreground">
        <p>Загрузка транзакций...</p>
      </div>

      <!-- Пустое состояние -->
      <div
        v-else-if="transactions.length === 0"
        class="text-center py-8 text-muted-foreground"
      >
        <History class="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>Нет операций по этому счету</p>
      </div>

      <!-- Список транзакций -->
      <div v-else class="space-y-3 max-h-96 overflow-y-auto">
        <div
          v-for="transaction in transactions.slice(0, 10)"
          :key="transaction.transactionId"
          class="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
        >
          <div class="flex items-center gap-3">
            <!-- Иконка типа операции -->
            <div
              class="h-10 w-10 rounded-full flex items-center justify-center"
              :class="transaction.creditDebitIndicator === 'Credit'
                ? 'bg-green-100 text-green-600'
                : 'bg-red-100 text-red-600'
              "
            >
              <ArrowDownRight
                v-if="transaction.creditDebitIndicator === 'Debit'"
                class="h-5 w-5"
              />
              <ArrowUpLeft
                v-else
                class="h-5 w-5"
              />
            </div>

            <!-- Информация о транзакции -->
            <div>
              <p class="font-medium text-sm">
                {{ transaction.transactionInformation }}
              </p>
              <p class="text-xs text-muted-foreground">
                {{ formatDate(transaction.bookingDateTime) }}
              </p>
            </div>
          </div>

          <!-- Сумма -->
          <div
            class="text-right"
            :class="transaction.creditDebitIndicator === 'Credit'
              ? 'text-green-600'
              : 'text-red-600'
            "
          >
            <p class="font-semibold">
              {{ transaction.creditDebitIndicator === 'Credit' ? '+' : '-' }}
              {{ formatCurrency(
              transaction.amount.amount,
              transaction.amount.currency
            )
              }}
            </p>
            <p class="text-xs text-muted-foreground capitalize">
              {{ transaction.creditDebitIndicator === 'Credit' ? 'зачисление' : 'списание' }}
            </p>
          </div>
        </div>

        <!-- Кнопка "Показать все" если транзакций больше 10 -->
        <div v-if="transactions.length > 10" class="text-center pt-2">
          <Button variant="outline" size="sm" @click="showAllTransactions">
            Показать все операции
          </Button>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { History, ArrowDownRight, ArrowUpLeft } from 'lucide-vue-next'
import type { Transaction } from '@/entities/transaction/types'
import { Badge } from '@/components/ui/badge'

interface Props {
  transactions: Transaction[]
  loading: boolean
  currentAccount?: {
    accountId: string
    bank: string
    nickname?: string
  }
}

const props = defineProps<Props>()

const router = useRouter()

const formatCurrency = (amount: string, currency: string) => {
  const numericAmount = Number(amount)
  if (isNaN(numericAmount)) return '--'

  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency,
  }).format(numericAmount)
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const showAllTransactions = () => {
  if (props.currentAccount) {
    router.push({
      path: '/transactions',
      query: {
        accountId: props.currentAccount.accountId,
        bank: props.currentAccount.bank,
        nickname: props.currentAccount.nickname || 'Основной счет'
      }
    })
  } else {
    router.push('/transactions')
  }
}
</script>
