<template>
  <main class="dashboard">
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Fab 戰情中心 - 12 吋產線</div>
        <h1>即時設備營運與產線健康監控</h1>
        <p>
          整合設備健康、瓶頸偵測、製程訊號、即時串流與異常處置，提供值班主管可直接判讀的生產監控介面。
        </p>
      </div>

      <div class="hero-panel">
        <div class="status-strip">
          <n-badge :type="store.wsConnected ? 'success' : 'error'" dot :processing="store.wsConnected" />
          <span>{{ store.wsConnected ? '即時串流連線中' : '即時串流離線' }}</span>
        </div>
        <div class="hero-score">{{ store.fabHealth }}</div>
        <div class="hero-score-label">Fab 健康分數</div>
        <div class="hero-stats">
          <span>{{ store.runningCount }} 台運轉</span>
          <span>{{ store.errorCount }} 台停機</span>
          <span>{{ store.totalQueue }} lots 排隊</span>
        </div>
      </div>
    </section>

    <section class="stream-panel">
      <div class="section-header">
        <div>
          <span class="section-kicker">Realtime system</span>
          <h2>即時串流健康狀態</h2>
        </div>
        <n-tag :type="streamTagType" round>{{ streamQualityLabel }}</n-tag>
      </div>
      <div class="stream-grid">
        <div>
          <span>資料模式</span>
          <strong>{{ store.streamMode === 'demo' ? 'Demo simulation' : 'Live WebSocket' }}</strong>
        </div>
        <div>
          <span>連線狀態</span>
          <strong>{{ readyStateLabel }}</strong>
        </div>
        <div>
          <span>Heartbeat</span>
          <strong>{{ heartbeatLabel }}</strong>
        </div>
        <div>
          <span>Latency</span>
          <strong>{{ store.latencyMs }} ms</strong>
        </div>
        <div>
          <span>Reconnect</span>
          <strong>{{ store.reconnectAttempts }} 次</strong>
        </div>
        <div>
          <span>最後心跳</span>
          <strong>{{ store.lastHeartbeatAt || '--:--:--' }}</strong>
        </div>
      </div>
    </section>

    <section class="insight-grid">
      <KpiCard
        label="整體 OEE"
        :value="store.kpi.oee"
        unit="%"
        :delta="store.kpi.oeeChange"
        delta-unit="%"
        tone="good"
      />
      <KpiCard
        label="產線 WPH"
        :value="store.kpi.wph"
        unit="/h"
        :decimals="0"
        note="較計畫 +3 wafers"
        tone="good"
      />
      <KpiCard
        label="一次良率"
        :value="store.kpi.yield"
        unit="%"
        :delta="-0.3"
        delta-unit="%"
        tone="warn"
      />
      <KpiCard
        label="CVD 平均溫度"
        :value="store.kpi.avgTemp"
        unit="C"
        note="維持在管制區間"
        tone="good"
      />
    </section>

    <section class="operations-row">
      <n-card class="ops-card" :bordered="false">
        <div class="section-header">
          <div>
            <span class="section-kicker">瓶頸設備</span>
            <h2>{{ store.bottleneck.name }} 為目前主要產能限制</h2>
          </div>
          <n-tag :type="statusToTagType(store.bottleneck.status)" round>
            {{ statusLabel(store.bottleneck.status) }}
          </n-tag>
        </div>
        <div class="bottleneck-grid">
          <div>
            <span>產出缺口</span>
            <strong>{{ bottleneckGap }} WPH</strong>
          </div>
          <div>
            <span>Queue 影響</span>
            <strong>{{ store.bottleneck.queue }} lots</strong>
          </div>
          <div>
            <span>責任單位</span>
            <strong>{{ store.bottleneck.owner }}</strong>
          </div>
        </div>
      </n-card>

      <n-card class="ops-card" :bordered="false">
        <div class="section-header">
          <div>
            <span class="section-kicker">值班重點</span>
            <h2>建議處置動作</h2>
          </div>
          <n-tag type="info" round>自動分級</n-tag>
        </div>
        <ol class="action-list">
          <li>升級處理 LITHO-02 stage fault，暫停 hot lots 派工至該設備。</li>
          <li>CMP-02 完成 slurry validation 後釋放，降低下游待料風險。</li>
          <li>CVD 壓力維持低於 4.7 mTorr，同時確認 WPH 穩定高於 120。</li>
        </ol>
      </n-card>
    </section>

    <section class="chart-grid">
      <n-card class="chart-card chart-card--wide" :bordered="false">
        <div class="section-header">
          <div>
            <span class="section-kicker">製程管制</span>
            <h2>CVD 腔體溫度</h2>
          </div>
          <span class="updated">更新 {{ store.lastUpdated || '--:--:--' }}</span>
        </div>
        <TempChart :series="store.temperatureSeries" :is-dark="isDark" />
      </n-card>

      <n-card class="chart-card" :bordered="false">
        <div class="section-header">
          <div>
            <span class="section-kicker">產出效率</span>
            <h2>各設備 WPH</h2>
          </div>
        </div>
        <WphChart :data="store.wphByMachine" :is-dark="isDark" />
      </n-card>

      <n-card class="chart-card" :bordered="false">
        <div class="section-header">
          <div>
            <span class="section-kicker">品質</span>
            <h2>良率組成</h2>
          </div>
        </div>
        <YieldChart :yield-pct="store.kpi.yield" :is-dark="isDark" />
      </n-card>

      <n-card class="chart-card chart-card--wide" :bordered="false">
        <div class="section-header">
          <div>
            <span class="section-kicker">腔體訊號</span>
            <h2>壓力與氣體流量</h2>
          </div>
        </div>
        <PressureFlowChart
          :pressure-series="store.pressureSeries"
          :flow-series="store.flowSeries"
          :is-dark="isDark"
        />
      </n-card>
    </section>

    <section class="tool-section">
      <div class="section-header section-header--outside">
        <div>
          <span class="section-kicker">設備群組</span>
          <h2>設備健康矩陣</h2>
        </div>
        <span class="updated">監控 {{ store.machines.length }} 台設備</span>
      </div>
      <div class="machine-grid">
        <MachineStatus
          v-for="machine in store.machines"
          :key="machine.id"
          :machine="machine"
        />
      </div>
    </section>

    <section class="log-section">
      <EventLog :logs="store.logs" />
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, inject, type ComputedRef } from 'vue'
import { NBadge, NCard, NTag, useOsTheme } from 'naive-ui'
import { useEquipmentStore } from '@/stores/equipment'
import { useWebSocket } from '@/composables/useWebSocket'
import { useSSE } from '@/composables/useSSE'
import { statusLabel, statusToTagType } from '@/utils/format'
import KpiCard from '@/components/KpiCard.vue'
import MachineStatus from '@/components/MachineStatus.vue'
import TempChart from '@/components/TempChart.vue'
import WphChart from '@/components/WphChart.vue'
import YieldChart from '@/components/YieldChart.vue'
import PressureFlowChart from '@/components/PressureFlowChart.vue'
import EventLog from '@/components/EventLog.vue'

const store = useEquipmentStore()
const osTheme = useOsTheme()
const injectedIsDark = inject<ComputedRef<boolean>>('isDark')
const isDark = computed(() => injectedIsDark?.value ?? osTheme.value === 'dark')
const bottleneckGap = computed(() => store.bottleneck.targetWph - store.bottleneck.wph)

const streamTagType = computed(() => {
  if (store.streamQuality === 'healthy') return 'success'
  if (store.streamQuality === 'watch') return 'warning'
  return 'error'
})

const streamQualityLabel = computed(() => {
  if (store.streamQuality === 'healthy') return '串流健康'
  if (store.streamQuality === 'watch') return '延遲觀察'
  return '串流離線'
})

const readyStateLabel = computed(() => {
  const map = {
    connecting: '連線中',
    open: '已連線',
    reconnecting: '重新連線',
    closed: '已關閉',
    error: '傳輸異常',
  }
  return map[store.readyState]
})

const heartbeatLabel = computed(() => {
  const map = {
    healthy: '正常',
    delayed: '延遲',
    offline: '離線',
  }
  return map[store.heartbeatStatus]
})

useWebSocket()
useSSE()
</script>

<style scoped>
.dashboard {
  width: min(1480px, calc(100% - 40px));
  margin: 0 auto;
  padding: 24px 0 42px;
}

.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 22px;
  align-items: stretch;
  margin-bottom: 14px;
}

.hero-copy,
.hero-panel,
.stream-panel,
.ops-card,
.chart-card,
.log-section {
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.hero-copy {
  border-radius: 18px;
  background: var(--app-hero-bg);
  color: var(--app-hero-text);
  min-height: 260px;
  padding: 34px;
}

.eyebrow,
.section-kicker,
.updated {
  color: var(--n-text-color-3);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.hero-copy .eyebrow {
  color: var(--app-hero-eyebrow);
}

.hero h1 {
  max-width: 780px;
  margin: 16px 0 12px;
  color: var(--app-hero-text);
  font-size: clamp(34px, 5vw, 64px);
  font-weight: 850;
  letter-spacing: 0;
  line-height: 0.95;
}

.hero p {
  max-width: 720px;
  margin: 0;
  color: var(--app-hero-muted);
  font-size: 16px;
  line-height: 1.6;
}

.hero-panel,
.stream-panel {
  border-radius: 18px;
  background: var(--app-surface);
  padding: 26px;
}

.status-strip,
.hero-stats {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--n-text-color-2);
  font-size: 13px;
  font-weight: 700;
}

.hero-score {
  margin-top: 32px;
  color: var(--n-text-color-1);
  font-size: 86px;
  font-weight: 900;
  line-height: 0.9;
}

.hero-score-label {
  margin-top: 8px;
  color: var(--n-text-color-3);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.hero-stats {
  flex-wrap: wrap;
  margin-top: 34px;
}

.hero-stats span {
  border-radius: 999px;
  background: var(--app-chip-bg);
  color: var(--app-chip-text);
  padding: 7px 10px;
}

.stream-panel {
  margin-bottom: 14px;
}

.stream-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}

.stream-grid div {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-soft);
  padding: 12px;
}

.stream-grid span,
.bottleneck-grid span {
  display: block;
  color: var(--n-text-color-3);
  font-size: 12px;
}

.stream-grid strong,
.bottleneck-grid strong {
  display: block;
  margin-top: 6px;
  color: var(--n-text-color-1);
  font-size: 18px;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface-soft);
  box-shadow: var(--app-shadow);
  margin-bottom: 14px;
  padding: 14px;
}

.operations-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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

.section-header--outside {
  margin: 22px 0 12px;
}

.bottleneck-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.bottleneck-grid div {
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface-soft);
  padding: 12px;
}

.action-list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding-left: 20px;
  color: var(--n-text-color-2);
  font-size: 13px;
  line-height: 1.5;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.chart-card--wide {
  grid-column: span 1;
}

.machine-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.log-section {
  border-radius: 12px;
  margin-top: 14px;
}

.ops-card,
.chart-card {
  background: var(--app-surface);
}

@media (max-width: 1180px) {
  .stream-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .hero,
  .operations-row,
  .chart-grid {
    grid-template-columns: 1fr;
  }

  .insight-grid,
  .machine-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .dashboard {
    width: min(100% - 24px, 1480px);
    padding-top: 14px;
  }

  .hero-copy {
    min-height: 230px;
    padding: 24px;
  }

  .hero-panel,
  .stream-panel {
    padding: 22px;
  }

  .insight-grid,
  .machine-grid,
  .bottleneck-grid,
  .stream-grid {
    grid-template-columns: 1fr;
  }
}
</style>
