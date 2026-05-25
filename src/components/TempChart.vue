<template>
  <v-chart :option="option" autoresize class="chart" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { TimeSeriesPoint } from '@/types/equipment'

use([LineChart, GridComponent, TooltipComponent, MarkLineComponent, CanvasRenderer])

const props = defineProps<{
  series: TimeSeriesPoint[]
  isDark?: boolean
}>()

const textColor = computed(() => (props.isDark ? '#a8b3c7' : '#64748b'))
const splitColor = computed(() =>
  props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
)

const option = computed(() => ({
  backgroundColor: 'transparent',
  grid: { top: 26, right: 18, bottom: 34, left: 52 },
  tooltip: {
    trigger: 'axis',
    valueFormatter: (value: number) => `${value} C`,
  },
  xAxis: {
    type: 'category',
    data: props.series.map(p => p.time),
    axisLabel: { color: textColor.value, fontSize: 10, interval: 'auto' },
    axisLine: { lineStyle: { color: splitColor.value } },
    axisTick: { show: false },
  },
  yAxis: {
    type: 'value',
    min: 300,
    max: 325,
    axisLabel: { color: textColor.value, fontSize: 10, formatter: '{value} C' },
    splitLine: { lineStyle: { color: splitColor.value } },
  },
  series: [
    {
      name: 'CVD 溫度',
      type: 'line',
      data: props.series.map(p => p.value),
      smooth: true,
      symbol: 'circle',
      symbolSize: 5,
      lineStyle: { color: '#dc2626', width: 3 },
      itemStyle: { color: '#dc2626' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(220,38,38,0.24)' },
            { offset: 1, color: 'rgba(220,38,38,0.02)' },
          ],
        },
      },
      markLine: {
        symbol: 'none',
        lineStyle: { color: '#d97706', type: 'dashed' },
        label: { color: '#d97706', formatter: '規格上限' },
        data: [{ yAxis: 320 }],
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
