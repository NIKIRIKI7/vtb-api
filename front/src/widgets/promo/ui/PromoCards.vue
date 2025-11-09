<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
    <!-- Карта кредита -->
    <Card class="bg-green-600 text-white shadow-lg border-0 overflow-hidden relative">
      <CardContent class="p-6">
        <h3 class="text-lg font-semibold">Кредит наличными</h3>
        <p class="text-2xl font-bold mt-1">до 5 000 000 ₽</p>
        <div class="flex justify-end items-end mt-4">
          <span class="text-xs bg-black/20 px-2 py-1 rounded-full">Реклама</span>
        </div>
        <CreditCard class="absolute -bottom-4 -left-4 h-24 w-24 text-white opacity-20" />
      </CardContent>
    </Card>

    <!-- Карта вклада -->
    <Card class="bg-indigo-500 text-white shadow-lg border-0 overflow-hidden relative">
      <CardContent class="p-6">
        <h3 class="text-lg font-semibold">Открыть вклад</h3>
        <p class="text-2xl font-bold mt-1">до 15% годовых</p>
        <div class="flex justify-end items-end mt-4">
          <span class="text-xs bg-black/20 px-2 py-1 rounded-full">Реклама</span>
        </div>
        <PiggyBank class="absolute -bottom-4 -left-4 h-24 w-24 text-white opacity-20" />
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, PiggyBank } from 'lucide-vue-next';
</script>
