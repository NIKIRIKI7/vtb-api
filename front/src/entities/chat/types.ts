export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isTyping?: boolean
  isRead?: boolean
}

export interface ChatHistory {
  user_id: number
  history: Array<{
    role: 'user' | 'assistant'
    message: string
    created_at: string
  }>
  count: number
}

export interface ChatPayload {
  message: string
  bank: string
}

export interface ChatResponse {
  response: string
  bank: string
  user: string
  assistant: string
  transactions_count: number
}

export interface ChatState {
  messages: ChatMessage[]
}

export interface BankChats {
  [bankName: string]: ChatState
}
