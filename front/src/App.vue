<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import { computed } from 'vue'
import AppLayout from '@/app/ui/AppLayout.vue'
import AuthLayout from '@/app/ui/AuthLayout.vue'

type LayoutKey = 'default' | 'auth'

const route = useRoute()

const layoutMap: Record<LayoutKey, typeof AppLayout> = {
  default: AppLayout,
  auth: AuthLayout
}
const layout = computed<LayoutKey>(() => {
  const key = route.meta.layout
  if (key === 'auth') return 'auth'
  return 'default'
})
</script>

<template>
  <component :is="layoutMap[layout]">
    <RouterView />
  </component>
</template>
