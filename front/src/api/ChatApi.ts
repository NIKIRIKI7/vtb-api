import api from './base.ts'
import type { ChatPayload, ChatHistory, ChatResponse } from '@/entities/chat/types.ts'

export default class ChatApi {
  static async sendMessage(payload: ChatPayload) {
    return api.post<ChatResponse>('/ai/chat', payload)
  }

  static async getHistory() {
    return api.get<ChatHistory>('/ai/history')
  }
}
