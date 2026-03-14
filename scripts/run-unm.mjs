import { existsSync, readFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import path from 'node:path'

const parseEnv = (text) => {
  const out = {}
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line) continue
    if (line.startsWith('#')) continue
    const eq = line.indexOf('=')
    if (eq <= 0) continue
    const key = line.slice(0, eq).trim()
    let value = line.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

const loadEnvFiles = (cwd) => {
  const files = ['.env', '.env.local']
  const merged = {}
  for (const name of files) {
    const file = path.join(cwd, name)
    if (!existsSync(file)) continue
    Object.assign(merged, parseEnv(readFileSync(file, 'utf8')))
  }
  return merged
}

const cwd = process.cwd()
const fileEnv = loadEnvFiles(cwd)
const mergedEnv = { ...process.env, ...fileEnv }
const port = Number(mergedEnv.VITE_UNBLOCK_PORT || mergedEnv.UNM_PORT || 3100)
const sourcesRaw =
  mergedEnv.VITE_UNBLOCK_SOURCES ||
  mergedEnv.UNM_SOURCES ||
  'https://www.123865.com/s/ZhzPvd-WFdO'
const isHttpUrl = (value) => /^https?:\/\//i.test(value.trim())
const normalizeSourceToken = (value) => {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (isHttpUrl(trimmed)) return trimmed
  return trimmed.toLowerCase()
}
const sourceTokens = sourcesRaw
  .split(/[\s,]+/)
  .map(normalizeSourceToken)
  .filter(Boolean)
const allowedSources = new Set([
  'qq',
  'kugou',
  'kuwo',
  'bodian',
  'migu',
  'joox',
  'youtube',
  'youtubedl',
  'ytdlp',
  'bilibili',
  'bilivideo',
  'pyncmd'
])
const dedupedSources = Array.from(new Set(sourceTokens))
const sources = dedupedSources.filter((item) => allowedSources.has(item) || isHttpUrl(item))
if (sources.length === 0) {
  sources.push('kugou', 'kuwo', 'bilibili')
}

const isWin = process.platform === 'win32'
const command = isWin ? (process.env.ComSpec || 'cmd.exe') : 'npx'
const args = isWin
  ? ['/d', '/s', '/c', 'npx', '@unblockneteasemusic/server', '-p', String(port), '-o', ...sources]
  : ['@unblockneteasemusic/server', '-p', String(port), '-o', ...sources]

const child = spawn(command, args, { cwd, stdio: 'inherit', env: mergedEnv })

child.on('exit', (code) => {
  process.exit(code == null ? 1 : code)
})
