<template>
  <n-card size="small" class="kpi-card" :bordered="false">
    <div class="kpi-topline">
      <span class="label">{{ label }}</span>
      <span v-if="tone" class="tone-dot" :class="`tone-dot--${tone}`" />
    </div>
    <div class="value">
      {{ displayValue }}<span class="unit">{{ unit }}</span>
    </div>
    <div
      v-if="delta !== undefined"
      class="delta"
      :class="deltaPositive ? 'delta--up' : 'delta--down'"
    >
      <span>{{ deltaPositive ? '+' : '-' }}</span>
      較昨日 {{ Math.abs(delta).toFixed(1) }}{{ deltaUnit }}
    </div>
    <div v-else class="delta delta--neutral">{{ note }}</div>
  </n-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { NCard } from 'naive-ui'

const props = defineProps<{
  label: string
  value: number
  unit?: string
  decimals?: number
  delta?: number
  deltaUnit?: string
  note?: string
  tone?: 'good' | 'warn' | 'danger'
}>()

const displayValue = computed(() =>
  props.value.toFixed(props.decimals ?? 1)
)

const deltaPositive = computed(() =>
  (props.delta ?? 0) >= 0
)
</script>

<style scoped>
.kpi-card {
  min-height: 132px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.08), transparent 58%),
    var(--app-surface-strong);
  border: 1px solid var(--app-border-strong);
  box-shadow: var(--app-shadow);
}

.kpi-topline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.label {
  color: var(--n-text-color-3);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.tone-dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
}

.tone-dot--good { background: #16a34a; box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.14); }
.tone-dot--warn { background: #d97706; box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.14); }
.tone-dot--danger { background: #dc2626; box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.14); }

.value {
  color: var(--n-text-color-1);
  font-size: 34px;
  font-weight: 800;
  line-height: 1;
}

.unit {
  color: var(--n-text-color-3);
  font-size: 14px;
  font-weight: 600;
  margin-left: 5px;
}

.delta {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 13px;
  font-size: 12px;
  font-weight: 600;
}

.delta--up { color: #16a34a; }
.delta--down { color: #dc2626; }
.delta--neutral { color: var(--n-text-color-3); }
</style>
