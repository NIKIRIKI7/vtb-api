<template>
  <Card>
    <CardHeader>
      <CardTitle class="text-lg">Аналитика расходов</CardTitle>
    </CardHeader>
    <CardContent>
      <!-- Пустое состояние -->
      <div v-if="!hasData" class="text-center py-12 text-muted-foreground">
        <PieChart class="h-16 w-16 mx-auto mb-4 opacity-50" />
        <p>Недостаточно данных для анализа</p>
      </div>

      <!-- Графики -->
      <div v-else class="space-y-6">
        <!-- Распределение по категориям -->
        <div>
          <h4 class="font-medium mb-4">Расходы по категориям</h4>
          <div class="h-48">
            <PieChartComponent :data="pieChartData" />
          </div>
        </div>

        <!-- Динамика расходов по месяцам -->
        <div>
          <h4 class="font-medium mb-4">Динамика расходов</h4>
          <div class="h-48">
            <LineChartComponent :data="lineChartData" />
          </div>
        </div>

        <!-- Статистика -->
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center p-4 rounded-lg bg-muted/10">
            <p class="text-2xl font-bold text-red-600">
              {{ formatCurrency(totalExpenses) }}
            </p>
            <p class="text-sm text-muted-foreground">Всего расходов</p>
          </div>
          <div class="text-center p-4 rounded-lg bg-muted/10">
            <p class="text-2xl font-bold text-green-600">
              {{ formatCurrency(totalIncome) }}
            </p>
            <p class="text-sm text-muted-foreground">Всего доходов</p>
          </div>
        </div>

        <!-- Топ категорий -->
        <div>
          <h4 class="font-medium mb-3">Топ категорий расходов</h4>
          <div class="space-y-2">
            <div
              v-for="category in topCategories"
              :key="category.name"
              class="flex items-center justify-between"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1">
                <div
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: getCategoryColor(category.name) }"
                />
                <span class="text-sm truncate">{{ category.name }}</span>
              </div>
              <div class="flex items-center gap-2 ml-3">
                <div class="w-20 bg-muted rounded-full h-2 shrink-0">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    :style="{
                      width: `${category.percentage}%`,
                      backgroundColor: getCategoryColor(category.name),
                    }"
                  />
                </div>
                <span class="text-sm font-medium w-20 text-right shrink-0">
                  {{ formatCurrency(category.amount) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart } from 'lucide-vue-next'
import PieChartComponent from './PieChart.vue'
import LineChartComponent from './LineChart.vue'
import type { Account } from '@/entities/account/types'
import type { Transaction } from '@/entities/transaction/types'

interface Props {
  transactions: Transaction[]
  account: Account | null
}

const props = defineProps<Props>()

// Цвета для категорий
const categoryColors = {
  Продукты: '#FF6B6B',
  Рестораны: '#4ECDC4',
  Транспорт: '#45B7D1',
  Связь: '#96CEB4',
  ЖКХ: '#FFEAA7',
  Развлечения: '#DDA0DD',
  Здоровье: '#98D8C8',
  Одежда: '#F7DC6F',
  Прочее: '#BB8FCE',
}

const getCategoryColor = (category: string) => {
  return categoryColors[category as keyof typeof categoryColors] || '#BB8FCE'
}

// Аналитика расходов
const expenseTransactions = computed(() => {
  return props.transactions.filter((t) => t.creditDebitIndicator === 'Debit')
})

const incomeTransactions = computed(() => {
  return props.transactions.filter((t) => t.creditDebitIndicator === 'Credit')
})

const totalExpenses = computed(() => {
  return expenseTransactions.value.reduce((sum, t) => sum + parseFloat(t.amount.amount), 0)
})

const totalIncome = computed(() => {
  return incomeTransactions.value.reduce((sum, t) => sum + parseFloat(t.amount.amount), 0)
})

// Категоризация транзакций
const categorizedExpenses = computed(() => {
  const categories: { [key: string]: number } = {}

  expenseTransactions.value.forEach((transaction) => {
    const category = categorizeTransaction(transaction.transactionInformation)
    const amount = parseFloat(transaction.amount.amount)

    if (categories[category]) {
      categories[category] += amount
    } else {
      categories[category] = amount
    }
  })

  return categories
})

const topCategories = computed(() => {
  return Object.entries(categorizedExpenses.value)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
    .map((category) => ({
      ...category,
      percentage: (category.amount / totalExpenses.value) * 100,
    }))
})

// Данные для круговой диаграммы
const pieChartData = computed(() => {
  const categories = categorizedExpenses.value
  const labels = Object.keys(categories)
  const data = Object.values(categories)
  const backgroundColors = labels.map((label) => getCategoryColor(label))

  return {
    labels,
    datasets: [
      {
        data,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color + 'DD'),
        borderWidth: 2,
      },
    ],
  }
})

// Данные для линейного графика (динамика по месяцам)
const lineChartData = computed(() => {
  const monthlyData: { [key: string]: number } = {}

  expenseTransactions.value.forEach((transaction) => {
    const date = new Date(transaction.bookingDateTime)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

    if (monthlyData[monthKey]) {
      monthlyData[monthKey] += parseFloat(transaction.amount.amount)
    } else {
      monthlyData[monthKey] = parseFloat(transaction.amount.amount)
    }
  })

  // Сортируем по дате
  const sortedMonths = Object.keys(monthlyData).sort()
  const labels = sortedMonths.map((month) => {
    const [year, monthNum] = month.split('-')
    return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('ru-RU', {
      month: 'short',
      year: 'numeric',
    })
  })

  const data = sortedMonths.map((month) => monthlyData[month])

  return {
    labels,
    datasets: [
      {
        label: 'Расходы по месяцам',
        data,
        borderColor: '#FF6B6B',
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4,
      },
    ],
  }
})

const hasData = computed(() => {
  return props.transactions.length > 0 && totalExpenses.value > 0
})

const categorizeTransaction = (description: string): string => {
  const desc = description.toLowerCase()

  if (desc.includes('магазин') || desc.includes('супермаркет') || desc.includes('продукт'))
    return 'Продукты'
  if (
    desc.includes('ресторан') ||
    desc.includes('кафе') ||
    desc.includes('столов') ||
    desc.includes('еда')
  )
    return 'Рестораны'
  if (
    desc.includes('транспорт') ||
    desc.includes('такси') ||
    desc.includes('метро') ||
    desc.includes('автобус') ||
    desc.includes('бензин')
  )
    return 'Транспорт'
  if (
    desc.includes('интернет') ||
    desc.includes('связь') ||
    desc.includes('телефон') ||
    desc.includes('мобильн')
  )
    return 'Связь'
  if (
    desc.includes('коммунал') ||
    desc.includes('квартплата') ||
    desc.includes('электр') ||
    desc.includes('вод')
  )
    return 'ЖКХ'
  if (
    desc.includes('развлеч') ||
    desc.includes('кино') ||
    desc.includes('театр') ||
    desc.includes('концерт')
  )
    return 'Развлечения'
  if (
    desc.includes('аптек') ||
    desc.includes('больни') ||
    desc.includes('врач') ||
    desc.includes('медиц')
  )
    return 'Здоровье'
  if (desc.includes('одежд') || desc.includes('обув') || desc.includes('магазин')) return 'Одежда'

  return 'Прочее'
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(amount)
}
</script>
