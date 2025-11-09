<template>
  <div class="chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue'
import { Chart, registerables, type ChartOptions } from 'chart.js'

Chart.register(...registerables)

interface Props {
  data: {
    labels: string[]
    datasets: {
      label: string
      data: number[]
      borderColor: string
      backgroundColor: string
      borderWidth: number
      fill?: boolean
      tension?: number
    }[]
  }
  options?: ChartOptions<'line'>
}

const props = defineProps<Props>()

const chartCanvas = ref<HTMLCanvasElement>()
let chart: Chart | null = null

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          return `${context.dataset.label}: ${context.parsed.y.toLocaleString('ru-RU')} ₽`
        }
      }
    }
  },
  scales: {
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value: string | number) {
          return value.toLocaleString('ru-RU') + ' ₽'
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
    type: 'line',
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
