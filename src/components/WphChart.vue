<template>
  <v-chart :option="option" autoresize class="chart" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'

use([BarChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  data: { id: string; wph: number; target?: number }[]
  isDark?: boolean
}>()

const textColor = computed(() => (props.isDark ? '#a8b3c7' : '#64748b'))
const splitColor = computed(() =>
  props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
)

function colorFor(wph: number, target = 1) {
  if (wph === 0) return '#dc2626'
  if (wph / target < 0.75) return '#d97706'
  return '#16a34a'
}

const option = computed(() => ({
  backgroundColor: 'transparent',
  grid: { top: 18, right: 16, bottom: 44, left: 46 },
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value: number) => `${value} WPH`,
  },
  xAxis: {
    type: 'category',
    data: props.data.map(d => d.id),
    axisLabel: { color: textColor.value, fontSize: 10, interval: 0, rotate: 18 },
    axisLine: { lineStyle: { color: splitColor.value } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    min: 0,
    max: 160,
    axisLabel: { color: textColor.value, fontSize: 10 },
    splitLine: { lineStyle: { color: splitColor.value } },
  },
  series: [
    {
      type: 'bar',
      barMaxWidth: 34,
      data: props.data.map(d => ({
        value: d.wph,
        itemStyle: {
          color: colorFor(d.wph, d.target),
          borderRadius: [6, 6, 0, 0],
        },
      })),
      markLine: {
        symbol: 'none',
        lineStyle: { color: '#0ea5e9', type: 'dashed' },
        label: { color: '#0ea5e9', formatter: '計畫 120' },
        data: [{ yAxis: 120 }],
      },
    },
  ],
}))
</script>

<style scoped>
.chart {
  height: 240px;
}
</style>
