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
  const allTransactions = ref<Transaction[]>([])
  const isLoadingAllTransactions = ref(false)
  const currentTransactionData = ref<TransactionData | null>(null)
  const isDetailsModalOpen = ref(false)
  const transactionForDetails = ref<Transaction | null>(null)

  const isLoadingStatuses = ref(false)
  const isLoadingTransactions = ref(false)
  const isInitialized = ref(false)

  const connectingBank = ref<BankName | null>(null)
  const error = ref<string | null>(null)

  const connectedBanks = computed(() =>
    Object.values(banks.value).filter((b) => b.status === 'connected')
  )

  async function fetchBankStatus(bankName: BankName) {
    try {
      const { data } = await AccountApi.getBankStatus(bankName)
      banks.value[bankName].status = data.connected ? 'connected' : 'disconnected'
      console.log(`[Store] Статус для ${bankName}: ${banks.value[bankName].status}`)
    } catch (e) {
      banks.value[bankName].status = 'disconnected'
      console.error(`[Store] Ошибка загрузки статуса для ${bankName}:`, parseApiError(e))
    }
  }

  async function fetchBankStatuses() {
    isLoadingStatuses.value = true
    error.value = null
    console.log('[Store] Начало загрузки статусов банков')
    const statusPromises = ALL_BANKS.map(bankName => fetchBankStatus(bankName))
    await Promise.all(statusPromises)
    isLoadingStatuses.value = false
    console.log('[Store] Загрузка статусов банков завершена')
  }

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

  // <-- Новая функция
  async function fetchAllTransactionsForAllAccounts() {
    if (allTransactions.value.length > 0) {
      console.log('[Store] Все транзакции уже загружены, пропуск.');
      return;
    }
    isLoadingAllTransactions.value = true;
    error.value = null;
    console.log('[Store] Начало загрузки всех транзакций по всем счетам.');

    try {
      const allAccounts = Object.values(banks.value)
        .filter(b => b.status === 'connected')
        .flatMap(b => b.accounts.map(acc => ({ ...acc, bankName: b.name })));

      const transactionPromises = allAccounts.map(account =>
        AccountApi.getTransactions(account.accountId, account.bankName)
          .then(res => res.data.transactions)
          .catch(e => {
            console.error(`Не удалось загрузить транзакции для счета ${account.accountId}:`, e);
            return []; // Возвращаем пустой массив в случае ошибки
          })
      );

      const transactionsByAccount = await Promise.all(transactionPromises);
      allTransactions.value = transactionsByAccount.flat();
      console.log(`[Store] Всего загружено ${allTransactions.value.length} транзакций.`);
    } catch (e) {
      error.value = parseApiError(e);
      console.error('[Store] Ошибка при загрузке всех транзакций:', error.value);
    } finally {
      isLoadingAllTransactions.value = false;
    }
  }


  function showTransactionDetails(transactionId: string) {
    const found = transactions.value.find(t => t.transactionId === transactionId);
    if (found) {
      transactionForDetails.value = found;
      isDetailsModalOpen.value = true;
      console.log('[Store] Отображение деталей для транзакции:', found);
    } else {
      console.error(`[Store] Транзакция с ID ${transactionId} не найдена.`);
    }
  }

  function hideTransactionDetails() {
    isDetailsModalOpen.value = false;
    transactionForDetails.value = null;
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
    allTransactions.value = []
    currentTransactionData.value = null
    isLoadingStatuses.value = false
    isLoadingTransactions.value = false
    isLoadingAllTransactions.value = false
    connectingBank.value = null
    error.value = null
    isDetailsModalOpen.value = false
    transactionForDetails.value = null
    isInitialized.value = false
    console.log('[Store] Состояние счетов сброшено.')
  }
  async function fetchProfileData() {
    await fetchBankStatuses()
    const accountPromises = connectedBanks.value.map(bank => fetchAccountsForBank(bank.name))
    await Promise.all(accountPromises)
  }

  async function initializeAccounts() {
    if (isInitialized.value) return

    isLoadingStatuses.value = true
    try {
      await fetchBankStatuses()
      const connectedBanksList = connectedBanks.value
      const accountPromises = connectedBanksList.map(bank =>
        fetchAccountsForBank(bank.name)
      )
      await Promise.all(accountPromises)
      isInitialized.value = true
    } catch (error) {
      console.error('Error initializing accounts:', error)
    } finally {
      isLoadingStatuses.value = false
    }
  }

  return {
    banks,
    transactions,
    allTransactions,
    isLoadingAllTransactions,
    currentTransactionData,
    isLoadingStatuses,
    isLoadingTransactions,
    connectingBank,
    error,
    connectedBanks,
    isDetailsModalOpen,
    transactionForDetails,
    fetchBankStatuses,
    fetchAccountsForBank,
    isInitialized,
    fetchAllAccounts,
    fetchAllTransactionsForAllAccounts,
    fetchTransactions,
    connectBank,
    showTransactionDetails,
    hideTransactionDetails,
    $reset,
    fetchProfileData,
    initializeAccounts
  }
})
