<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    <!-- Левая колонка -->
    <div class="lg:col-span-1 xl:col-span-1 space-y-6">
      <BanksWidget />
      <PromoCards />
    </div>

    <div class="lg:col-span-2 xl:col-span-3">
      <MapWidget
        :transactions="accountStore.allTransactions"
        :loading="accountStore.isLoadingAllTransactions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAccountStore } from '@/store/AccountStore';
import BanksWidget from '@/widgets/banks/ui/BanksWidget.vue';
import PromoCards from '@/widgets/promo/ui/PromoCards.vue';
import MapWidget from '@/widgets/map/ui/MapWidget.vue';

const accountStore = useAccountStore();

onMounted(async () => {
  const hasAccounts = Object.values(accountStore.banks).some(b => b.accounts.length > 0);
  if (!hasAccounts) {
    console.log('[HomePage] Данные о счетах отсутствуют, запускаю загрузку.');
    await accountStore.fetchAllAccounts();
  } else {
    console.log('[HomePage] Данные о счетах уже есть, пропускаю загрузку.');
  }

  if (accountStore.connectedBanks.length > 0) {
    await accountStore.fetchAllTransactionsForAllAccounts();
  }
});
</script>
