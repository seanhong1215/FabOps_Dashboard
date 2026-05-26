import type { MachineStatus } from '@/types/equipment'

export function formatDowntime(sec: number): string {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  return [h, m, s].map(n => String(n).padStart(2, '0')).join(':')
}

export function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function toFixed(n: number, digits = 1): string {
  return n.toFixed(digits)
}

export function nowHMS(): string {
  return new Date().toLocaleTimeString('en-US', { hour12: false })
}

export function statusToTagType(
  status: MachineStatus
): 'success' | 'warning' | 'error' | 'default' {
  const map: Record<MachineStatus, 'success' | 'warning' | 'error' | 'default'> = {
    running: 'success',
    idle: 'warning',
    error: 'error',
    maintenance: 'default',
  }
  return map[status]
}

export function statusLabel(status: MachineStatus): string {
  const map: Record<MachineStatus, string> = {
    running: '運轉中',
    idle: '待機',
    error: '停機',
    maintenance: '保養',
  }
  return map[status]
}
