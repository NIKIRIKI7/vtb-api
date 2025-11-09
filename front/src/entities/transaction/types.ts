export interface Merchant {
  merchantId: string
  name: string
  mccCode: string
  category: string
  address: string
  city: string
  country: string
  lat?: number
  lng?: number
}

export interface Card {
  cardId: string
  cardName: string
  cardNumber: string
  cardType: 'debit' | 'credit'
}

export interface Transaction {
  accountId: string
  transactionId: string
  bookingDateTime: string
  valueDateTime?: string
  transactionInformation: string
  amount: {
    amount: string
    currency: string
  }
  creditDebitIndicator: 'Credit' | 'Debit'
  status: string
  bankTransactionCode?: {
    code: string
  }
  merchant: Merchant | null
  card?: Card
  counterparty: any | null
}
