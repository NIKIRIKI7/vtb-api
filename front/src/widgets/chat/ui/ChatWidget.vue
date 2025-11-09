<template>
  <div class="fixed bottom-6 right-6 z-50">
    <!-- Кнопка открытия чата -->
    <Button
      @click="toggleChat"
      class="w-14 h-14 rounded-full shadow-lg relative bg-blue-600 hover:bg-blue-700"
    >
      <MessageCircle class="w-6 h-6 text-white" />
    </Button>

    <!-- Окно чата -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 scale-95 translate-y-4"
      enter-to-class="opacity-100 scale-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100 scale-100 translate-y-0"
      leave-to-class="opacity-0 scale-95 translate-y-4"
    >
      <Card
        v-if="chatStore.isOpen"
        class="absolute bottom-16 right-0 w-80 h-96 shadow-xl border flex flex-col bg-white"
      >
        <CardHeader class="pb-3">
          <div class="flex items-center justify-between">
            <CardTitle class="text-sm">AI Помощник</CardTitle>
            <div class="flex items-center gap-2">
              <!-- Выбор банка -->
              <select
                v-model="chatStore.selectedBank"
                @change="handleBankChange"
                class="text-xs border rounded px-2 py-1"
                :disabled="chatStore.isLoading"
              >
                <option value="vbank">V Bank</option>
                <option value="abank">A Bank</option>
                <option value="sbank">S Bank</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                @click="chatStore.clearChat()"
                class="h-8 w-8 p-0"
              >
                <Trash2 class="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div v-if="!chatStore.isPremiumUser" class="text-xs text-amber-600 bg-amber-50 p-2 rounded">
            Доступно только в премиум версии
          </div>
        </CardHeader>

        <CardContent class="pb-3 px-3 flex-1 overflow-hidden">
          <!-- Сообщения -->
          <div class="h-48 overflow-y-auto space-y-3" ref="messagesContainer">
            <div
              v-for="message in chatStore.messages"
              :key="message.id"
              class="flex"
              :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
            >
              <div
                class="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                :class="
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-800'
                "
              >
                <div v-if="message.isTyping" class="flex space-x-1">
                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
                  <div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
                </div>
                <div v-else>{{ message.content }}</div>
                <div class="text-xs opacity-70 mt-1">
                  {{ formatTime(message.timestamp) }}
                </div>
              </div>
            </div>
          </div>

          <!-- Ошибка -->
          <Alert v-if="chatStore.error" variant="destructive" class="mt-2">
            <AlertDescription class="text-xs">
              {{ chatStore.error }}
            </AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter class="pt-0 px-3">
          <!-- Поле ввода -->
          <form @submit.prevent="sendMessage" class="w-full flex gap-2">
            <Input
              v-model="newMessage"
              placeholder="Введите сообщение..."
              class="flex-1 text-sm"
              :disabled="!chatStore.isPremiumUser || chatStore.isLoading"
              @focus="scrollToBottom"
            />
            <Button
              type="submit"
              size="sm"
              :disabled="!newMessage.trim() || chatStore.isLoading || !chatStore.isPremiumUser"
            >
              <Send class="w-4 h-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MessageCircle, Send, Trash2 } from 'lucide-vue-next'
import { useChatStore } from '@/store/ChatStore.ts'

const chatStore = useChatStore()
const newMessage = ref('')
const messagesContainer = ref<HTMLElement>() // 🔥 Ссылка на контейнер сообщений

// 🔥 Функция прокрутки вниз
const scrollToBottom = () => {
  if (messagesContainer.value) {
    // Ждем следующего тика, чтобы DOM обновился
    nextTick(() => {
      messagesContainer.value!.scrollTop = messagesContainer.value!.scrollHeight
    })
  }
}

// 🔥 Прокрутка при открытии чата
const toggleChat = () => {
  chatStore.toggleChat()

  // Если чат открывается, прокручиваем вниз
  if (chatStore.isOpen) {
    // Даем время на анимацию открытия
    setTimeout(() => {
      scrollToBottom()
    }, 300)
  }
}

// 🔥 Прокрутка при изменении сообщений
watch(
  () => chatStore.messages.length,
  () => {
    if (chatStore.isOpen) {
      scrollToBottom()
    }
  },
  { deep: true }
)

const handleBankChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  chatStore.setSelectedBank(target.value)
}

const sendMessage = async () => {
  if (!newMessage.value.trim()) return

  const message = newMessage.value.trim()
  newMessage.value = ''

  try {
    await chatStore.sendMessage(message)
  } catch (error) {
    console.error('Ошибка отправки сообщения:', error)
  }
}

const formatTime = (date: Date) => {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>
