const LOCAL_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
]

const PUBLIC_ORIGINS = [
  'https://seanhong1215.github.io',
]

function parseOrigins(value = ''): string[] {
  return value
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
}

export const ALLOWED_ORIGINS = new Set([
  ...LOCAL_ORIGINS,
  ...PUBLIC_ORIGINS,
  ...parseOrigins(process.env.ALLOWED_ORIGINS),
])

export function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true
  return ALLOWED_ORIGINS.has(origin) || origin.endsWith('.company.com')
}
