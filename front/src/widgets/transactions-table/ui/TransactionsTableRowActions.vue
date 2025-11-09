<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { MappedTransaction } from '@/widgets/transactions-table/model/types'
import { useAccountStore } from '@/store/AccountStore'

defineProps<{
  transaction: MappedTransaction
}>()

const accountStore = useAccountStore()

function copy(id: string) {
  navigator.clipboard.writeText(id)
  alert(`ID транзакции скопирован: ${id}`)
}
</script>

<template>
  <DropdownMenu style="background-color: white">
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" class="h-8 w-8 p-0">
        <span class="sr-only">Открыть меню</span>
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Действия</DropdownMenuLabel>
      <DropdownMenuItem @click="copy(transaction.id)">
        Копировать ID
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem @click="accountStore.showTransactionDetails(transaction.id)">
        Посмотреть детали
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
