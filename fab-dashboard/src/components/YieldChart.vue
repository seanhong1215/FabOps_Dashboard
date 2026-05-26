<template>
  <v-chart :option="stableOption" autoresize class="chart" />
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GraphicComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([PieChart, TooltipComponent, LegendComponent, GraphicComponent, CanvasRenderer])

const props = defineProps<{
  yieldPct: number
  isDark?: boolean
}>()

const REDRAW_THRESHOLD = 0.3
const textColor = computed(() => (props.isDark ? '#d7deea' : '#1f2937'))
const mutedColor = computed(() => (props.isDark ? '#94a3b8' : '#64748b'))

function buildOption(yieldVal: number) {
  const failVal = parseFloat((100 - yieldVal).toFixed(1))
  return {
    backgroundColor: 'transparent',
    animationDuration: 450,
    tooltip: {
      trigger: 'item',
      valueFormatter: (value: number) => `${value}%`,
    },
    legend: {
      bottom: 0,
      textStyle: { color: mutedColor.value, fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10,
    },
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: `${yieldVal.toFixed(1)}%`,
          fill: textColor.value,
          fontSize: 30,
          fontWeight: 800,
        },
      },
      {
        type: 'text',
        left: 'center',
        top: '53%',
        style: {
          text: '一次良率',
          fill: mutedColor.value,
          fontSize: 12,
          fontWeight: 600,
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['58%', '76%'],
        center: ['50%', '46%'],
        data: [
          { value: yieldVal, name: 'Pass', itemStyle: { color: '#16a34a' } },
          { value: failVal, name: '重工 / 報廢', itemStyle: { color: '#dc2626' } },
        ],
        label: { show: false },
        emphasis: { scale: true, scaleSize: 4 },
      },
    ],
  }
}

const stableOption = ref(buildOption(props.yieldPct))
let lastDrawnValue = props.yieldPct

watch(
  () => props.yieldPct,
  (newVal) => {
    if (Math.abs(newVal - lastDrawnValue) >= REDRAW_THRESHOLD) {
      stableOption.value = buildOption(newVal)
      lastDrawnValue = newVal
    }
  }
)

watch(
  () => props.isDark,
  () => {
    stableOption.value = buildOption(lastDrawnValue)
  }
)
</script>

<style scoped>
.chart {
  height: 240px;
}
</style>
