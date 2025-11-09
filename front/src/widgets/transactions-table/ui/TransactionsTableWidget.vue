<script setup lang="ts" generic="TData, TValue">
import { ref } from 'vue'
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'

import { ChevronDown, Search } from 'lucide-vue-next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  getCoreRowModel: getCoreRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  onSortingChange: updaterOrValue => sorting.value = typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue,
  onColumnFiltersChange: updaterOrValue => columnFilters.value = typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters.value) : updaterOrValue,
  onColumnVisibilityChange: updaterOrValue => columnVisibility.value = typeof updaterOrValue === 'function' ? updaterOrValue(columnVisibility.value) : updaterOrValue,
  onRowSelectionChange: updaterOrValue => rowSelection.value = typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection.value) : updaterOrValue,
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
  },
})
</script>

<template>
  <div class="p-4">
    <!-- Поиск и управление колонками -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          class="pl-9"
          placeholder="Поиск по описанию транзакции..."
          :model-value="table.getColumn('description')?.getFilterValue() as string"
          @update:model-value="table.getColumn('description')?.setFilterValue($event)"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            Колонки <ChevronDown class="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-[200px]">
          <DropdownMenuCheckboxItem
            v-for="column in table.getAllColumns().filter(column => column.getCanHide())"
            :key="column.id"
            class="capitalize"
            :checked="column.getIsVisible()"
            @update:checked="(value) => { column.toggleVisibility(!!value) }"
          >
            {{ column.id === 'date' ? 'Дата' :
            column.id === 'description' ? 'Описание' :
              column.id === 'category' ? 'Категория' :
                column.id === 'amount' ? 'Сумма' : column.id }}
          </DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Таблица -->
    <div class="rounded-md border overflow-auto">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id" class="bg-muted/50">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender
                v-if="!header.isPlaceholder"
                :render="header.column.columnDef.header"
                :props="header.getContext()"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="row.getIsSelected() && 'selected'"
              class="transition-colors"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow>
              <TableCell :colspan="columns.length" class="h-32 text-center">
                <div class="flex flex-col items-center justify-center text-muted-foreground">
                  <Search class="h-8 w-8 mb-2 opacity-50" />
                  <p class="text-sm font-medium">Транзакции не найдены</p>
                  <p class="text-xs">Попробуйте изменить критерии поиска</p>
                </div>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Пагинация -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4">
      <div class="text-sm text-muted-foreground">
        <span class="font-medium">{{ table.getFilteredSelectedRowModel().rows.length }}</span> из{' '}
        <span class="font-medium">{{ table.getFilteredRowModel().rows.length }}</span> строк(и) выбрано
      </div>
      <div class="flex items-center gap-2">
        <div class="text-sm text-muted-foreground">
          Страница {' '}
          <span class="font-medium">{{ table.getState().pagination.pageIndex + 1 }}</span> из{' '}
          <span class="font-medium">{{ table.getPageCount() }}</span>
        </div>
        <div class="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanPreviousPage()"
            @click="table.previousPage()"
          >
            Назад
          </Button>
          <Button
            variant="outline"
            size="sm"
            :disabled="!table.getCanNextPage()"
            @click="table.nextPage()"
          >
            Вперед
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>
