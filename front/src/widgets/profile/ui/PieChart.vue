<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, registerables, type ChartOptions, type TooltipItem } from 'chart.js'

Chart.register(...registerables)

interface Props {
  data: {
    labels: string[]
    datasets: {
      data: number[]
      backgroundColor: string[]
      borderColor: string[]
      borderWidth: number
    }[]
  }
  options?: ChartOptions<'pie'>
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: {
        usePointStyle: true,
        padding: 15
      }
    },
    tooltip: {
      callbacks: {
        label: function(context: TooltipItem<'pie'>) {
          const label = context.label || ''
          const value = context.parsed
          const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
          const percentage = Math.round((value / total) * 100)
          return `${label}: ${value.toLocaleString('ru-RU')} ₽ (${percentage}%)`
        }
      }
    }
  }
}

const initChart = () => {
  if (!chartCanvas.value) return

  if (chart) {
    chart.destroy()
  }

  chart = new Chart(chartCanvas.value, {
    type: 'pie',
    data: props.data,
    options: { ...defaultOptions, ...props.options }
  })
}

onMounted(initChart)

watch(
  () => props.data,
  () => {
    initChart()
  },
  { deep: true }
)

onUnmounted(() => {
  if (chart) {
    chart.destroy()
  }
})
</script>

<style scoped>
.chart-container {
  position: relative;
  height: 100%;
  width: 100%;
}
</style>
