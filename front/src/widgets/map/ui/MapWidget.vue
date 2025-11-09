<template>
  <div class="h-[450px] w-full">
    <l-map
      v-if="mounted"
      v-model:zoom="zoom"
      :center="center"
      :use-global-leaflet="true"
      class="h-full w-full rounded-2xl overflow-hidden shadow-md"
    >
      <!-- Плитки -->
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />

      <!-- Маркеры -->
      <l-marker
        v-for="(t, i) in transactionsWithCoords"
        :key="t.merchant.name + i"
        :lat-lng="[t.merchant.lat, t.merchant.lng]"
        :icon="t.ad ? adIcon : expenseIcon"
      >
        <l-popup>
          <div
            class="p-3 rounded-xl shadow-md bg-white min-w-[180px] border border-gray-200"
            :class="{ 'ring-2 ring-red-400': t.ad }"
          >
            <p class="text-base font-semibold text-gray-900 mb-1">
              {{ t.merchant.name }}
            </p>
            <p class="text-sm text-gray-600">{{ t.merchant.city }}</p>
            <p class="text-sm text-gray-700 mt-1">
              💳 <span class="font-medium">{{ t.amount.amount }}</span>
              {{ t.amount.currency }}
            </p>
            <p class="text-xs text-gray-500 mt-1">Карта: **** {{ t.card.slice(-4) }}</p>

            <div
              v-if="t.ad"
              class="mt-2 bg-gradient-to-r from-red-500 to-orange-400 text-white px-2 py-1 rounded-lg text-xs font-semibold text-center animate-pulse"
            >
              🔥 Скидка 15% сегодня!
            </div>
          </div>
        </l-popup>
      </l-marker>
    </l-map>

    <div
      v-else
      class="flex items-center justify-center h-full text-muted-foreground"
    >
      Загрузка карты...
    </div>
  </div>
</template>

<script setup lang="ts">
import 'leaflet/dist/leaflet.css';
import { ref, computed, onMounted } from 'vue';
import { LMap, LTileLayer, LMarker, LPopup } from '@vue-leaflet/vue-leaflet';
import * as L from 'leaflet';

// ✅ 1. Красивые маркеры трат
const expenseIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center group">
      <div class="absolute w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg border-2 border-white"></div>
      <div class="relative text-white text-sm font-bold z-10">
        ₽
      </div>
      <div class="absolute bottom-[-4px] w-2 h-2 bg-blue-600 rounded-full opacity-80 group-hover:opacity-100"></div>
    </div>
  `,
  className: '', // убираем leaflet default классы
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -28],
});

// ✅ 2. Рекламная метка
const adIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center">
      <div class="absolute animate-ping w-8 h-8 bg-red-400 rounded-full opacity-70"></div>
      <div class="relative z-10 bg-gradient-to-r from-red-500 to-orange-400 text-white font-bold text-xs px-2 py-1 rounded-full shadow-lg border border-white">
        SALE
      </div>
    </div>
  `,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35],
});

// ✅ 3. Моковые данные (Казань)
const zoom = ref(13);
const center = ref<[number, number]>([55.7963, 49.1088]);

const sampleTransactions = [
  {
    merchant: { name: 'Кафе «Сырная Лавка»', lat: 55.7903, lng: 49.1182, city: 'Казань' },
    amount: { amount: 850, currency: '₽' },
    card: '2202201234567890',
  },
  {
    merchant: { name: 'Кофейня «Арома»', lat: 55.7938, lng: 49.1055, city: 'Казань' },
    amount: { amount: 290, currency: '₽' },
    card: '2202209988776655',
  },
  {
    merchant: { name: 'Ресторан «Сыр да Мясо»', lat: 55.8005, lng: 49.1122, city: 'Казань' },
    amount: { amount: 2300, currency: '₽' },
    card: '2202204455667788',
  },
  {
    merchant: { name: 'Новое кафе «Вкусно+»', lat: 55.8015, lng: 49.0967, city: 'Казань' },
    amount: { amount: 1500, currency: '₽' },
    card: '2202209988223344',
    ad: true,
  },
  {
    merchant: { name: 'Булочная «Хлеб да Соль»', lat: 55.7920, lng: 49.1210, city: 'Казань' },
    amount: { amount: 420, currency: '₽' },
    card: '2202201111222233',
  },
];

const transactionsWithCoords = computed(() => sampleTransactions);

const mounted = ref(false);
onMounted(() => (mounted.value = true));
</script>

<style>
.leaflet-popup-content-wrapper {
  border-radius: 14px !important;
  padding: 0 !important;
}
.leaflet-popup-content {
  margin: 0 !important;
}
.leaflet-container {
  font-family: 'Inter', system-ui, sans-serif;
}
</style>
