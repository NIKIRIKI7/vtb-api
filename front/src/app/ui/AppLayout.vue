<template>
  <div class="min-h-screen bg-background flex flex-col">
    <!-- Header -->
    <header
      class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 bg-white"
    >
      <div class="container flex h-16 items-center px-4">
        <!-- Левая сторона: Название (для десктопа) / Бургер (для мобильных) -->
        <div class="flex items-center">
          <h1 class="text-xl font-bold hidden lg:block">MapTrack</h1>
          <Button @click="toggleMobileMenu" variant="ghost" size="icon" class="lg:hidden">
            <Menu class="h-6 w-6" />
            <span class="sr-only">Открыть/закрыть меню</span>
          </Button>
        </div>

        <!-- Центрированный заголовок для мобильных -->
        <div class="flex-1 flex justify-center lg:hidden">
          <h1 class="text-xl font-bold">MapTrack</h1>
        </div>

        <!-- Правая сторона: Навигация и иконки -->
        <div class="flex items-center ml-auto space-x-2">
          <!-- Навигация для десктопа -->
          <nav class="hidden lg:flex items-center space-x-1 mr-4">
            <RouterLink
              to="/"
              class="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              :class="{ 'bg-accent': $route.path === '/' }"
            >
              Главная
            </RouterLink>
            <RouterLink
              v-if="authStore.isLoggedIn"
              to="/profile"
              class="inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              :class="{ 'bg-accent': $route.path === '/profile' }"
            >
              Профиль
            </RouterLink>
          </nav>

          <!-- Иконки и аутентификация -->
          <Button variant="ghost" size="icon">
            <Bell class="h-6 w-6" />
            <span class="sr-only">Уведомления</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Sun class="h-6 w-6" />
            <span class="sr-only">Переключить тему</span>
          </Button>

          <template v-if="authStore.isLoggedIn">
            <Button @click="handleLogout" variant="outline" size="sm">Выйти</Button>
          </template>
          <template v-else>
            <div class="hidden lg:flex items-center gap-2">
              <RouterLink to="/login">
                <Button variant="ghost" size="sm">Вход</Button>
              </RouterLink>
              <RouterLink to="/register">
                <Button size="sm">Регистрация</Button>
              </RouterLink>
            </div>
          </template>
        </div>
      </div>
    </header>

    <!-- Mobile Menu -->
    <Transition name="slide">
      <div v-if="isMobileMenuOpen" class="lg:hidden fixed top-16 left-0 h-[calc(100%-4rem)] w-64 bg-background z-50 shadow-lg p-4 border-r bg-white">
        <nav class="flex flex-col space-y-2">
          <RouterLink to="/" @click="closeMobileMenu" class="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent" :class="{ 'bg-accent': $route.path === '/' }">
            Главная
          </RouterLink>
          <RouterLink v-if="authStore.isLoggedIn" to="/profile" @click="closeMobileMenu" class="block px-3 py-2 rounded-md text-base font-medium hover:bg-accent" :class="{ 'bg-accent': $route.path === '/profile' }">
            Профиль
          </RouterLink>
        </nav>
      </div>
    </Transition>
    <Transition name="fade">
      <div v-if="isMobileMenuOpen" @click="closeMobileMenu" class="lg:hidden fixed inset-0 bg-black/30 z-40"></div>
    </Transition>


    <!-- Main Content -->
    <main class="container flex-1 py-6 px-4">
      <slot />
    </main>

    <ChatWidget />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/AuthStore'
import { Button } from '@/components/ui/button'
import { Menu, Bell, Sun } from 'lucide-vue-next'
import ChatWidget from '@/widgets/chat/ui/ChatWidget.vue'

const $route = useRoute()
const authStore = useAuthStore()
const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const handleLogout = () => {
  authStore.logout()
}
</script>
