import type { Transaction } from '@/entities/transaction/types'

export type BankName = 'vbank' | 'abank' | 'sbank'

export interface BankStatus {
  bank: BankName
  status: string
  connected: boolean
  req_id?: string
  consent_id?: string
}

export interface Balance {
  amount: {
    amount: string
    currency: string
  }
  creditDebitIndicator: 'Credit' | 'Debit'
  type: string
  dateTime: string
  creditLine?: {
    included: boolean
    amount?: {
      amount: string
      currency: string
    }
    type: string
  }[]
}

export interface Account {
  accountId: string
  currency: string
  accountType: string
  accountSubType: string
  description: string
  nickname: string
  balance: Balance
}

export interface Bank {
  name: BankName
  status: 'pending' | 'connected' | 'disconnected' | 'loading'
  isLoadingAccounts: boolean
  accounts: Account[]
}

export interface TransactionData {
  bank: BankName
  accountId: string
  total: number
  transactions: Transaction[]
  fetched_at: string
}
