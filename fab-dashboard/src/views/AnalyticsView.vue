<template>
  <main class="analytics">
    <section class="analytics-hero">
      <div>
        <span class="section-kicker">Operations analytics</span>
        <h1>營運分析與產能報表</h1>
        <p>
          將 OEE、良率、停機、產出與設備稼動彙整成管理層與現場主管可共用的班報視圖。
        </p>
      </div>

      <div class="period-panel">
        <div class="period-tabs" role="tablist" aria-label="報表區間">
          <button
            v-for="period in periods"
            :key="period.value"
            :class="{ active: selectedPeriod === period.value }"
            type="button"
            @click="selectedPeriod = period.value"
          >
            {{ period.label }}
          </button>
        </div>
        <div class="report-window">
          <span>報表區間</span>
          <strong>{{ activePeriod.range }}</strong>
        </div>
      </div>
    </section>

    <section class="score-grid">
      <article
        v-for="item in executiveMetrics"
        :key="item.label"
        class="score-card"
        :class="`score-card--${item.tone}`"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <em>{{ item.note }}</em>
      </article>
    </section>

    <section class="analytics-grid">
      <article class="panel panel--wide">
        <div class="section-header">
          <div>
            <span class="section-kicker">OEE trend</span>
            <h2>OEE 與產出趨勢</h2>
          </div>
          <span class="updated">更新 {{ store.lastUpdated || '--:--:--' }}</span>
        </div>
        <div class="trend-chart">
          <div
            v-for="point in trendData"
            :key="point.label"
            class="trend-column"
          >
            <div class="bar-shell">
              <span
                class="bar bar--wph"
                :style="{ height: `${point.wphPct}%` }"
              />
              <span
                class="bar bar--oee"
                :style="{ height: `${point.oee}%` }"
              />
            </div>
            <strong>{{ point.label }}</strong>
          </div>
        </div>
        <div class="legend-row">
          <span><i class="legend legend--oee" />OEE</span>
          <span><i class="legend legend--wph" />WPH 達成率</span>
        </div>
      </article>

      <article class="panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">Yield</span>
            <h2>良率損失拆解</h2>
          </div>
        </div>
        <div class="loss-list">
          <div
            v-for="loss in yieldLoss"
            :key="loss.reason"
            class="loss-row"
          >
            <div>
              <span>{{ loss.reason }}</span>
              <strong>{{ loss.value }}%</strong>
            </div>
            <div class="loss-bar">
              <span :style="{ width: `${loss.value * 8}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">Downtime</span>
            <h2>停機原因 Pareto</h2>
          </div>
        </div>
        <div class="downtime-list">
          <div
            v-for="reason in downtimeReasons"
            :key="reason.name"
            class="downtime-row"
          >
            <span>{{ reason.name }}</span>
            <strong>{{ reason.minutes }} min</strong>
            <div>
              <em :style="{ width: `${reason.share}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="panel panel--wide">
        <div class="section-header">
          <div>
            <span class="section-kicker">Equipment ranking</span>
            <h2>設備稼動與產出排名</h2>
          </div>
          <span class="updated">{{ store.machines.length }} 台設備</span>
        </div>
        <div class="ranking-table">
          <div class="ranking-head">
            <span>設備</span>
            <span>區域</span>
            <span>稼動率</span>
            <span>WPH</span>
            <span>風險</span>
          </div>
          <div
            v-for="machine in machineRanking"
            :key="machine.id"
            class="ranking-row"
          >
            <strong>{{ machine.id }}</strong>
            <span>{{ machine.area }}</span>
            <span>{{ machine.utilization }}%</span>
            <span>{{ machine.wph }}/{{ machine.targetWph }}</span>
            <em :class="`risk risk--${machine.risk}`">{{ riskLabel(machine.risk) }}</em>
          </div>
        </div>
      </article>

      <aside class="panel action-panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">Management brief</span>
            <h2>班報摘要</h2>
          </div>
        </div>
        <ol class="brief-list">
          <li>
            <strong>瓶頸設備</strong>
            {{ store.bottleneck.name }} 目前造成 {{ bottleneckGap }} WPH 缺口，需優先解除派工限制。
          </li>
          <li>
            <strong>品質趨勢</strong>
            一次良率維持 {{ store.kpi.yield.toFixed(1) }}%，主要損失來自 overlay 與 particle。
          </li>
          <li>
            <strong>產線策略</strong>
            建議將 hot lots 暫時避開 LITHO-02，並追蹤 CMP-02 release 條件。
          </li>
        </ol>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEquipmentStore } from '@/stores/equipment'
import { useWebSocket } from '@/composables/useWebSocket'

type PeriodValue = 'daily' | 'weekly' | 'monthly'
type RiskLevel = 'normal' | 'watch' | 'critical'

const store = useEquipmentStore()
useWebSocket()

const selectedPeriod = ref<PeriodValue>('daily')
const periods = [
  { value: 'daily' as const, label: '日報', range: '今日 08:00 - 現在' },
  { value: 'weekly' as const, label: '週報', range: '本週一 - 今日' },
  { value: 'monthly' as const, label: '月報', range: '本月累計' },
]

const activePeriod = computed(() =>
  periods.find(period => period.value === selectedPeriod.value) ?? periods[0]
)

const bottleneckGap = computed(() =>
  store.bottleneck.targetWph - store.bottleneck.wph
)

const executiveMetrics = computed(() => [
  {
    label: 'OEE',
    value: `${store.kpi.oee.toFixed(1)}%`,
    note: `較昨日 +${store.kpi.oeeChange.toFixed(1)}%`,
    tone: 'good',
  },
  {
    label: '產線 WPH',
    value: `${store.kpi.wph}`,
    note: '高於計畫 3 wafers',
    tone: 'good',
  },
  {
    label: '一次良率',
    value: `${store.kpi.yield.toFixed(1)}%`,
    note: '需追蹤 overlay drift',
    tone: 'watch',
  },
  {
    label: '停機風險',
    value: `${store.errorCount}`,
    note: `${store.bottleneck.name} 為主要風險`,
    tone: store.errorCount > 0 ? 'critical' : 'good',
  },
])

const trendData = computed(() => {
  const periodShift = selectedPeriod.value === 'daily' ? 0 : selectedPeriod.value === 'weekly' ? 1.8 : 3.2
  return ['08:00', '10:00', '12:00', '14:00', '16:00', 'Now'].map((label, index) => {
    const oee = Math.max(72, Math.round(store.kpi.oee - 4 + index * 1.1 - periodShift))
    const wphPct = Math.min(100, Math.round((store.kpi.wph / 132) * 100 - 5 + index))
    return { label, oee, wphPct }
  })
})

const yieldLoss = computed(() => [
  { reason: 'Overlay drift', value: 1.4 },
  { reason: 'Particle', value: 0.9 },
  { reason: 'CD variation', value: 0.7 },
  { reason: 'Metrology hold', value: 0.5 },
])

const downtimeReasons = computed(() => {
  const lithoDown = Math.round((store.machineById('LITHO-02')?.downtimeSec ?? 0) / 60)
  const reasons = [
    { name: 'Stage fault', minutes: lithoDown, share: 100 },
    { name: 'Material hold', minutes: 18, share: 42 },
    { name: 'Recipe validation', minutes: 12, share: 28 },
    { name: 'PM assist', minutes: 8, share: 18 },
  ]
  const max = Math.max(...reasons.map(reason => reason.minutes), 1)
  return reasons.map(reason => ({
    ...reason,
    share: Math.round((reason.minutes / max) * 100),
  }))
})

const machineRanking = computed(() =>
  [...store.machines]
    .sort((a, b) => b.utilization - a.utilization)
    .map(machine => ({
      ...machine,
      risk: machine.status === 'error'
        ? 'critical'
        : machine.status === 'idle' || machine.wph / machine.targetWph < 0.85
          ? 'watch'
          : 'normal' as RiskLevel,
    }))
)

function riskLabel(risk: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    normal: '穩定',
    watch: '觀察',
    critical: '高風險',
  }
  return map[risk]
}
</script>

<style scoped>
.analytics {
  width: min(1480px, calc(100% - 40px));
  margin: 0 auto;
  padding: 24px 0 42px;
}

.analytics-hero,
.score-card,
.panel {
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.analytics-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
  gap: 24px;
  align-items: end;
  min-height: 238px;
  border-radius: 18px;
  background: var(--app-hero-bg);
  margin-bottom: 14px;
  padding: 34px;
}

.analytics-hero h1 {
  max-width: 820px;
  margin: 12px 0;
  color: var(--app-hero-text);
  font-size: clamp(34px, 5vw, 60px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 0.98;
}

.analytics-hero p {
  max-width: 720px;
  margin: 0;
  color: var(--app-hero-muted);
  font-size: 16px;
  line-height: 1.65;
}

.period-panel,
.report-window,
.score-card,
.panel {
  background: var(--app-surface);
}

.period-panel {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 14px;
}

.period-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-soft);
  padding: 4px;
}

.period-tabs button {
  min-height: 34px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--n-text-color-3);
  cursor: pointer;
  font-size: 13px;
  font-weight: 900;
}

.period-tabs button.active {
  background: var(--app-surface-strong);
  color: var(--n-text-color-1);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.report-window {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  margin-top: 10px;
  padding: 14px;
}

.report-window span,
.score-card span,
.score-card em,
.section-kicker,
.updated,
.ranking-head,
.trend-column strong {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.report-window strong {
  display: block;
  margin-top: 6px;
  color: var(--n-text-color-1);
  font-size: 18px;
}

.score-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.score-card {
  border-radius: 14px;
  padding: 16px;
}

.score-card--good { border-top: 3px solid #16a34a; }
.score-card--watch { border-top: 3px solid #d97706; }
.score-card--critical { border-top: 3px solid #dc2626; }

.score-card strong {
  display: block;
  margin-top: 10px;
  color: var(--n-text-color-1);
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.score-card em {
  display: block;
  margin-top: 10px;
  font-style: normal;
}

.analytics-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 14px;
}

.panel {
  border-radius: 14px;
  padding: 20px;
}

.panel--wide {
  min-width: 0;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 4px 0 0;
  color: var(--n-text-color-1);
  font-size: 18px;
  font-weight: 850;
  letter-spacing: 0;
}

.trend-chart {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
  min-height: 260px;
}

.trend-column {
  display: grid;
  grid-template-rows: 1fr auto;
  gap: 10px;
}

.bar-shell {
  display: flex;
  align-items: end;
  justify-content: center;
  gap: 7px;
  min-height: 220px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-soft);
  padding: 12px 8px;
}

.bar {
  width: 22px;
  min-height: 12px;
  border-radius: 8px 8px 3px 3px;
}

.bar--oee {
  background: #16a34a;
}

.bar--wph {
  background: #2563eb;
}

.legend-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 14px;
  color: var(--n-text-color-2);
  font-size: 12px;
  font-weight: 800;
}

.legend-row span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
}

.legend {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend--oee { background: #16a34a; }
.legend--wph { background: #2563eb; }

.loss-list,
.downtime-list,
.brief-list {
  display: grid;
  gap: 12px;
}

.loss-row {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-soft);
  padding: 12px;
}

.loss-row div:first-child,
.downtime-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.loss-row span,
.downtime-row span {
  color: var(--n-text-color-2);
  font-size: 13px;
  font-weight: 800;
}

.loss-row strong,
.downtime-row strong {
  color: var(--n-text-color-1);
  font-size: 16px;
  font-weight: 900;
}

.loss-bar,
.downtime-row div {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.loss-bar {
  margin-top: 10px;
}

.loss-bar span,
.downtime-row em {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #d97706;
}

.downtime-row {
  display: grid;
  grid-template-columns: 1fr 76px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-soft);
  padding: 12px;
}

.downtime-row div {
  grid-column: 1 / -1;
}

.downtime-row em {
  background: #dc2626;
}

.ranking-table {
  display: grid;
  gap: 8px;
}

.ranking-head,
.ranking-row {
  display: grid;
  grid-template-columns: 1fr 1.2fr 0.8fr 0.9fr 82px;
  gap: 12px;
  align-items: center;
}

.ranking-head {
  padding: 0 12px;
}

.ranking-row {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-soft);
  padding: 12px;
}

.ranking-row strong {
  color: var(--n-text-color-1);
  font-size: 14px;
}

.ranking-row span {
  color: var(--n-text-color-2);
  font-size: 13px;
  font-weight: 700;
}

.risk {
  border-radius: 999px;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
  padding: 5px 8px;
  text-align: center;
}

.risk--normal {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}

.risk--watch {
  background: rgba(217, 119, 6, 0.12);
  color: #d97706;
}

.risk--critical {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.action-panel {
  align-self: start;
  position: sticky;
  top: 82px;
}

.brief-list {
  margin: 0;
  padding-left: 20px;
}

.brief-list li {
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.6;
}

.brief-list strong {
  display: block;
  color: var(--n-text-color-1);
  font-size: 14px;
}

@media (max-width: 1180px) {
  .analytics-hero,
  .analytics-grid {
    grid-template-columns: 1fr;
  }

  .action-panel {
    position: static;
  }
}

@media (max-width: 820px) {
  .analytics {
    width: min(100% - 24px, 1480px);
    padding: 14px 0 86px;
  }

  .analytics-hero {
    padding: 24px;
  }

  .score-grid,
  .trend-chart {
    grid-template-columns: 1fr;
  }

  .bar-shell {
    min-height: 150px;
  }

  .ranking-head {
    display: none;
  }

  .ranking-row {
    grid-template-columns: 1fr 1fr;
  }

  .section-header {
    flex-direction: column;
  }
}
</style>
