export interface MappedTransaction {
  id: string
  date: string
  description: string
  merchantName?: string
  cardInfo?: {
    name: string
    number: string
  }
  amount: number
  currency: 'RUB' | 'USD' | 'EUR'
  type: 'debit' | 'credit'
  category: string
}
