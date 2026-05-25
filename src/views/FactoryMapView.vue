<template>
  <main class="factory-map">
    <section class="map-hero">
      <div>
        <span class="section-kicker">Digital twin</span>
        <h1>廠區數位分身與產線地圖</h1>
        <p>
          將設備位置、WIP 壓力、站點風險與即時告警整合成值班現場可快速判讀的產線視圖。
        </p>
      </div>

      <div class="command-metrics">
        <div>
          <span>產線健康</span>
          <strong>{{ store.fabHealth }}</strong>
        </div>
        <div>
          <span>有效告警</span>
          <strong>{{ activeAlarmCount }}</strong>
        </div>
        <div>
          <span>WIP 排隊</span>
          <strong>{{ store.totalQueue }}</strong>
        </div>
      </div>
    </section>

    <section class="flow-section">
      <div class="section-header">
        <div>
          <span class="section-kicker">生產流程</span>
          <h2>物料流動與站點風險</h2>
        </div>
        <n-tag type="info" round>延遲 &lt; 1s 展示</n-tag>
      </div>

      <div class="flow-track">
        <article
          v-for="(station, index) in stations"
          :key="station.id"
          class="station-card"
          :class="`station-card--${station.severity}`"
        >
          <div class="station-topline">
            <span class="status-dot" />
            <span>{{ station.phase }}</span>
          </div>
          <h3>{{ station.name }}</h3>
          <div class="station-meta">
            <span>{{ station.tools.length }} 台設備</span>
            <span>{{ station.queue }} lots</span>
          </div>
          <n-progress
            type="line"
            :percentage="station.health"
            :show-indicator="false"
            :height="8"
            :color="station.color"
            rail-color="rgba(148, 163, 184, 0.18)"
          />
          <div class="station-footer">
            <strong>{{ station.health }}%</strong>
            <span>{{ station.summary }}</span>
          </div>
          <div v-if="index < stations.length - 1" class="flow-pulse" />
        </article>
      </div>
    </section>

    <section class="layout-grid">
      <div class="fab-layout">
        <div class="section-header">
          <div>
            <span class="section-kicker">廠區配置</span>
            <h2>區域地圖與設備位置</h2>
          </div>
          <span class="updated">更新 {{ store.lastUpdated || '--:--:--' }}</span>
        </div>

        <div class="bay-map">
          <button
            v-for="machine in positionedMachines"
            :key="machine.id"
            class="machine-node"
            :class="[
              `machine-node--${machine.status}`,
              { 'machine-node--active': selectedMachine?.id === machine.id },
            ]"
            :style="{ gridArea: machine.gridArea }"
            type="button"
            @click="selectedMachineId = machine.id"
          >
            <span class="node-light" />
            <strong>{{ machine.name }}</strong>
            <small>{{ machine.area }}</small>
            <em>{{ machine.wph }}/{{ machine.targetWph }} WPH</em>
          </button>
        </div>
      </div>

      <aside class="detail-panel">
        <div class="section-header">
          <div>
            <span class="section-kicker">選取設備</span>
            <h2>{{ selectedMachine?.name }}</h2>
          </div>
          <n-tag v-if="selectedMachine" :type="statusToTagType(selectedMachine.status)" round>
            {{ statusLabel(selectedMachine.status) }}
          </n-tag>
        </div>

        <template v-if="selectedMachine">
          <div class="health-ring" :style="{ '--ring': `${selectedHealth}%` }">
            <strong>{{ selectedHealth }}</strong>
            <span>健康分數</span>
          </div>

          <div class="detail-list">
            <div>
              <span>製程配方</span>
              <strong>{{ selectedMachine.recipe }}</strong>
            </div>
            <div>
              <span>責任單位</span>
              <strong>{{ selectedMachine.owner }}</strong>
            </div>
            <div>
              <span>可用率</span>
              <strong>{{ selectedMachine.availability }}%</strong>
            </div>
            <div>
              <span>稼動率</span>
              <strong>{{ selectedMachine.utilization }}%</strong>
            </div>
            <div>
              <span>排隊批量</span>
              <strong>{{ selectedMachine.queue }} lots</strong>
            </div>
            <div>
              <span>產出缺口</span>
              <strong>{{ selectedMachine.targetWph - selectedMachine.wph }} WPH</strong>
            </div>
          </div>

          <div class="risk-panel" :class="`risk-panel--${selectedRisk.level}`">
            <span>{{ selectedRisk.label }}</span>
            <strong>{{ selectedRisk.action }}</strong>
          </div>
        </template>
      </aside>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { NProgress, NTag } from 'naive-ui'
import { useEquipmentStore } from '@/stores/equipment'
import { useWebSocket } from '@/composables/useWebSocket'
import { statusLabel, statusToTagType } from '@/utils/format'
import type { Machine, MachineStatus, MachineType } from '@/types/equipment'

type StationSeverity = 'normal' | 'watch' | 'critical'

interface Station {
  id: string
  name: string
  phase: string
  types: MachineType[]
}

const store = useEquipmentStore()
useWebSocket()

const selectedMachineId = ref('')

const stationDefs: Station[] = [
  { id: 'raw', name: '來料與植入', phase: '進料', types: ['IMP'] },
  { id: 'process', name: '薄膜 / 蝕刻 / 擴散', phase: '主製程', types: ['CVD', 'ETCH', 'DIFF'] },
  { id: 'pattern', name: '黃光關鍵站', phase: '圖形化', types: ['LITHO'] },
  { id: 'finish', name: 'CMP 平坦化', phase: '檢驗前', types: ['CMP'] },
  { id: 'ship', name: '出貨緩衝與線平衡', phase: '出貨緩衝', types: ['CVD', 'ETCH', 'CMP', 'IMP', 'LITHO', 'DIFF'] },
]

const activeAlarmCount = computed(() =>
  store.machines.filter(machine => machine.status === 'error' || machine.status === 'idle').length
)

const stations = computed(() =>
  stationDefs.map(station => {
    const tools = station.id === 'ship'
      ? store.machines
      : store.machines.filter(machine => station.types.includes(machine.type))
    const queue = tools.reduce((sum, machine) => sum + machine.queue, 0)
    const health = Math.round(
      tools.reduce((sum, machine) => sum + machineHealth(machine), 0) / tools.length
    )
    const severity = stationSeverity(tools)
    return {
      ...station,
      tools,
      queue,
      health,
      severity,
      color: severityColor(severity),
      summary: stationSummary(severity),
    }
  })
)

const positionedMachines = computed(() =>
  store.machines.map(machine => ({
    ...machine,
    gridArea: machineGridArea(machine.type),
  }))
)

const selectedMachine = computed(() =>
  store.machines.find(machine => machine.id === selectedMachineId.value) ?? store.bottleneck
)

const selectedHealth = computed(() =>
  selectedMachine.value ? machineHealth(selectedMachine.value) : 0
)

const selectedRisk = computed(() => {
  const machine = selectedMachine.value
  if (!machine) {
    return { level: 'normal', label: '未選取設備', action: '請從廠區地圖選取設備節點。' }
  }
  if (machine.status === 'error') {
    return {
      level: 'critical',
      label: '立即處置',
      action: '通知設備責任單位，並暫停 hot lots 派工至此路徑。',
    }
  }
  if (machine.status === 'idle' || machine.wph / machine.targetWph < 0.75) {
    return {
      level: 'watch',
      label: '產能風險',
      action: '確認 release 條件，並重新平衡 dispatch priority。',
    }
  }
  return {
    level: 'normal',
    label: '穩定運轉',
    action: '維持目前 recipe window，持續監控 queue 壓力。',
  }
})

watchEffect(() => {
  if (!selectedMachineId.value && store.bottleneck) {
    selectedMachineId.value = store.bottleneck.id
  }
})

function machineHealth(machine: Machine): number {
  const throughput = Math.min((machine.wph / machine.targetWph) * 100, 100)
  const statusPenalty: Record<MachineStatus, number> = {
    running: 0,
    idle: 14,
    maintenance: 18,
    error: 42,
  }
  return Math.max(
    0,
    Math.round(machine.availability * 0.42 + machine.utilization * 0.28 + throughput * 0.3 - statusPenalty[machine.status])
  )
}

function stationSeverity(tools: Machine[]): StationSeverity {
  if (tools.some(machine => machine.status === 'error')) return 'critical'
  if (tools.some(machine => machine.status === 'idle' || machine.wph / machine.targetWph < 0.8)) {
    return 'watch'
  }
  return 'normal'
}

function severityColor(severity: StationSeverity): string {
  if (severity === 'critical') return '#dc2626'
  if (severity === 'watch') return '#d97706'
  return '#16a34a'
}

function stationSummary(severity: StationSeverity): string {
  if (severity === 'critical') return '告警中'
  if (severity === 'watch') return '產能觀察'
  return '流動穩定'
}

function machineGridArea(type: MachineType): string {
  const map: Record<MachineType, string> = {
    CVD: 'thin',
    ETCH: 'etch',
    CMP: 'cmp',
    IMP: 'implant',
    LITHO: 'litho',
    DIFF: 'thermal',
  }
  return map[type]
}
</script>

<style scoped>
.factory-map {
  width: min(1480px, calc(100% - 40px));
  margin: 0 auto;
  padding: 24px 0 42px;
}

.map-hero,
.flow-section,
.fab-layout,
.detail-panel {
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.map-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(340px, 520px);
  gap: 24px;
  align-items: end;
  border-radius: 18px;
  background: var(--app-hero-bg);
  color: var(--app-hero-text);
  margin-bottom: 14px;
  min-height: 250px;
  padding: 34px;
}

.map-hero h1 {
  max-width: 820px;
  margin: 12px 0;
  color: var(--app-hero-text);
  font-size: clamp(34px, 5vw, 62px);
  font-weight: 900;
  letter-spacing: 0;
  line-height: 0.96;
}

.map-hero p {
  max-width: 680px;
  margin: 0;
  color: var(--app-hero-muted);
  font-size: 16px;
  line-height: 1.6;
}

.command-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.command-metrics div,
.station-card,
.detail-list div,
.risk-panel {
  border: 1px solid var(--app-border);
  background: var(--app-surface);
}

.command-metrics div {
  border-radius: 12px;
  padding: 14px;
}

.command-metrics span,
.station-meta,
.station-footer span,
.detail-list span,
.updated,
.section-kicker {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.command-metrics strong {
  display: block;
  margin-top: 10px;
  color: var(--n-text-color-1);
  font-size: 34px;
  font-weight: 900;
  line-height: 1;
}

.flow-section,
.fab-layout,
.detail-panel {
  border-radius: 14px;
  background: var(--app-surface);
  padding: 20px;
}

.flow-section {
  margin-bottom: 14px;
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

.flow-track {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.station-card {
  position: relative;
  min-height: 178px;
  overflow: hidden;
  border-radius: 12px;
  padding: 16px;
}

.station-card--normal { border-top: 3px solid #16a34a; }
.station-card--watch { border-top: 3px solid #d97706; }
.station-card--critical { border-top: 3px solid #dc2626; }

.station-topline,
.station-meta,
.station-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.station-topline {
  color: var(--n-text-color-2);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.status-dot,
.node-light {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #16a34a;
  box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.12);
}

.station-card--watch .status-dot {
  background: #d97706;
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.14);
}

.station-card--critical .status-dot {
  background: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.16);
}

.station-card h3 {
  margin: 18px 0 12px;
  color: var(--n-text-color-1);
  font-size: 18px;
  font-weight: 900;
  letter-spacing: 0;
}

.station-footer {
  margin-top: 12px;
}

.station-footer strong {
  color: var(--n-text-color-1);
  font-size: 22px;
  font-weight: 900;
}

.flow-pulse {
  position: absolute;
  top: 50%;
  right: -10px;
  z-index: 2;
  width: 20px;
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #38bdf8, transparent);
  animation: pulse-move 1.8s ease-in-out infinite;
}

.layout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 14px;
}

.bay-map {
  display: grid;
  grid-template-areas:
    "thin thin litho"
    "etch implant litho"
    "thermal cmp cmp";
  grid-template-columns: 1fr 1fr 1fr;
  grid-auto-rows: minmax(150px, 1fr);
  gap: 12px;
}

.machine-node {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  min-height: 150px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background:
    linear-gradient(135deg, rgba(14, 165, 233, 0.08), transparent 56%),
    var(--app-surface-soft);
  color: var(--n-text-color-1);
  cursor: pointer;
  padding: 16px;
  text-align: left;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.machine-node:hover,
.machine-node--active {
  border-color: var(--app-border-strong);
  box-shadow: 0 16px 34px rgba(14, 165, 233, 0.14);
  transform: translateY(-2px);
}

.machine-node--idle .node-light {
  background: #d97706;
  box-shadow: 0 0 0 4px rgba(217, 119, 6, 0.14);
}

.machine-node--error .node-light {
  background: #dc2626;
  box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.16);
  animation: alarm-blink 1.1s ease-in-out infinite;
}

.machine-node strong {
  font-size: 20px;
  font-weight: 900;
}

.machine-node small,
.machine-node em {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-style: normal;
  font-weight: 800;
  text-transform: uppercase;
}

.detail-panel {
  position: sticky;
  top: 82px;
  align-self: start;
}

.health-ring {
  display: grid;
  width: 178px;
  height: 178px;
  place-items: center;
  margin: 4px auto 20px;
  border-radius: 999px;
  background:
    radial-gradient(circle, var(--app-surface) 58%, transparent 59%),
    conic-gradient(#16a34a var(--ring), rgba(148, 163, 184, 0.18) 0);
}

.health-ring strong,
.health-ring span {
  grid-area: 1 / 1;
}

.health-ring strong {
  color: var(--n-text-color-1);
  font-size: 44px;
  font-weight: 900;
  transform: translateY(-8px);
}

.health-ring span {
  color: var(--n-text-color-3);
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  transform: translateY(30px);
}

.detail-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.detail-list div {
  border-radius: 10px;
  padding: 12px;
}

.detail-list strong {
  display: block;
  margin-top: 5px;
  color: var(--n-text-color-1);
  font-size: 14px;
}

.risk-panel {
  border-radius: 12px;
  margin-top: 12px;
  padding: 14px;
}

.risk-panel--normal { border-left: 4px solid #16a34a; }
.risk-panel--watch { border-left: 4px solid #d97706; }
.risk-panel--critical { border-left: 4px solid #dc2626; }

.risk-panel span {
  display: block;
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.risk-panel strong {
  display: block;
  margin-top: 8px;
  color: var(--n-text-color-1);
  font-size: 14px;
  line-height: 1.5;
}

@keyframes pulse-move {
  0%, 100% { opacity: 0.35; transform: translateX(-4px); }
  50% { opacity: 1; transform: translateX(5px); }
}

@keyframes alarm-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.35; }
}

@media (max-width: 1180px) {
  .map-hero,
  .layout-grid {
    grid-template-columns: 1fr;
  }

  .flow-track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-panel {
    position: static;
  }
}

@media (max-width: 760px) {
  .factory-map {
    width: min(100% - 24px, 1480px);
    padding: 14px 0 86px;
  }

  .map-hero {
    padding: 24px;
  }

  .command-metrics,
  .flow-track,
  .bay-map,
  .detail-list {
    grid-template-columns: 1fr;
  }

  .bay-map {
    grid-template-areas:
      "thin"
      "etch"
      "implant"
      "litho"
      "thermal"
      "cmp";
  }

  .section-header {
    flex-direction: column;
  }
}
</style>
