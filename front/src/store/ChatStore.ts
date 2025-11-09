import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import ChatApi from '@/api/ChatApi.ts'
import { useFetch } from '@/composables/useFetch.ts'
import { parseApiError } from '@/composables/parseApiError.ts'
import type { ChatMessage, ChatPayload, BankChats, ChatState } from '@/entities/chat/types.ts'
import { useAuthStore } from './AuthStore.ts'

export const useChatStore = defineStore('chat', () => {
  const bankChats = ref<BankChats>({
    vbank: { messages: [] },
    abank: { messages: [] },
    sbank: { messages: [] }
  })

  const selectedBank = ref<string>('vbank')
  const { isLoading, error, makeRequest } = useFetch()
  const authStore = useAuthStore()
  const isOpen = ref(false)

  const hasUnreadMessages = computed(() =>
    Object.values(bankChats.value).some(chat =>
      chat.messages.some(msg =>
        msg.role === 'assistant' &&
        (msg.isRead === undefined || !msg.isRead)
      )
    )
  )

  const isPremiumUser = computed(() => authStore.user?.premium || false)


  const messages = computed(() => {
    const chat = bankChats.value[selectedBank.value]
    return chat ? [...chat.messages] : []
  })


  const loadFromStorage = () => {
    try {
      const savedBank = localStorage.getItem('chatSelectedBank')
      if (savedBank) {
        selectedBank.value = savedBank
      }

      const savedIsOpen = localStorage.getItem('chatIsOpen')
      if (savedIsOpen) {
        isOpen.value = JSON.parse(savedIsOpen)
      }

      const savedChats = localStorage.getItem('bankChats')
      if (savedChats) {
        const parsedChats = JSON.parse(savedChats)

        Object.keys(parsedChats).forEach(bankName => {
          if (parsedChats[bankName] && parsedChats[bankName].messages) {
            parsedChats[bankName].messages = parsedChats[bankName].messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }))
          }
        })

        bankChats.value = {
          vbank: { messages: [] },
          abank: { messages: [] },
          sbank: { messages: [] },
          ...parsedChats
        }
      }
    } catch (e) {
      console.warn('Не удалось загрузить данные из localStorage:', e)
    }
  }

  const saveToStorage = () => {
    try {
      localStorage.setItem('chatSelectedBank', selectedBank.value)
      localStorage.setItem('chatIsOpen', JSON.stringify(isOpen.value))
      localStorage.setItem('bankChats', JSON.stringify(bankChats.value))
    } catch (e) {
      console.warn('Не удалось сохранить данные в localStorage:', e)
    }
  }

  const clearStorage = () => {
    try {
      localStorage.removeItem('bankChats')
      localStorage.removeItem('chatIsOpen')
      localStorage.removeItem('chatSelectedBank')
    } catch (e) {
      console.warn('Не удалось очистить данные из localStorage:', e)
    }
  }

  const getCurrentChat = (): ChatState => {
    const chat = bankChats.value[selectedBank.value]
    if (!chat) {
      const newChat: ChatState = { messages: [] }
      bankChats.value[selectedBank.value] = newChat
      return newChat
    }
    return chat
  }

  const sendMessage = async (content: string) => {
    if (!isPremiumUser.value) {
      error.value = 'Доступно только для премиум пользователей'
      return
    }

    const currentChat = getCurrentChat()

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    }

    if (!bankChats.value[selectedBank.value]) {
      bankChats.value[selectedBank.value] = { messages: [] }
    }
    currentChat.messages.push(userMessage)

    const assistantMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true
    }
    currentChat.messages.push(assistantMessage)

    try {
      const payload: ChatPayload = {
        message: content,
        bank: selectedBank.value
      }

      const response = await makeRequest(() => ChatApi.sendMessage(payload))

      const typingIndex = currentChat.messages.findIndex(msg => msg.id === assistantMessage.id)
      if (typingIndex !== -1) {
        currentChat.messages[typingIndex] = {
          ...assistantMessage,
          content: response.data.assistant,
          isTyping: false
        }
      }

      saveToStorage()
      return response.data
    } catch (e) {
      currentChat.messages = currentChat.messages.filter(msg => msg.id !== assistantMessage.id)
      error.value = parseApiError(e)
      throw e
    }
  }


  const loadHistory = async () => {
    try {
      const response = await makeRequest(() => ChatApi.getHistory())
      const currentChat = getCurrentChat()

      currentChat.messages = response.data.history.map(msg => ({
        id: Date.now().toString() + Math.random(),
        role: msg.role,
        content: msg.message,
        timestamp: new Date(msg.created_at)
      }))
      saveToStorage()
    } catch (e) {
      console.error('Ошибка загрузки истории:', e)
    }
  }


  const clearChat = () => {
    bankChats.value = {
      vbank: { messages: [] },
      abank: { messages: [] },
      sbank: { messages: [] }
    }
    error.value = ''
    clearStorage()
  }

  const toggleChat = () => {
    isOpen.value = !isOpen.value
    saveToStorage()
    // if (isOpen.value && authStore.user?.id) {
    //   loadHistory()
    // }
  }

  const setSelectedBank = (bank: string) => {
    selectedBank.value = bank

    if (!bankChats.value[bank]) {
      bankChats.value[bank] = { messages: [] }
    }

    saveToStorage()
  }

  const $reset = () => {
    bankChats.value = {
      vbank: { messages: [] },
      abank: { messages: [] },
      sbank: { messages: [] }
    }
    selectedBank.value = 'vbank'
    isOpen.value = false
    error.value = ''
    clearStorage()
  }

  loadFromStorage()

  return {
    messages,
    isOpen,
    selectedBank,
    isLoading,
    error,
    hasUnreadMessages,
    isPremiumUser,
    sendMessage,
    loadHistory,
    clearChat,
    toggleChat,
    setSelectedBank,
    $reset
  }
})
