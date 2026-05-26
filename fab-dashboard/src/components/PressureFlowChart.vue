<template>
  <v-chart :option="option" autoresize class="chart" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import VChart from 'vue-echarts'
import type { TimeSeriesPoint } from '@/types/equipment'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  pressureSeries: TimeSeriesPoint[]
  flowSeries: TimeSeriesPoint[]
  isDark?: boolean
}>()

const textColor = computed(() => (props.isDark ? '#a8b3c7' : '#64748b'))
const splitColor = computed(() =>
  props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)'
)

const option = computed(() => ({
  backgroundColor: 'transparent',
  grid: { top: 22, right: 58, bottom: 48, left: 52 },
  tooltip: { trigger: 'axis' },
  legend: {
    bottom: 0,
    textStyle: { color: textColor.value, fontSize: 11 },
    itemWidth: 16,
    itemHeight: 3,
  },
  xAxis: {
    type: 'category',
    data: props.pressureSeries.map(p => p.time),
    axisLabel: { color: textColor.value, fontSize: 10, interval: 'auto' },
    axisLine: { lineStyle: { color: splitColor.value } },
    axisTick: { show: false },
    splitLine: { show: false },
  },
  yAxis: [
    {
      type: 'value',
      name: 'mTorr',
      nameTextStyle: { color: '#2563eb', fontSize: 10, fontWeight: 700 },
      min: 3.5,
      max: 5.2,
      axisLabel: { color: '#2563eb', fontSize: 10 },
      splitLine: { lineStyle: { color: splitColor.value } },
    },
    {
      type: 'value',
      name: 'sccm',
      nameTextStyle: { color: '#d97706', fontSize: 10, fontWeight: 700 },
      min: 75,
      max: 100,
      axisLabel: { color: '#d97706', fontSize: 10 },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: '腔體壓力',
      type: 'line',
      yAxisIndex: 0,
      data: props.pressureSeries.map(p => p.value),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#2563eb', width: 3 },
    },
    {
      name: '製程氣體流量',
      type: 'line',
      yAxisIndex: 1,
      data: props.flowSeries.map(p => p.value),
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#d97706', width: 3, type: 'dashed' },
    },
  ],
}))
</script>

<style scoped>
.chart {
  height: 240px;
}
</style>
