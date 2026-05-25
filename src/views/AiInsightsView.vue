<template>
  <main class="ai-insights">
    <section class="ai-hero">
      <div>
        <span class="section-kicker">AI operations intelligence</span>
        <h1>AI 異常偵測與預測維修</h1>
        <p>
          以即時 telemetry 與設備狀態建立 rule-based AI demo，模擬異常分數、RUL、風險排序與維修建議，展現智慧製造平台的決策層。
        </p>
      </div>

      <div class="hero-model">
        <div class="model-orbit" :style="{ '--risk': lineRiskScore }">
          <strong>{{ lineRiskScore }}</strong>
          <span>Line risk score</span>
        </div>
        <div class="model-meta">
          <span>模型版本：Hybrid Rules v1.4</span>
          <span>資料來源：{{ store.streamMode === 'demo' ? 'Demo telemetry' : 'Live WebSocket' }}</span>
          <span>最後推論：{{ store.lastUpdated || '--:--:--' }}</span>
        </div>
      </div>
    </section>

    <section class="ai-summary">
      <article
        v-for="item in aiSummary"
        :key="item.label"
        class="summary-card"
        :class="`summary-card--${item.tone}`"
      >
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <em>{{ item.note }}</em>
      </article>
    </section>

    <section class="ai-layout">
      <article class="panel panel--wide">
        <div class="section-header">
          <div>
            <span class="section-kicker">Risk ranking</span>
            <h2>設備異常分數排序</h2>
          </div>
          <n-tag :type="lineRiskScore >= 70 ? 'error' : lineRiskScore >= 45 ? 'warning' : 'success'" round>
            {{ lineRiskLabel }}
          </n-tag>
        </div>

        <div class="risk-table">
          <div class="risk-head">
            <span>設備</span>
            <span>區域</span>
            <span>Anomaly</span>
            <span>RUL</span>
            <span>狀態</span>
          </div>
          <button
            v-for="insight in machineInsights"
            :key="insight.id"
            class="risk-row"
            :class="{ active: selectedInsight.id === insight.id }"
            type="button"
            @click="selectedMachineId = insight.id"
          >
            <strong>{{ insight.id }}</strong>
            <span>{{ insight.area }}</span>
            <div class="score-meter">
              <em :style="{ width: `${insight.anomalyScore}%` }" />
              <b>{{ insight.anomalyScore }}</b>
            </div>
            <span>{{ insight.rulHours }} hr</span>
            <i :class="`risk-pill risk-pill--${insight.level}`">{{ riskLevelLabel(insight.level) }}</i>
          </button>
        </div>
      </article>

      <aside class="panel detail-panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">Selected insight</span>
            <h2>{{ selectedInsight.id }}</h2>
          </div>
          <n-tag :type="riskTagType(selectedInsight.level)" round>
            {{ riskLevelLabel(selectedInsight.level) }}
          </n-tag>
        </div>

        <div class="score-ring" :style="{ '--score': `${selectedInsight.anomalyScore}%` }">
          <strong>{{ selectedInsight.anomalyScore }}</strong>
          <span>anomaly score</span>
        </div>

        <div class="detail-grid">
          <div>
            <span>RUL</span>
            <strong>{{ selectedInsight.rulHours }} hr</strong>
          </div>
          <div>
            <span>信心值</span>
            <strong>{{ selectedInsight.confidence }}%</strong>
          </div>
          <div>
            <span>產出缺口</span>
            <strong>{{ selectedInsight.throughputGap }} WPH</strong>
          </div>
          <div>
            <span>Queue</span>
            <strong>{{ selectedInsight.queue }} lots</strong>
          </div>
        </div>

        <div class="recommendation" :class="`recommendation--${selectedInsight.level}`">
          <span>AI 建議</span>
          <strong>{{ selectedInsight.recommendation }}</strong>
        </div>
      </aside>

      <article class="panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">Signals</span>
            <h2>異常貢獻因子</h2>
          </div>
        </div>
        <div class="factor-list">
          <div
            v-for="factor in selectedInsight.factors"
            :key="factor.name"
            class="factor-row"
          >
            <div>
              <span>{{ factor.name }}</span>
              <strong>{{ factor.value }}</strong>
            </div>
            <div class="factor-bar">
              <em :style="{ width: `${factor.weight}%` }" />
            </div>
          </div>
        </div>
      </article>

      <article class="panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">Maintenance</span>
            <h2>預測維修佇列</h2>
          </div>
        </div>
        <div class="maintenance-list">
          <div
            v-for="item in maintenanceQueue"
            :key="item.id"
            class="maintenance-item"
            :class="`maintenance-item--${item.level}`"
          >
            <div>
              <strong>{{ item.id }}</strong>
              <span>{{ item.reason }}</span>
            </div>
            <em>{{ item.window }}</em>
          </div>
        </div>
      </article>

      <article class="panel panel--wide">
        <div class="section-header">
          <div>
            <span class="section-kicker">Operations workflow</span>
            <h2>智慧製造情境流程</h2>
          </div>
        </div>
        <div class="story-grid">
          <div>
            <span>1</span>
            <strong>即時監控</strong>
            <p>Dashboard 先判斷 Fab health、瓶頸與即時串流品質。</p>
          </div>
          <div>
            <span>2</span>
            <strong>AI 分析</strong>
            <p>AI Insights 將 telemetry 轉成 anomaly score、RUL 與風險排序。</p>
          </div>
          <div>
            <span>3</span>
            <strong>現場處置</strong>
            <p>告警中心接續追蹤優先級、責任單位與處理建議。</p>
          </div>
          <div>
            <span>4</span>
            <strong>營運回顧</strong>
            <p>Analytics 以 OEE、良率、停機與排名回收成管理報表。</p>
          </div>
        </div>
      </article>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { NTag } from 'naive-ui'
import { useEquipmentStore } from '@/stores/equipment'
import { useWebSocket } from '@/composables/useWebSocket'
import type { Machine } from '@/types/equipment'

type RiskLevel = 'normal' | 'watch' | 'critical'

interface Factor {
  name: string
  value: string
  weight: number
}

interface MachineInsight {
  id: string
  area: string
  anomalyScore: number
  rulHours: number
  confidence: number
  throughputGap: number
  queue: number
  level: RiskLevel
  recommendation: string
  factors: Factor[]
}

const store = useEquipmentStore()
useWebSocket()

const selectedMachineId = ref('')

const machineInsights = computed<MachineInsight[]>(() =>
  store.machines
    .map(machineToInsight)
    .sort((a, b) => b.anomalyScore - a.anomalyScore)
)

const selectedInsight = computed(() =>
  machineInsights.value.find(item => item.id === selectedMachineId.value) ?? machineInsights.value[0]
)

const lineRiskScore = computed(() => {
  const topRisks = machineInsights.value.slice(0, 3)
  return Math.round(topRisks.reduce((sum, item) => sum + item.anomalyScore, 0) / topRisks.length)
})

const lineRiskLabel = computed(() => {
  if (lineRiskScore.value >= 70) return '高風險產線'
  if (lineRiskScore.value >= 45) return '需觀察'
  return '穩定'
})

const aiSummary = computed(() => [
  {
    label: '高風險設備',
    value: machineInsights.value.filter(item => item.level === 'critical').length,
    note: '需立即確認',
    tone: 'critical',
  },
  {
    label: '觀察設備',
    value: machineInsights.value.filter(item => item.level === 'watch').length,
    note: '班內追蹤',
    tone: 'watch',
  },
  {
    label: '最低 RUL',
    value: `${Math.min(...machineInsights.value.map(item => item.rulHours))} hr`,
    note: '預測保養窗口',
    tone: 'watch',
  },
  {
    label: '模型信心',
    value: `${Math.round(machineInsights.value.reduce((sum, item) => sum + item.confidence, 0) / machineInsights.value.length)}%`,
    note: 'rule-based demo',
    tone: 'normal',
  },
])

const maintenanceQueue = computed(() =>
  machineInsights.value
    .filter(item => item.level !== 'normal')
    .map(item => ({
      id: item.id,
      level: item.level,
      reason: item.factors[0]?.name ?? 'Telemetry drift',
      window: item.level === 'critical' ? '立即 / 本班' : '24 hr 內',
    }))
)

watchEffect(() => {
  if (!selectedMachineId.value && machineInsights.value.length > 0) {
    selectedMachineId.value = machineInsights.value[0].id
  }
})

function machineToInsight(machine: Machine): MachineInsight {
  const throughputGap = Math.max(machine.targetWph - machine.wph, 0)
  const throughputRisk = Math.min(Math.round((throughputGap / machine.targetWph) * 42), 42)
  const availabilityRisk = Math.max(0, Math.round((94 - machine.availability) * 1.1))
  const utilizationRisk = machine.status === 'error'
    ? 30
    : machine.status === 'idle'
      ? 18
      : Math.max(0, Math.round((72 - machine.utilization) * 0.7))
  const queueRisk = Math.min(Math.round(machine.queue * 0.55), 18)
  const signalRisk = signalRiskScore(machine)
  const anomalyScore = Math.min(
    99,
    Math.round(throughputRisk + availabilityRisk + utilizationRisk + queueRisk + signalRisk)
  )
  const level = anomalyScore >= 65 ? 'critical' : anomalyScore >= 38 ? 'watch' : 'normal'
  const rulHours = Math.max(2, Math.round(96 - anomalyScore * 0.82 - throughputGap * 0.08))
  const confidence = Math.min(96, Math.round(78 + anomalyScore * 0.18))

  return {
    id: machine.id,
    area: machine.area,
    anomalyScore,
    rulHours,
    confidence,
    throughputGap,
    queue: machine.queue,
    level,
    recommendation: recommendationFor(machine, level),
    factors: [
      { name: '產出缺口', value: `${throughputGap} WPH`, weight: Math.min(100, throughputRisk * 2.4) },
      { name: '可用率風險', value: `${machine.availability}%`, weight: Math.min(100, availabilityRisk * 4) },
      { name: '稼動狀態', value: statusText(machine.status), weight: Math.min(100, utilizationRisk * 3) },
      { name: 'Queue 壓力', value: `${machine.queue} lots`, weight: Math.min(100, queueRisk * 5) },
      { name: '製程訊號', value: signalText(machine), weight: Math.min(100, signalRisk * 5) },
    ].sort((a, b) => b.weight - a.weight),
  }
}

function signalRiskScore(machine: Machine): number {
  let score = 0
  if (machine.temperature !== undefined && machine.type === 'CVD') {
    score += machine.temperature > 316 ? 10 : 3
  }
  if (machine.pressure !== undefined) {
    score += machine.pressure > 4.55 ? 9 : 2
  }
  if (machine.errorCode) score += 16
  if (machine.downtimeSec && machine.downtimeSec > 900) score += 8
  return score
}

function signalText(machine: Machine): string {
  if (machine.errorCode) return machine.errorCode
  if (machine.pressure !== undefined) return `${machine.pressure.toFixed(2)} mTorr`
  if (machine.temperature !== undefined) return `${machine.temperature.toFixed(1)} C`
  if (machine.rfPower !== undefined) return `${machine.rfPower} W`
  return 'nominal'
}

function statusText(status: Machine['status']): string {
  const map: Record<Machine['status'], string> = {
    running: '運轉中',
    idle: '待機',
    error: '停機',
    maintenance: '保養',
  }
  return map[status]
}

function recommendationFor(machine: Machine, level: RiskLevel): string {
  if (level === 'critical') {
    return `立即通知 ${machine.owner}，暫停 hot lots 派工並建立工程處置紀錄。`
  }
  if (level === 'watch') {
    return `由 ${machine.owner} 於本班內確認 recipe、queue 與 release 條件。`
  }
  return '維持目前派工策略，持續監控 telemetry drift。'
}

function riskLevelLabel(level: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    normal: '穩定',
    watch: '觀察',
    critical: '高風險',
  }
  return map[level]
}

function riskTagType(level: RiskLevel): 'success' | 'warning' | 'error' {
  if (level === 'critical') return 'error'
  if (level === 'watch') return 'warning'
  return 'success'
}
</script>

<style scoped>
.ai-insights {
  width: min(1480px, calc(100% - 40px));
  margin: 0 auto;
  padding: 24px 0 42px;
}

.ai-hero,
.summary-card,
.panel {
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.ai-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 460px);
  gap: 24px;
  align-items: center;
  min-height: 260px;
  border-radius: 18px;
  background: var(--app-hero-bg);
  margin-bottom: 14px;
  padding: 34px;
}

.ai-hero h1 {
  max-width: 850px;
  margin: 12px 0;
  color: var(--app-hero-text);
  font-size: clamp(34px, 5vw, 62px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 0.98;
}

.ai-hero p {
  max-width: 760px;
  margin: 0;
  color: var(--app-hero-muted);
  font-size: 16px;
  line-height: 1.65;
}

.hero-model {
  display: grid;
  grid-template-columns: 168px 1fr;
  gap: 16px;
  align-items: center;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
  padding: 16px;
}

.model-orbit {
  display: grid;
  width: 148px;
  height: 148px;
  place-items: center;
  border-radius: 999px;
  background:
    radial-gradient(circle, var(--app-surface) 58%, transparent 59%),
    conic-gradient(#dc2626 calc(var(--risk, 0) * 1%), #16a34a 0);
}

.model-orbit strong,
.model-orbit span {
  grid-area: 1 / 1;
}

.model-orbit strong {
  color: var(--n-text-color-1);
  font-size: 42px;
  font-weight: 900;
  transform: translateY(-8px);
}

.model-orbit span {
  color: var(--n-text-color-3);
  font-size: 10px;
  font-weight: 900;
  text-transform: uppercase;
  transform: translateY(30px);
}

.model-meta {
  display: grid;
  gap: 8px;
}

.model-meta span,
.section-kicker,
.summary-card span,
.summary-card em,
.risk-head,
.detail-grid span {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.ai-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 14px;
}

.summary-card,
.panel {
  background: var(--app-surface);
}

.summary-card {
  border-radius: 14px;
  padding: 16px;
}

.summary-card--normal { border-top: 3px solid #16a34a; }
.summary-card--watch { border-top: 3px solid #d97706; }
.summary-card--critical { border-top: 3px solid #dc2626; }

.summary-card strong {
  display: block;
  margin-top: 10px;
  color: var(--n-text-color-1);
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.summary-card em {
  display: block;
  margin-top: 10px;
  font-style: normal;
}

.ai-layout {
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

.detail-panel {
  align-self: start;
  position: sticky;
  top: 82px;
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

.risk-table {
  display: grid;
  gap: 8px;
}

.risk-head,
.risk-row {
  display: grid;
  grid-template-columns: 1fr 1.15fr 1.5fr 0.8fr 90px;
  gap: 12px;
  align-items: center;
}

.risk-head {
  padding: 0 12px;
}

.risk-row {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-soft);
  color: var(--n-text-color-2);
  cursor: pointer;
  padding: 12px;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.risk-row:hover,
.risk-row.active {
  border-color: var(--app-border-strong);
  box-shadow: 0 14px 28px rgba(14, 165, 233, 0.14);
  transform: translateY(-1px);
}

.risk-row strong {
  color: var(--n-text-color-1);
  font-size: 14px;
}

.score-meter {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 34px;
  gap: 8px;
  align-items: center;
}

.score-meter em {
  display: block;
  height: 9px;
  border-radius: 999px;
  background: linear-gradient(90deg, #16a34a, #d97706, #dc2626);
}

.score-meter {
  position: relative;
}

.score-meter::before {
  content: "";
  position: absolute;
  left: 0;
  right: 42px;
  height: 9px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
}

.score-meter em {
  z-index: 1;
}

.score-meter b {
  color: var(--n-text-color-1);
  font-size: 13px;
}

.risk-pill {
  border-radius: 999px;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
  padding: 5px 8px;
  text-align: center;
}

.risk-pill--normal {
  background: rgba(22, 163, 74, 0.12);
  color: #16a34a;
}

.risk-pill--watch {
  background: rgba(217, 119, 6, 0.12);
  color: #d97706;
}

.risk-pill--critical {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.score-ring {
  display: grid;
  width: 178px;
  height: 178px;
  place-items: center;
  margin: 4px auto 20px;
  border-radius: 999px;
  background:
    radial-gradient(circle, var(--app-surface) 58%, transparent 59%),
    conic-gradient(#dc2626 var(--score), rgba(148, 163, 184, 0.18) 0);
}

.score-ring strong,
.score-ring span {
  grid-area: 1 / 1;
}

.score-ring strong {
  color: var(--n-text-color-1);
  font-size: 44px;
  font-weight: 900;
  transform: translateY(-8px);
}

.score-ring span {
  color: var(--n-text-color-3);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  transform: translateY(30px);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-grid div,
.recommendation,
.factor-row,
.maintenance-item,
.story-grid div {
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
}

.detail-grid div {
  border-radius: 10px;
  padding: 12px;
}

.detail-grid strong {
  display: block;
  margin-top: 5px;
  color: var(--n-text-color-1);
  font-size: 14px;
}

.recommendation {
  border-radius: 12px;
  margin-top: 12px;
  padding: 14px;
}

.recommendation--normal { border-left: 4px solid #16a34a; }
.recommendation--watch { border-left: 4px solid #d97706; }
.recommendation--critical { border-left: 4px solid #dc2626; }

.recommendation span {
  display: block;
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.recommendation strong {
  display: block;
  margin-top: 8px;
  color: var(--n-text-color-1);
  font-size: 14px;
  line-height: 1.5;
}

.factor-list,
.maintenance-list {
  display: grid;
  gap: 10px;
}

.factor-row {
  border-radius: 10px;
  padding: 12px;
}

.factor-row div:first-child,
.maintenance-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.factor-row span,
.maintenance-item span {
  color: var(--n-text-color-2);
  font-size: 13px;
  font-weight: 800;
}

.factor-row strong,
.maintenance-item strong {
  color: var(--n-text-color-1);
  font-size: 14px;
}

.factor-bar {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  margin-top: 10px;
}

.factor-bar em {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #2563eb;
}

.maintenance-item {
  border-radius: 10px;
  border-left-width: 4px;
  padding: 12px;
}

.maintenance-item--watch { border-left-color: #d97706; }
.maintenance-item--critical { border-left-color: #dc2626; }

.maintenance-item div {
  display: grid;
  gap: 4px;
}

.maintenance-item em {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
  white-space: nowrap;
}

.story-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.story-grid div {
  border-radius: 12px;
  padding: 14px;
}

.story-grid span {
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border-radius: 999px;
  background: var(--app-chip-bg);
  color: var(--app-chip-text);
  font-size: 12px;
  font-weight: 900;
}

.story-grid strong {
  display: block;
  margin-top: 12px;
  color: var(--n-text-color-1);
  font-size: 15px;
}

.story-grid p {
  margin: 6px 0 0;
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.5;
}

@media (max-width: 1180px) {
  .ai-hero,
  .ai-layout {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    position: static;
  }
}

@media (max-width: 860px) {
  .ai-insights {
    width: min(100% - 24px, 1480px);
    padding: 14px 0 86px;
  }

  .ai-hero,
  .hero-model,
  .ai-summary,
  .story-grid {
    grid-template-columns: 1fr;
  }

  .ai-hero {
    padding: 24px;
  }

  .model-orbit {
    margin: 0 auto;
  }

  .risk-head {
    display: none;
  }

  .risk-row {
    grid-template-columns: 1fr 1fr;
  }

  .score-meter {
    grid-column: 1 / -1;
  }

  .section-header {
    flex-direction: column;
  }
}
</style>
