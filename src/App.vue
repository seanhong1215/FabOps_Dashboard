<template>
  <n-config-provider :theme="theme" :locale="zhTW" :date-locale="dateZhTW">
    <n-layout class="app-shell" :class="isDark ? 'app-shell--dark' : 'app-shell--light'">
      <n-layout-header bordered class="app-header">
        <div class="brand">
          <div class="brand-mark">FD</div>
          <div>
            <n-text strong class="brand-title">FabOps Dashboard</n-text>
            <div class="brand-subtitle">廠務營運戰情中心</div>
          </div>
        </div>

        <nav class="app-nav" aria-label="Primary">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="nav-link"
          >
            <n-icon :component="item.icon" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <n-space align="center" :size="10">
          <n-tag size="small" round type="info">展示資料</n-tag>
          <n-button quaternary circle size="small" @click="toggleDark">
            <template #icon>
              <n-icon :component="isDark ? SunIcon : MoonIcon" />
            </template>
          </n-button>
        </n-space>
      </n-layout-header>

      <n-layout-content>
        <router-view />
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, provide } from 'vue'
import { RouterLink } from 'vue-router'
import {
  NConfigProvider,
  NLayout,
  NLayoutHeader,
  NLayoutContent,
  NText,
  NSpace,
  NButton,
  NIcon,
  NTag,
  darkTheme,
  useOsTheme,
  zhTW,
  dateZhTW,
} from 'naive-ui'
import {
  Sun as SunIcon,
  Moon as MoonIcon,
  Dashboard as DashboardIcon,
  Sitemap as SitemapIcon,
  BellRinging as BellRingingIcon,
} from '@vicons/tabler'

const osTheme = useOsTheme()
const forceDark = ref<boolean | null>(null)
const navItems = [
  { to: '/', label: '即時總覽', icon: DashboardIcon },
  { to: '/factory-map', label: '廠區地圖', icon: SitemapIcon },
  { to: '/alarms', label: '告警中心', icon: BellRingingIcon },
]

const isDark = computed(() =>
  forceDark.value !== null ? forceDark.value : osTheme.value === 'dark'
)

const theme = computed(() => (isDark.value ? darkTheme : null))

provide('isDark', isDark)

function toggleDark() {
  forceDark.value = !isDark.value
}
</script>

<style>
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: #f4f7fb;
  color: #0f172a;
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.n-config-provider {
  min-height: 100vh;
}

.app-shell {
  --app-bg:
    linear-gradient(180deg, rgba(14, 165, 233, 0.08), transparent 360px),
    #f4f7fb;
  --app-surface: rgba(255, 255, 255, 0.94);
  --app-surface-strong: #ffffff;
  --app-surface-soft: rgba(241, 245, 249, 0.86);
  --app-border: rgba(15, 23, 42, 0.12);
  --app-border-strong: rgba(15, 23, 42, 0.18);
  --app-shadow: 0 18px 44px rgba(15, 23, 42, 0.1);
  --app-header-bg: rgba(255, 255, 255, 0.88);
  --app-header-text: #0f172a;
  --app-header-muted: #64748b;
  --app-brand-bg: #0f172a;
  --app-brand-text: #ffffff;
  --app-hero-bg:
    linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(224, 242, 254, 0.86)),
    radial-gradient(circle at 78% 18%, rgba(14, 165, 233, 0.2), transparent 34%);
  --app-hero-text: #0f172a;
  --app-hero-muted: #475569;
  --app-hero-eyebrow: #0369a1;
  --app-chip-bg: rgba(14, 165, 233, 0.12);
  --app-chip-text: #0369a1;
  min-height: 100vh;
  background: var(--app-bg);
  color: var(--app-header-text);
}

.app-shell--dark {
  --app-bg:
    linear-gradient(180deg, rgba(14, 165, 233, 0.1), transparent 360px),
    #080f1f;
  --app-surface: rgba(15, 23, 42, 0.94);
  --app-surface-strong: #111827;
  --app-surface-soft: rgba(30, 41, 59, 0.72);
  --app-border: rgba(148, 163, 184, 0.2);
  --app-border-strong: rgba(203, 213, 225, 0.28);
  --app-shadow: 0 22px 52px rgba(0, 0, 0, 0.28);
  --app-header-bg: rgba(8, 15, 31, 0.9);
  --app-header-text: #e5edf8;
  --app-header-muted: #94a3b8;
  --app-brand-bg: #38bdf8;
  --app-brand-text: #082f49;
  --app-hero-bg:
    linear-gradient(135deg, rgba(2, 6, 23, 0.98), rgba(15, 23, 42, 0.94)),
    radial-gradient(circle at 78% 18%, rgba(56, 189, 248, 0.28), transparent 34%);
  --app-hero-text: #f8fafc;
  --app-hero-muted: rgba(203, 213, 225, 0.9);
  --app-hero-eyebrow: #7dd3fc;
  --app-chip-bg: rgba(56, 189, 248, 0.14);
  --app-chip-text: #7dd3fc;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: var(--app-header-bg);
  color: var(--app-header-text);
  backdrop-filter: blur(18px);
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-soft);
  padding: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  min-height: 34px;
  border-radius: 999px;
  color: var(--app-header-muted);
  padding: 0 13px;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition:
    background 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease;
}

.nav-link .n-icon {
  font-size: 17px;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: var(--app-surface-strong);
  color: var(--app-header-text);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.brand-mark {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  background: var(--app-brand-bg);
  color: var(--app-brand-text);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0;
}

.brand-title {
  display: block;
  color: var(--app-header-text);
  font-size: 14px;
  letter-spacing: 0;
}

.brand-subtitle {
  color: var(--app-header-muted);
  font-size: 12px;
  line-height: 1.2;
}

.n-card {
  border-radius: 12px;
}

@media (max-width: 640px) {
  .app-header {
    gap: 10px;
    height: 58px;
    padding: 0 12px;
  }

  .app-nav {
    order: 3;
    position: fixed;
    right: 12px;
    bottom: 12px;
    left: 12px;
    z-index: 30;
    justify-content: center;
    box-shadow: var(--app-shadow);
  }

  .nav-link {
    flex: 1;
    justify-content: center;
    padding: 0 10px;
  }

  .brand-subtitle {
    display: none;
  }
}
</style>
