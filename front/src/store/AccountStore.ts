import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import AccountApi from '@/api/AccountApi'
import type { Bank, BankName, TransactionData, Account } from '@/entities/account/types'
import type { Transaction } from '@/entities/transaction/types'
import { parseApiError } from '@/composables/parseApiError'

const ALL_BANKS: BankName[] = ['vbank', 'abank', 'sbank']

export const useAccountStore = defineStore('accounts', () => {
  const banks = ref<Record<BankName, Bank>>(
    ALL_BANKS.reduce((acc, name) => {
      acc[name] = {
        name,
        status: 'pending',
        isLoadingAccounts: false,
        accounts: [],
      }
      return acc
    }, {} as Record<BankName, Bank>)
  )

  const transactions = ref<Transaction[]>([])
  const currentTransactionData = ref<TransactionData | null>(null)

  const isLoadingStatuses = ref(false)
  const isLoadingTransactions = ref(false)
  /**
   * Хранит название банка, который находится в процессе подключения.
   * Null, если процесс не идет. Используется для отображения состояния загрузки на кнопке.
   * @type {import('vue').Ref<BankName | null>}
   */
  const connectingBank = ref<BankName | null>(null)
  const error = ref<string | null>(null)

  const connectedBanks = computed(() =>
    Object.values(banks.value).filter((b) => b.status === 'connected')
  )

  /**
   * Запрашивает и обновляет статус для одного конкретного банка.
   * @param {BankName} bankName - Название банка.
   * @returns {Promise<void>}
   */
  async function fetchBankStatus(bankName: BankName) {
    try {
      const { data } = await AccountApi.getBankStatus(bankName)
      banks.value[bankName].status = data.connected ? 'connected' : 'disconnected'
      console.log(`[Store] Статус для ${bankName}: ${banks.value[bankName].status}`)
    } catch (e) {
      banks.value[bankName].status = 'disconnected'
      console.error(`[Store] Ошибка загрузки статуса для ${bankName}:`, parseApiError(e))
      // Не устанавливаем глобальную ошибку, чтобы не мешать другим банкам
    }
  }

  /**
   * Запрашивает статусы всех банков из списка ALL_BANKS.
   * @returns {Promise<void>}
   */
  async function fetchBankStatuses() {
    isLoadingStatuses.value = true
    error.value = null
    console.log('[Store] Начало загрузки статусов банков')
    const statusPromises = ALL_BANKS.map(bankName => fetchBankStatus(bankName))
    await Promise.all(statusPromises)
    isLoadingStatuses.value = false
    console.log('[Store] Загрузка статусов банков завершена')
  }

  /**
   * Управляет процессом подключения банка. Устанавливает состояние загрузки,
   * вызывает API для создания согласия, обновляет статус банка и, в случае успеха,
   * загружает список счетов для этого банка.
   * @param {BankName} bankName - Название банка для подключения.
   * @returns {Promise<void>}
   */
  async function connectBank(bankName: BankName) {
    connectingBank.value = bankName;
    error.value = null;
    console.log(`[Store] Начало подключения банка: ${bankName}`);
    try {
      await AccountApi.connectBank(bankName);
      console.log(`[Store] Запрос на подключение ${bankName} отправлен. Обновляю статус.`);
      await fetchBankStatus(bankName);
      if (banks.value[bankName].status === 'connected') {
        await fetchAccountsForBank(bankName);
      } else {
        // Для sbank может потребоваться ручное подтверждение
        console.log(`[Store] Банк ${bankName} требует подтверждения. Статус: ${banks.value[bankName].status}`);
      }
    } catch(e) {
      error.value = parseApiError(e)
      console.error(`[Store] Ошибка подключения банка ${bankName}:`, error.value)
    } finally {
      connectingBank.value = null;
    }
  }

  async function fetchAccountsForBank(bankName: BankName) {
    if (banks.value[bankName].status !== 'connected') {
      console.log(`[Store] Банк ${bankName} не подключен, пропуск загрузки счетов.`)
      return
    }

    banks.value[bankName].isLoadingAccounts = true
    error.value = null
    console.log(`[Store] Начало загрузки счетов для банка: ${bankName}`)

    try {
      const { data } = await AccountApi.getAccounts(bankName)
      // Дополнительная проверка структуры данных для предотвращения ошибок
      const validAccounts = data.accounts ? data.accounts.filter(acc => acc && typeof acc === 'object') : [];
      banks.value[bankName].accounts = validAccounts as Account[];
      console.log(`[Store] Для банка ${bankName} загружено ${validAccounts.length} счетов.`)
    } catch (e) {
      error.value = parseApiError(e)
      console.error(`[Store] Ошибка загрузки счетов для банка ${bankName}:`, error.value, e)
    } finally {
      banks.value[bankName].isLoadingAccounts = false
    }
  }

  async function fetchAllAccounts() {
    await fetchBankStatuses()
    const accountPromises = connectedBanks.value.map(bank => fetchAccountsForBank(bank.name))
    await Promise.all(accountPromises)
  }

  async function fetchTransactions(accountId: string, bankName: BankName) {
    isLoadingTransactions.value = true
    transactions.value = []
    currentTransactionData.value = null
    error.value = null
    console.log(`[Store] Начало загрузки транзакций для счета ${accountId}`)

    try {
      const { data } = await AccountApi.getTransactions(accountId, bankName)
      transactions.value = data.transactions
      currentTransactionData.value = data
      console.log(`[Store] Загружено ${data.transactions.length} транзакций.`)
    } catch (e) {
      error.value = parseApiError(e)
      console.error(`[Store] Ошибка загрузки транзакций:`, error.value)
    } finally {
      isLoadingTransactions.value = false
    }
  }

  function $reset() {
    ALL_BANKS.forEach(name => {
      banks.value[name] = {
        name,
        status: 'pending',
        isLoadingAccounts: false,
        accounts: [],
      }
    })
    transactions.value = []
    currentTransactionData.value = null
    isLoadingStatuses.value = false
    isLoadingTransactions.value = false
    connectingBank.value = null
    error.value = null
    console.log('[Store] Состояние счетов сброшено.')
  }

  return {
    banks,
    transactions,
    currentTransactionData,
    isLoadingStatuses,
    isLoadingTransactions,
    connectingBank,
    error,
    connectedBanks,
    fetchBankStatuses,
    fetchAccountsForBank,
    fetchAllAccounts,
    fetchTransactions,
    connectBank,
    $reset
  }
})
