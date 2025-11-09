import api from './base.ts'
import type { BankStatus, Account, TransactionData } from '@/entities/account/types.ts'

export default class AccountApi {
  private static DUMMY_AUTH_HEADER = {
    headers: {
      Authorization: 'Bearer placeholder'
    }
  }

  /**
   * Запрашивает статус подключения для указанного банка.
   * @param {string} bankName - Название банка (vbank, abank, sbank).
   * @returns {Promise<import('axios').AxiosResponse<BankStatus>>} Ответ API со статусом банка.
   */
  static async getBankStatus(bankName: string) {
    console.log(`[API] Запрос статуса для банка: ${bankName}`)
    // Этот эндпоинт аутентифицируется через cookie, заголовок не нужен.
    return api.get<BankStatus>(`/banks/${bankName}/status`)
  }

  /**
   * Инициирует процесс подключения нового банка (создание согласия).
   * @param {string} bankName - Название банка для подключения (vbank, abank, sbank).
   * @returns {Promise<import('axios').AxiosResponse<any>>} Ответ API о начале процесса подключения.
   */
  static async connectBank(bankName: string) {
    console.log(`[API] Запрос на подключение банка: ${bankName}`)
    return api.post(`/banks/${bankName}/connect`)
  }

  /**
   * Получает список счетов и их балансы для подключенного банка.
   * @param {string} bankName - Название банка.
   * @returns {Promise<import('axios').AxiosResponse<{ accounts: Account[] }>>} Ответ API со списком счетов.
   */
  static async getAccounts(bankName: string) {
    console.log(`[API] Запрос счетов для банка: ${bankName}`)
    return api.get<{ accounts: Account[] }>(`/accounts`, {
      params: { bank: bankName },
      ...this.DUMMY_AUTH_HEADER,
    })
  }

  /**
   * Получает полную историю транзакций для указанного счета.
   * @param {string} accountId - ID счета.
   * @param {string} bankName - Название банка, которому принадлежит счет.
   * @returns {Promise<import('axios').AxiosResponse<TransactionData>>} Ответ API с полным списком транзакций.
   */
  static async getTransactions(accountId: string, bankName: string) {
    console.log(`[API] Запрос транзакций для счета ${accountId} в банке ${bankName}`)
    return api.get<TransactionData>(`/accounts/${accountId}/transactions/full`, {
      params: { bank: bankName },
      ...this.DUMMY_AUTH_HEADER,
    })
  }
}
