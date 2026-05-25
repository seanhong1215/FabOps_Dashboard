<template>
  <n-card size="small" class="machine-card" :bordered="false">
    <div class="machine-header">
      <div>
        <div class="machine-name">{{ machine.name }}</div>
        <div class="machine-meta">{{ machine.area }} - {{ machine.recipe }}</div>
      </div>
      <n-tag :type="statusToTagType(machine.status)" size="small" round>
        {{ statusLabel(machine.status) }}
      </n-tag>
    </div>

    <div class="throughput">
      <div>
        <div class="metric-label">產出 WPH</div>
        <div class="metric-value">{{ machine.wph }}</div>
      </div>
      <div class="progress-shell">
        <n-progress
          type="line"
          :percentage="throughputPct"
          :show-indicator="false"
          :color="progressColor"
          :height="8"
          rail-color="rgba(148, 163, 184, 0.18)"
        />
        <span>達標 {{ throughputPct }}%</span>
      </div>
    </div>

    <div class="machine-grid">
      <div class="data-point">
        <span>可用率</span>
        <strong>{{ machine.availability }}%</strong>
      </div>
      <div class="data-point">
        <span>稼動率</span>
        <strong>{{ machine.utilization }}%</strong>
      </div>
      <div class="data-point">
        <span>排隊批量</span>
        <strong>{{ machine.queue }} lots</strong>
      </div>
      <div class="data-point">
        <span>累計 wafer</span>
        <strong>{{ formatCount(machine.totalWafers) }}</strong>
      </div>
    </div>

    <div class="signal-row">
      <span v-if="machine.temperature !== undefined">溫度 {{ machine.temperature.toFixed(1) }} C</span>
      <span v-if="machine.pressure !== undefined">壓力 {{ machine.pressure.toFixed(2) }} mTorr</span>
      <span v-if="machine.flowRate !== undefined">流量 {{ machine.flowRate.toFixed(1) }} sccm</span>
      <span v-if="machine.rfPower !== undefined">RF {{ machine.rfPower }} W</span>
      <span v-if="machine.rpm !== undefined">RPM {{ machine.rpm }}</span>
      <span v-if="machine.energy !== undefined">能量 {{ machine.energy }} keV</span>
      <span v-if="machine.dose">Dose {{ machine.dose }}</span>
      <span v-if="machine.slurryFlow !== undefined">Slurry {{ machine.slurryFlow }} mL/min</span>
    </div>

    <div v-if="machine.errorCode || machine.downtimeSec !== undefined" class="incident">
      <n-text type="error" strong>
        {{ machine.errorCode ?? '異常事件' }}
      </n-text>
      <span v-if="machine.downtimeSec !== undefined">
        停機 {{ formatDowntime(machine.downtimeSec) }}
      </span>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard, NProgress, NTag, NText } from 'naive-ui'
import type { Machine } from '@/types/equipment'
import { statusToTagType, statusLabel, formatDowntime, formatCount } from '@/utils/format'

const props = defineProps<{ machine: Machine }>()

const throughputPct = computed(() =>
  Math.min(Math.round((props.machine.wph / props.machine.targetWph) * 100), 100)
)

const progressColor = computed(() => {
  if (props.machine.status === 'error') return '#dc2626'
  if (throughputPct.value < 70) return '#d97706'
  return '#16a34a'
})
</script>

<style scoped>
.machine-card {
  min-height: 268px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.machine-header,
.throughput {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.machine-name {
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 800;
}

.machine-meta,
.metric-label,
.data-point span,
.progress-shell span {
  color: var(--n-text-color-3);
  font-size: 12px;
}

.throughput {
  align-items: center;
  margin-top: 22px;
}

.metric-value {
  color: var(--n-text-color-1);
  font-size: 32px;
  font-weight: 800;
  line-height: 1;
}

.progress-shell {
  min-width: 118px;
  flex: 1;
}

.machine-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 18px;
}

.data-point {
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 10px;
}

.data-point strong {
  display: block;
  margin-top: 4px;
  color: var(--n-text-color-1);
  font-size: 14px;
}

.signal-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.signal-row span {
  border-radius: 999px;
  background: var(--app-chip-bg);
  color: var(--app-chip-text);
  font-size: 11px;
  font-weight: 700;
  padding: 4px 8px;
}

.incident {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-top: 12px;
  border-top: 1px solid var(--app-border);
  padding-top: 12px;
  font-size: 12px;
}
</style>
