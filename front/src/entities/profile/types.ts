export interface ProfileData {
  user: {
    email: string
    first_name: string
    type_account: number
    premium: boolean
  }
  accounts: Array<{
    accountId: string
    nickname: string
    currency: string
    balance: {
      amount: {
        amount: string
        currency: string
      }
    }
    bank: string
  }>
  transactions: Array<{
    transactionId: string
    bookingDateTime: string
    transactionInformation: string
    amount: {
      amount: string
      currency: string
    }
    creditDebitIndicator: 'Credit' | 'Debit'
    status: string
  }>
}
