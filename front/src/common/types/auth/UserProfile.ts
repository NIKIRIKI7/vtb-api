export interface UserProfile {
  id: number
  email: string
  phone: string
  first_name: string
  type_account: string | number
  company_name?: string
  inn?: string
  kpp?: string
  premium?: boolean
  premium_expiry?: string
}
