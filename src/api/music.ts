import type { ILyric, SongResult } from '../types/music'

const demoSongs: SongResult[] = [
  {
    id: 'demo-1',
    name: '星河入梦',
    picUrl: 'https://picsum.photos/seed/music1/200/200',
    ar: [{ id: 'a1', name: 'Aurora' }],
    al: { id: 'al1', name: 'Night Walk', picUrl: 'https://picsum.photos/seed/music1/200/200' },
    playMusicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    dt: 312000
  },
  {
    id: 'demo-2',
    name: '海风与云',
    picUrl: 'https://picsum.photos/seed/music2/200/200',
    ar: [{ id: 'a2', name: 'Luna Bay' }],
    al: { id: 'al2', name: 'Coastline', picUrl: 'https://picsum.photos/seed/music2/200/200' },
    playMusicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    dt: 278000
  },
  {
    id: 'demo-3',
    name: '春日回响',
    picUrl: 'https://picsum.photos/seed/music3/200/200',
    ar: [{ id: 'a3', name: 'Mori' }],
    al: { id: 'al3', name: 'Spring Tape', picUrl: 'https://picsum.photos/seed/music3/200/200' },
    playMusicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    dt: 249000
  },
  {
    id: 'demo-4',
    name: '夏末晚霞',
    picUrl: 'https://picsum.photos/seed/music4/200/200',
    ar: [{ id: 'a4', name: 'Nami' }],
    al: { id: 'al4', name: 'Skyline', picUrl: 'https://picsum.photos/seed/music4/200/200' },
    playMusicUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    dt: 291000
  }
]

const FIXED_NETEASE_AUDIO_PREFIX = 'https://m701.music.126.net/'
const EMERGENCY_PLAYBACK_URLS: string[] = []

const lyricMap: Record<string, ILyric> = {
  'demo-1': {
    lrcTimeArray: [0, 12000, 24000, 36000, 48000],
    lrcArray: [
      { text: '夜色把街灯轻轻点亮', trText: 'The night turns on the street lights', startTime: 0, duration: 12000 },
      { text: '风吹过你的发梢', trText: 'The wind brushes your hair', startTime: 12000, duration: 12000 },
      { text: '我们在城市尽头停靠', trText: 'We stop at the edge of the city', startTime: 24000, duration: 12000 },
      { text: '把心事交给星光', trText: 'Leave our thoughts to the stars', startTime: 36000, duration: 12000 },
      { text: '此刻就是永恒', trText: 'This moment lasts forever', startTime: 48000, duration: 12000 }
    ]
  },
  'demo-2': {
    lrcTimeArray: [0, 10000, 22000, 34000, 46000],
    lrcArray: [
      { text: '海风把昨日吹远', trText: 'Sea breeze blows yesterday away', startTime: 0, duration: 10000 },
      { text: '浪花在脚边写信', trText: 'Waves write letters by our feet', startTime: 10000, duration: 12000 },
      { text: '你说未来像天空一样', trText: 'You said the future is like the sky', startTime: 22000, duration: 12000 },
      { text: '宽阔又安静', trText: 'Wide and peaceful', startTime: 34000, duration: 12000 },
      { text: '我们笑着前行', trText: 'We move forward smiling', startTime: 46000, duration: 12000 }
    ]
  }
}

const API_BASE_KEY = 'music_api_base'
const METING_BASE = 'https://api.injahow.cn/meting/'
const REMOTE_UNM_BASE = ((import.meta as { env?: { VITE_REMOTE_UNM_BASE?: string } }).env?.VITE_REMOTE_UNM_BASE || '').trim()
const STREAM_PROXY_BASE = ((import.meta as { env?: { VITE_STREAM_PROXY_BASE?: string } }).env?.VITE_STREAM_PROXY_BASE || '').trim()
const PUBLIC_API_BASES: string[] = [
  'https://ncm.zhenxin.me',
  'https://zm.wwoyun.cn',
  'https://zm.i9mr.com',
  'https://netease-cloud-music-api-beta-lyart.vercel.app'
]
export const API_PRESET_BASES: string[] = Array.from(
  new Set(['/unm-api', REMOTE_UNM_BASE, ...PUBLIC_API_BASES].map((item) => item.trim()).filter(Boolean))
)
const canUseLocalUnm = () => {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

const parseUnmBaseFromAnyUrl = (raw: string) => {
  const value = raw.trim()
  if (!value) return ''
  if (value.startsWith('/unm-api')) return '/unm-api'
  const match = value.match(/^https?:\/\/[^/]+\/unm-api(?:\/api\/.*)?$/i)
  if (!match) return ''
  try {
    const parsed = new URL(value)
    return `${parsed.origin}/unm-api`
  } catch {
    return ''
  }
}

const normalizeApiBase = (base: string) => {
  const trimmed = base.trim()
  if (!trimmed) return ''
  const unmBase = parseUnmBaseFromAnyUrl(trimmed)
  if (unmBase) return unmBase
  return trimmed.replace(/\/+$/, '')
}

const isLoopbackBase = (base: string) => {
  const normalized = normalizeApiBase(base)
  if (!normalized) return false
  if (normalized.startsWith('/unm-api')) return true
  try {
    const parsed = new URL(normalized)
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1'
  } catch {
    return false
  }
}

const defaultApiBase = () => PUBLIC_API_BASES[0] || METING_BASE

const shouldUseLocalUnm = () => canUseLocalUnm()

const API_CANDIDATES = () => {
  const savedRaw = normalizeApiBase(localStorage.getItem(API_BASE_KEY)?.trim() || '')
  const saved = !canUseLocalUnm() && isLoopbackBase(savedRaw) ? '' : savedRaw
  const local = canUseLocalUnm() ? ['/unm-api'] : []
  return Array.from(new Set([...local, saved, ...PUBLIC_API_BASES].filter(Boolean)))
}

const REQUEST_TIMEOUT = 5000
const URL_FETCH_LEVELS = ['exhigh', 'standard'] as const
const URL_CACHE_TTL = 10 * 60 * 1000
const RESOLVE_CACHE_TTL = 5 * 60 * 1000
const MAX_PLAYABLE_CANDIDATES = 6
const STRATEGY_FAILED_CACHE_TTL = 60 * 1000
const STRATEGY_RETRY_COUNT = 2
const CUSTOM_API_PLUGIN_KEYS = ['custom_api_plugin', 'customApiPlugin']
const musicUrlCache = new Map<string, { url: string; expiresAt: number }>()
const resolveUrlCache = new Map<string, { urls: string[]; expiresAt: number }>()
const sourceHealthMap = new Map<string, { score: number; updatedAt: number }>()
const strategyFailedCacheMap = new Map<string, number>()

const buildUrl = (base: string, path: string, query: Record<string, string | number>) => {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => params.set(key, String(value)))
  params.set('timestamp', String(Date.now()))
  return `${prefix}${path}?${params.toString()}`
}

export const getApiBase = () => {
  const savedRaw = normalizeApiBase(localStorage.getItem(API_BASE_KEY)?.trim() || '')
  const saved = !canUseLocalUnm() && isLoopbackBase(savedRaw) ? '' : savedRaw
  if (saved) return saved
  if (canUseLocalUnm()) return '/unm-api'
  return defaultApiBase()
}

export const setApiBase = (base: string) => {
  const normalized = normalizeApiBase(base)
  if (!normalized) {
    localStorage.removeItem(API_BASE_KEY)
    return
  }
  localStorage.setItem(API_BASE_KEY, normalized)
}

const requestJson = async <T>(url: string): Promise<T> => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`)
    }
    return await response.json()
  } finally {
    clearTimeout(timer)
  }
}

const requestText = async (url: string) => {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const response = await fetch(url, { signal: controller.signal })
    if (!response.ok) {
      throw new Error(`request failed: ${response.status}`)
    }
    return await response.text()
  } finally {
    clearTimeout(timer)
  }
}

const requestTextWithFallback = async (url: string) => {
  try {
    return await requestText(url)
  } catch {
    try {
      return await requestText(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
    } catch {
      return await requestText(`https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`)
    }
  }
}

const requestJsonWithFallback = async <T>(url: string): Promise<T> => {
  try {
    return await requestJson<T>(url)
  } catch {
    const raw = await requestTextWithFallback(url)
    return JSON.parse(raw) as T
  }
}

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number) =>
  new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), timeoutMs)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        clearTimeout(timer)
        reject(error)
      }
    )
  })

const isUnmBase = (base: string) => normalizeApiBase(base).endsWith('/unm-api')

const getPreferredUnmBase = () => {
  const savedRaw = normalizeApiBase(localStorage.getItem(API_BASE_KEY)?.trim() || '')
  const saved = !canUseLocalUnm() && isLoopbackBase(savedRaw) ? '' : savedRaw
  if (isUnmBase(saved)) return saved
  if (canUseLocalUnm()) return '/unm-api'
  return ''
}

const canUseInCurrentPage = (url: string) => {
  if (typeof window === 'undefined') return true
  if (window.location.protocol !== 'https:') return true
  if (!url.startsWith('http://')) return true
  return Boolean(STREAM_PROXY_BASE)
}

const applyStreamProxyIfNeeded = (url: string) => {
  if (!url.startsWith('http://')) return url
  if (typeof window === 'undefined') return url
  if (window.location.protocol !== 'https:') return url
  if (!STREAM_PROXY_BASE) return ''
  const base = STREAM_PROXY_BASE.replace(/\/+$/, '')
  return `${base}/stream?url=${encodeURIComponent(url)}`
}

type RawSong = {
  id: number | string
  name: string
  picUrl?: string
  dt?: number
  duration?: number
  ar?: Array<{ id: number | string; name: string }>
  artists?: Array<{ id: number | string; name: string }>
  al?: { id: number | string; name: string; picUrl?: string }
  album?: { id: number | string; name: string; picUrl?: string }
}

const fallbackCover = (seed: string | number) => `https://picsum.photos/seed/music-${encodeURIComponent(String(seed))}/200/200`

const normalizeCoverUrl = (url?: string) => {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }
  if (trimmed.startsWith('http://')) {
    return `https://${trimmed.slice(7)}`
  }
  return trimmed
}

const decodeBase64Text = (raw: string) => {
  const normalized = raw.replace(/-/g, '+').replace(/_/g, '/')
  const padLength = normalized.length % 4 === 0 ? 0 : 4 - (normalized.length % 4)
  const padded = `${normalized}${'='.repeat(padLength)}`
  if (typeof atob === 'function') return atob(padded)
  const NodeBuffer = (globalThis as { Buffer?: { from: (value: string, encoding: string) => { toString: (encoding: string) => string } } }).Buffer
  if (NodeBuffer) return NodeBuffer.from(padded, 'base64').toString('utf8')
  return ''
}

const decodeMusicPackageUrl = (url: URL) => {
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length < 2 || parts[0] !== 'package') return ''
  const token = parts[1]
  if (!token) return ''
  try {
    const decoded = decodeBase64Text(token).trim()
    if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
      return decoded
    }
  } catch {}
  return ''
}

const normalizeMediaUrl = (url?: string | null): string => {
  if (!url) return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('/unm-api')) {
    return trimmed
  }
  if (trimmed.startsWith('//')) {
    return normalizeMediaUrl(`https:${trimmed}`)
  }
  if (trimmed.startsWith('http://')) {
    return normalizeMediaUrl(`https://${trimmed.slice(7)}`)
  }
  if (trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed)
      if (parsed.hostname === 'music.163.com' && parsed.pathname.startsWith('/package/')) {
        const decoded = decodeMusicPackageUrl(parsed)
        const decodedNormalized = normalizeMediaUrl(decoded)
        if (decodedNormalized) return decodedNormalized
        const unmBase = getPreferredUnmBase()
        if (unmBase) return `${unmBase}${parsed.pathname}${parsed.search}`
      }
      if (parsed.hostname.endsWith('.music.126.net')) {
        const tail = `${parsed.pathname.replace(/^\/+/, '')}${parsed.search}`
        if (tail) return `${FIXED_NETEASE_AUDIO_PREFIX}${tail}`
      }
    } catch {}
    return trimmed
  }
  const tail = trimmed.replace(/^\/+/, '')
  if (tail.includes('/')) {
    return `${FIXED_NETEASE_AUDIO_PREFIX}${tail}`
  }
  return ''
}

const getSourceKey = (url: string) => {
  try {
    return new URL(url).hostname
  } catch {
    return 'unknown'
  }
}

const getSourceScore = (url: string) => sourceHealthMap.get(getSourceKey(url))?.score ?? 0

const rankCandidates = (urls: string[]) => [...urls].sort((a, b) => getSourceScore(b) - getSourceScore(a))

export const reportPlaybackResult = (url: string, success: boolean) => {
  const normalized = normalizeMediaUrl(url)
  if (!normalized) return
  const key = getSourceKey(normalized)
  const prev = sourceHealthMap.get(key) ?? { score: 0, updatedAt: 0 }
  const nextScore = success ? Math.min(prev.score + 1, 8) : Math.max(prev.score - 2, -8)
  sourceHealthMap.set(key, { score: nextScore, updatedAt: Date.now() })
}

export const invalidateSongSourceCache = (song: Pick<SongResult, 'id' | 'name' | 'ar'>) => {
  musicUrlCache.delete(String(song.id))
  const resolveCacheKey = `${String(song.id)}::${song.name}::${song.ar?.[0]?.name || ''}`.toLowerCase()
  resolveUrlCache.delete(resolveCacheKey)
  clearSongStrategyFailedCache(song.id)
}

const mapSongs = (items: RawSong[]): SongResult[] =>
  items.map((song) => {
    const cover =
      normalizeCoverUrl(song.al?.picUrl) ||
      normalizeCoverUrl(song.album?.picUrl) ||
      normalizeCoverUrl(song.picUrl) ||
      fallbackCover(song.id)

    return {
      id: song.id,
      name: song.name,
      picUrl: cover,
      ar: Array.isArray(song.ar)
        ? song.ar.map((artist) => ({ id: artist.id, name: artist.name }))
        : Array.isArray(song.artists)
          ? song.artists.map((artist) => ({ id: artist.id, name: artist.name }))
          : [{ id: 'unknown', name: '未知歌手' }],
      al: {
        id: song.al?.id || song.album?.id || song.id,
        name: song.al?.name || song.album?.name || '未知专辑',
        picUrl: cover
      },
      dt: song.dt || song.duration
    }
  })

const parseLrc = (raw: string) => {
  const lines = raw.split('\n').map((item) => item.trim()).filter(Boolean)
  const parsed = lines
    .map((line) => {
      const matched = line.match(/\[(\d{2}):(\d{2})(?:\.(\d{1,3}))?\](.*)/)
      if (!matched) return null
      const minute = Number(matched[1])
      const second = Number(matched[2])
      const milli = Number((matched[3] || '0').padEnd(3, '0'))
      const time = minute * 60000 + second * 1000 + milli
      return { time, text: matched[4].trim() }
    })
    .filter((item): item is { time: number; text: string } => Boolean(item))
    .sort((a, b) => a.time - b.time)

  const lrcTimeArray = parsed.map((item) => item.time)
  const lrcArray = parsed.map((item, index) => {
    const next = parsed[index + 1]
    return {
      text: item.text || '...',
      trText: '',
      startTime: item.time,
      duration: next ? Math.max(next.time - item.time, 1000) : 5000
    }
  })

  return { lrcTimeArray, lrcArray }
}

type UrlPayloadItem = {
  url?: string | null
  freeTrialInfo?: unknown
  time?: number
  size?: number
  br?: number
}

type UrlCandidate = {
  url: string
  previewLikely: boolean
}

const isLikelyPreviewPayload = (item: UrlPayloadItem, expectedDurationMs = 0) => {
  if (item.freeTrialInfo) return true
  const time = typeof item.time === 'number' ? item.time : 0
  if (expectedDurationMs > 120000 && time > 0) {
    if (time < Math.min(60000, expectedDurationMs * 0.55)) {
      return true
    }
  }
  return false
}

const pickBestUrlCandidate = (items?: UrlPayloadItem[], expectedDurationMs = 0): UrlCandidate | null => {
  if (!Array.isArray(items) || items.length === 0) return null
  const withUrl = items.filter((item) => typeof item?.url === 'string' && item.url) as Array<
    UrlPayloadItem & { url: string }
  >
  if (withUrl.length === 0) return null
  const normalized: Array<UrlPayloadItem & { url: string; normalizedUrl: string; previewLikely: boolean }> = withUrl
    .map((item) => ({
      ...item,
      normalizedUrl: normalizeMediaUrl(item.url),
      previewLikely: isLikelyPreviewPayload(item, expectedDurationMs)
    }))
    .filter((item) => Boolean(item.normalizedUrl))
  if (normalized.length === 0) return null
  const sorted = [...normalized].sort((a, b) => {
    if (a.previewLikely !== b.previewLikely) return Number(a.previewLikely) - Number(b.previewLikely)
    const bySize = (b.size || 0) - (a.size || 0)
    if (bySize !== 0) return bySize
    const byBitrate = (b.br || 0) - (a.br || 0)
    if (byBitrate !== 0) return byBitrate
    return (b.time || 0) - (a.time || 0)
  })
  return { url: sorted[0].normalizedUrl, previewLikely: sorted[0].previewLikely }
}

type CustomApiPlugin = {
  name: string
  apiUrl: string
  method?: 'GET' | 'POST'
  params: Record<string, string>
  qualityMapping?: Record<string, string>
  responseUrlPath: string
}

const getStrategyFailedCacheKey = (songId: string | number, strategyName: string) => `${String(songId)}::${strategyName}`

const isInStrategyFailedCache = (songId: string | number, strategyName: string) => {
  const key = getStrategyFailedCacheKey(songId, strategyName)
  const failedAt = strategyFailedCacheMap.get(key)
  if (!failedAt) return false
  if (Date.now() - failedAt < STRATEGY_FAILED_CACHE_TTL) return true
  strategyFailedCacheMap.delete(key)
  return false
}

const markStrategyFailed = (songId: string | number, strategyName: string) => {
  strategyFailedCacheMap.set(getStrategyFailedCacheKey(songId, strategyName), Date.now())
}

const clearSongStrategyFailedCache = (songId: string | number) => {
  const prefix = `${String(songId)}::`
  for (const key of strategyFailedCacheMap.keys()) {
    if (key.startsWith(prefix)) {
      strategyFailedCacheMap.delete(key)
    }
  }
}

const waitFor = (delayMs: number) => new Promise<void>((resolve) => window.setTimeout(resolve, delayMs))

const getObjectValueByPath = (target: unknown, path: string) => {
  if (!path.trim()) return undefined
  const keys = path
    .replace(/\[(\d+)\]/g, '.$1')
    .split('.')
    .map((item) => item.trim())
    .filter(Boolean)
  let current: unknown = target
  for (const key of keys) {
    if (!current || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[key]
  }
  return current
}

const parseCustomApiPlugin = (): CustomApiPlugin | null => {
  for (const key of CUSTOM_API_PLUGIN_KEYS) {
    const raw = localStorage.getItem(key)?.trim()
    if (!raw) continue
    try {
      const parsed = JSON.parse(raw) as CustomApiPlugin
      if (
        parsed &&
        typeof parsed.apiUrl === 'string' &&
        parsed.apiUrl.trim() &&
        parsed.params &&
        typeof parsed.params === 'object' &&
        typeof parsed.responseUrlPath === 'string' &&
        parsed.responseUrlPath.trim()
      ) {
        return parsed
      }
    } catch {}
  }
  return null
}

const buildCustomApiParams = (plugin: CustomApiPlugin, songId: string | number, quality: string) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(plugin.params || {})) {
    if (value === '{songId}') {
      params.set(key, String(songId))
      continue
    }
    if (value === '{quality}') {
      params.set(key, plugin.qualityMapping?.[quality] || quality)
      continue
    }
    params.set(key, value)
  }
  return params
}

const resolveUrlFromCustomApi = async (songId: string | number, quality = 'higher') => {
  if (isInStrategyFailedCache(songId, 'custom')) return ''
  const plugin = parseCustomApiPlugin()
  if (!plugin) return ''
  let retryDelay = 240
  for (let i = 0; i <= STRATEGY_RETRY_COUNT; i += 1) {
    try {
      const params = buildCustomApiParams(plugin, songId, quality)
      const method = (plugin.method || 'GET').toUpperCase() === 'POST' ? 'POST' : 'GET'
      const controller = new AbortController()
      const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT * 2)
      let response: Response
      try {
        if (method === 'POST') {
          response = await fetch(plugin.apiUrl, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(Object.fromEntries(params.entries())),
            signal: controller.signal
          })
        } else {
          const connector = plugin.apiUrl.includes('?') ? '&' : '?'
          response = await fetch(`${plugin.apiUrl}${connector}${params.toString()}`, {
            method: 'GET',
            signal: controller.signal
          })
        }
      } finally {
        clearTimeout(timer)
      }
      if (!response.ok) {
        throw new Error(`custom api failed: ${response.status}`)
      }
      const text = await response.text()
      let payload: unknown
      try {
        payload = JSON.parse(text)
      } catch {
        payload = {}
      }
      const rawUrl = getObjectValueByPath(payload, plugin.responseUrlPath)
      const normalized = normalizeMediaUrl(typeof rawUrl === 'string' ? rawUrl : '')
      if (normalized) {
        return normalized
      }
    } catch {}
    if (i < STRATEGY_RETRY_COUNT) {
      await waitFor(retryDelay)
      retryDelay *= 2
    }
  }
  markStrategyFailed(songId, 'custom')
  return ''
}

type MetingServer = 'netease' | 'tencent' | 'kuwo' | 'kugou' | 'migu'

interface MetingSong {
  id?: number | string
  name?: string
  artist?: string
  album?: string
  pic?: string
  lrc?: string
  url?: string
  time?: number
}

interface ItunesSong {
  trackId?: number
  trackName?: string
  artistName?: string
  collectionName?: string
  artworkUrl100?: string
  previewUrl?: string
  trackTimeMillis?: number
}

const METING_FALLBACK_SERVERS: MetingServer[] = ['kuwo', 'kugou', 'migu', 'tencent', 'netease']

const pickMetingCandidate = (songs: SongResult[], song: SongResult) => {
  const targetName = (song.name || '').toLowerCase()
  const targetArtist = (song.ar?.[0]?.name || '').toLowerCase()
  const targetDuration = song.dt || 0
  const withUrl = songs.filter((item) => Boolean(item.playMusicUrl))
  if (withUrl.length === 0) return ''
  const scored = withUrl
    .map((item) => {
      const name = (item.name || '').toLowerCase()
      const artist = (item.ar?.[0]?.name || '').toLowerCase()
      const duration = item.dt || 0
      const nameHit = targetName && name ? (name.includes(targetName) || targetName.includes(name) ? 1 : 0) : 0
      const artistHit =
        targetArtist && artist ? (artist.includes(targetArtist) || targetArtist.includes(artist) ? 1 : 0) : 0
      const durationGap = targetDuration > 0 && duration > 0 ? Math.abs(targetDuration - duration) : 999999
      return { item, score: nameHit * 4 + artistHit * 3 - Math.min(durationGap / 1000, 120) / 120 }
    })
    .sort((a, b) => b.score - a.score)
  return normalizeMediaUrl(scored[0]?.item.playMusicUrl) || ''
}

const resolveUrlFromMetingFallback = async (song: SongResult) => {
  const keyword = `${song.name || ''} ${song.ar?.[0]?.name || ''}`.trim()
  if (!keyword) return ''
  for (const server of METING_FALLBACK_SERVERS) {
    try {
      const list = await searchFromMeting(keyword, server)
      const matched = pickMetingCandidate(list, song)
      if (matched) return matched
    } catch {}
  }
  return ''
}

const searchFromMeting = async (keyword: string, server: MetingServer = 'netease') => {
  if (!keyword.trim()) return []
  const term = encodeURIComponent(keyword.trim())
  const raw = await requestJsonWithFallback<MetingSong[]>(
    `${METING_BASE}?server=${server}&type=search&s=${term}`
  )
  const list = Array.isArray(raw) ? raw : []
  return list
    .filter((item) => item.id && item.name)
    .map((item) => {
      const artist = item.artist?.trim() || '未知歌手'
      const album = item.album?.trim() || '未知专辑'
      const id = String(item.id)
      const cover = normalizeCoverUrl(item.pic) || fallbackCover(id)
      return {
        id,
        name: item.name || '未知歌曲',
        picUrl: cover,
        ar: [{ id: `artist-${id}`, name: artist }],
        al: {
          id: `album-${id}`,
          name: album,
          picUrl: cover
        },
        playMusicUrl: normalizeMediaUrl(item.url) || undefined,
        dt: item.time
      } satisfies SongResult
    })
}

const searchFromItunes = async (keyword: string) => {
  const term = encodeURIComponent(keyword.trim() || 'jay chou')
  const raw = await requestJsonWithFallback<{ results?: ItunesSong[] }>(
    `https://itunes.apple.com/search?term=${term}&entity=song&limit=25`
  )
  const list = Array.isArray(raw?.results) ? raw.results : []
  return list
    .filter((item) => item.trackId && item.trackName)
    .map((item) => {
      const id = String(item.trackId)
      const cover = normalizeCoverUrl(item.artworkUrl100) || fallbackCover(id)
      return {
        id: `itunes-${id}`,
        name: item.trackName || '未知歌曲',
        picUrl: cover,
        ar: [{ id: `itunes-artist-${id}`, name: item.artistName || '未知歌手' }],
        al: {
          id: `itunes-album-${id}`,
          name: item.collectionName || '未知专辑',
          picUrl: cover
        },
        playMusicUrl: normalizeMediaUrl(item.previewUrl) || undefined,
        dt: item.trackTimeMillis
      } satisfies SongResult
    })
}

export const searchMusic = async (keyword: string): Promise<SongResult[]> => {
  const normalized = keyword.trim().toLowerCase()

  for (const base of API_CANDIDATES()) {
    try {
      if (isUnmBase(base)) {
        const searchRaw = await requestJson<{ result?: { songs?: RawSong[] } }>(
          buildUrl(base, '/api/search/get/web', {
            s: normalized || '周杰伦',
            type: 1,
            limit: 40,
            offset: 0,
            total: 1
          })
        )
        const songs = Array.isArray(searchRaw?.result?.songs) ? mapSongs(searchRaw.result.songs) : []
        if (songs.length > 0) return songs
        continue
      }

      if (!normalized) {
        const topRaw = await requestJson<{ data?: RawSong[] }>(
          buildUrl(base, '/top/song', { type: 0 })
        )
        const topSongs = Array.isArray(topRaw?.data) ? mapSongs(topRaw.data) : []
        if (topSongs.length > 0) return topSongs.slice(0, 40)
      }

      const searchRaw = await requestJson<{ result?: { songs?: RawSong[] } }>(
        buildUrl(base, '/cloudsearch', { keywords: normalized, type: 1, limit: 40, offset: 0 })
      )
      const songs = Array.isArray(searchRaw?.result?.songs) ? mapSongs(searchRaw.result.songs) : []
      if (songs.length > 0) return songs
    } catch {
      try {
        const searchRaw = await requestJson<{ result?: { songs?: RawSong[] } }>(
          buildUrl(base, '/search', { keywords: normalized || '周杰伦', limit: 30, offset: 0, type: 1 })
        )
        const songs = Array.isArray(searchRaw?.result?.songs) ? mapSongs(searchRaw.result.songs) : []
        if (songs.length > 0) return songs
      } catch {
        continue
      }
    }
  }

  try {
    const metingSongs = await searchFromMeting(normalized)
    if (metingSongs.length > 0) return metingSongs
  } catch {}

  try {
    const itunesSongs = await searchFromItunes(normalized)
    if (itunesSongs.length > 0) return itunesSongs
  } catch {}

  const fallbackKeyword = normalized || 'demo'
  return demoSongs.filter((song) => {
    const artist = song.ar.map((item) => item.name).join(' ').toLowerCase()
    const album = song.al.name.toLowerCase()
    const name = song.name.toLowerCase()
    return (
      artist.includes(fallbackKeyword) ||
      album.includes(fallbackKeyword) ||
      name.includes(fallbackKeyword) ||
      !normalized
    )
  })
}

export const getSongDuration = async (id: number | string): Promise<number | undefined> => {
  if (shouldUseLocalUnm()) {
    try {
      const detailRaw = await requestJson<{ songs?: Array<{ dt?: number }> }>(
        buildUrl('/unm-api', '/api/v3/song/detail', { c: JSON.stringify([{ id: String(id) }]) })
      )
      const dt = detailRaw?.songs?.[0]?.dt
      if (typeof dt === 'number' && dt > 0) {
        return dt
      }
    } catch {}
  }

  for (const base of API_CANDIDATES()) {
    try {
      const detailRaw = await requestJson<{ songs?: Array<{ dt?: number }> }>(
        buildUrl(base, '/song/detail', { ids: String(id) })
      )
      const dt = detailRaw?.songs?.[0]?.dt
      if (typeof dt === 'number' && dt > 0) {
        return dt
      }
    } catch {
      continue
    }
  }
  for (const base of API_CANDIDATES()) {
    try {
      const payload = await requestJson<{ data?: UrlPayloadItem[] }>(
        buildUrl(base, '/song/url/v1', { id: String(id), level: 'standard' })
      )
      const time = payload?.data?.[0]?.time
      if (typeof time === 'number' && time > 0) {
        return time
      }
    } catch {
      continue
    }
  }
  return undefined
}

export const getMusicUrl = async (id: number | string, expectedDurationMs = 0): Promise<string> => {
  const cacheKey = String(id)
  const cached = musicUrlCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() && cached.url) {
    return cached.url
  }
  let fallbackPreviewUrl = ''
  const buildUnmV1Queries = (level: string) =>
    [
      { ids: JSON.stringify([String(id)]), level, encodeType: 'flac' },
      { ids: `[${String(id)}]`, level, encodeType: 'flac' },
      { id: String(id), level, encodeType: 'flac' },
      { ids: JSON.stringify([String(id)]), level }
    ] as Array<Record<string, string | number>>

  try {
    const customUrl = await withTimeout(resolveUrlFromCustomApi(id), 1800)
    if (customUrl) {
      fallbackPreviewUrl = customUrl
    }
  } catch {}

  if (shouldUseLocalUnm()) {
    for (const level of URL_FETCH_LEVELS) {
      for (const query of buildUnmV1Queries(level)) {
        try {
          const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
            buildUrl('/unm-api', '/api/song/enhance/player/url/v1', query)
          )
          const candidate = pickBestUrlCandidate(raw?.data, expectedDurationMs)
          if (candidate?.url) {
            if (!candidate.previewLikely) {
              musicUrlCache.set(cacheKey, { url: candidate.url, expiresAt: Date.now() + URL_CACHE_TTL })
              return candidate.url
            }
            if (!fallbackPreviewUrl) fallbackPreviewUrl = candidate.url
            break
          }
        } catch {}
      }
    }

    try {
      const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
        buildUrl('/unm-api', '/api/song/enhance/player/url', {
          ids: JSON.stringify([String(id)]),
          br: 999000
        })
      )
      const candidate = pickBestUrlCandidate(raw?.data, expectedDurationMs)
      if (candidate?.url) {
        if (!candidate.previewLikely) {
          musicUrlCache.set(cacheKey, { url: candidate.url, expiresAt: Date.now() + URL_CACHE_TTL })
          return candidate.url
        }
        if (!fallbackPreviewUrl) fallbackPreviewUrl = candidate.url
      }
    } catch {}
  }

  for (const base of API_CANDIDATES()) {
    for (const level of URL_FETCH_LEVELS) {
      const queries = isUnmBase(base)
        ? buildUnmV1Queries(level)
        : ([{ id: String(id), level, encodeType: 'flac' }] as Array<Record<string, string | number>>)
      const path = isUnmBase(base) ? '/api/song/enhance/player/url/v1' : '/song/url/v1'
      for (const query of queries) {
        try {
          const rawV1 = await requestJson<{ data?: UrlPayloadItem[] }>(buildUrl(base, path, query))
          const candidate = pickBestUrlCandidate(rawV1?.data, expectedDurationMs)
          if (candidate?.url) {
            if (!candidate.previewLikely) {
              musicUrlCache.set(cacheKey, { url: candidate.url, expiresAt: Date.now() + URL_CACHE_TTL })
              return candidate.url
            }
            if (!fallbackPreviewUrl) fallbackPreviewUrl = candidate.url
            break
          }
        } catch {}
      }
    }

    for (const level of URL_FETCH_LEVELS) {
      try {
        const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
          buildUrl(base, '/song/url', { id: String(id), br: 320000, level })
        )
        const candidate = pickBestUrlCandidate(raw?.data, expectedDurationMs)
        if (candidate?.url) {
          if (!candidate.previewLikely) {
            musicUrlCache.set(cacheKey, { url: candidate.url, expiresAt: Date.now() + URL_CACHE_TTL })
            return candidate.url
          }
          if (!fallbackPreviewUrl) fallbackPreviewUrl = candidate.url
        }
      } catch {}
    }

    try {
      const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
        buildUrl(base, '/weapi/song/enhance/player/url/v1', { id: String(id), level: 'standard', br: 320000 })
      )
      const candidate = pickBestUrlCandidate(raw?.data, expectedDurationMs)
      if (candidate?.url) {
        if (!candidate.previewLikely) {
          musicUrlCache.set(cacheKey, { url: candidate.url, expiresAt: Date.now() + URL_CACHE_TTL })
          return candidate.url
        }
        if (!fallbackPreviewUrl) fallbackPreviewUrl = candidate.url
      }
    } catch {
      continue
    }
  }

  if (fallbackPreviewUrl) {
    musicUrlCache.set(cacheKey, { url: fallbackPreviewUrl, expiresAt: Date.now() + URL_CACHE_TTL })
    return fallbackPreviewUrl
  }
  return ''
}

export const getLyric = async (id: number | string): Promise<ILyric> => {
  if (shouldUseLocalUnm()) {
    try {
      const lyricRaw = await requestJson<{ lrc?: { lyric?: string } }>(
        buildUrl('/unm-api', '/api/song/lyric', { id: String(id), lv: -1, tv: -1 })
      )
      const lrcText = lyricRaw?.lrc?.lyric || ''
      if (lrcText) {
        const parsed = parseLrc(lrcText)
        if (parsed.lrcArray.length > 0) {
          return parsed
        }
      }
    } catch {}
  }

  for (const base of API_CANDIDATES()) {
    for (const path of ['/lyric/new', '/lyric', '/api/song/lyric', '/weapi/song/lyric']) {
      try {
        const lyricRaw = await requestJson<{ lrc?: { lyric?: string }; klyric?: { lyric?: string }; yrc?: { lyric?: string } }>(
          buildUrl(base, path, { id: String(id), lv: -1, tv: -1 })
        )
        const lrcText = lyricRaw?.lrc?.lyric || lyricRaw?.yrc?.lyric || lyricRaw?.klyric?.lyric || ''
        if (lrcText) {
          const parsed = parseLrc(lrcText)
          if (parsed.lrcArray.length > 0) {
            return parsed
          }
        }
      } catch {}
    }
  }

  try {
    const lrcText = (await requestTextWithFallback(`${METING_BASE}?server=netease&type=lrc&id=${String(id)}`)).trim()
    if (lrcText) {
      const actualLrc = /^https?:\/\//i.test(lrcText) ? (await requestTextWithFallback(lrcText)).trim() : lrcText
      const parsed = parseLrc(actualLrc)
      if (parsed.lrcArray.length > 0) {
        return parsed
      }
    }
  } catch {}

  const key = String(id)
  return (
    lyricMap[key] ?? {
      lrcTimeArray: [0],
      lrcArray: [{ text: '纯音乐，请静静聆听。', trText: 'Instrumental, enjoy the moment.', startTime: 0, duration: 5000 }]
    }
  )
}

export const resolvePlayableUrls = async (song: SongResult, forceRefresh = false): Promise<string[]> => {
  const resolveCacheKey = `${String(song.id)}::${song.name}::${song.ar?.[0]?.name || ''}`.toLowerCase()
  if (forceRefresh) {
    resolveUrlCache.delete(resolveCacheKey)
    musicUrlCache.delete(String(song.id))
  }
  const cached = resolveUrlCache.get(resolveCacheKey)
  if (!forceRefresh && cached && cached.expiresAt > Date.now() && cached.urls.length > 0) {
    const rankedCached = rankCandidates(cached.urls).slice(0, MAX_PLAYABLE_CANDIDATES)
    if (rankedCached.length > 0) return rankedCached
  }

  const candidates: string[] = []
  const pushCandidate = (url?: string) => {
    if (candidates.length >= MAX_PLAYABLE_CANDIDATES) return
    const normalized = normalizeMediaUrl(url)
    if (!normalized) return
    if (!canUseInCurrentPage(normalized)) return
    const candidate = applyStreamProxyIfNeeded(normalized)
    if (!candidate) return
    if (!candidates.includes(candidate)) {
      candidates.push(candidate)
    }
  }

  try {
    const customApiUrl = await withTimeout(resolveUrlFromCustomApi(song.id), 1800)
    pushCandidate(customApiUrl)
  } catch {}
  pushCandidate(song.playMusicUrl)
  try {
    const freshUrl = await withTimeout(getMusicUrl(song.id, song.dt || 0), 2200)
    pushCandidate(freshUrl)
  } catch {}

  if (candidates.length < 2) {
    try {
      const metingUrl = await withTimeout(resolveUrlFromMetingFallback(song), 1800)
      pushCandidate(metingUrl)
    } catch {}
  }

  for (const url of EMERGENCY_PLAYBACK_URLS) {
    pushCandidate(url)
    if (candidates.length >= MAX_PLAYABLE_CANDIDATES) {
      break
    }
  }

  const ranked = rankCandidates(candidates).slice(0, MAX_PLAYABLE_CANDIDATES)
  if (ranked.length > 0) {
    resolveUrlCache.set(resolveCacheKey, {
      urls: ranked,
      expiresAt: Date.now() + RESOLVE_CACHE_TTL
    })
  }
  return ranked
}

export const pingMusicApi = async (base: string) => {
  if (!base.trim()) return false
  try {
    const url = isUnmBase(base)
      ? buildUrl(base, '/api/search/get/web', { s: '周杰伦', type: 1, limit: 1, offset: 0, total: 1 })
      : buildUrl(base, '/cloudsearch', { keywords: '周杰伦', type: 1, limit: 1, offset: 0 })
    const result = await requestJson<{ code?: number; result?: { songs?: RawSong[] } }>(url)
    return Boolean(result?.result?.songs)
  } catch {
    return false
  }
}

export const probeApiPlayable = async (base: string) => {
  const normalizedBase = normalizeApiBase(base)
  if (!normalizedBase) return false
  try {
    const searchUrl = isUnmBase(normalizedBase)
      ? buildUrl(normalizedBase, '/api/search/get/web', { s: '周杰伦', type: 1, limit: 1, offset: 0, total: 1 })
      : buildUrl(normalizedBase, '/cloudsearch', { keywords: '周杰伦', type: 1, limit: 1, offset: 0 })
    const search = await requestJson<{ result?: { songs?: RawSong[] } }>(searchUrl)
    const song = search?.result?.songs?.[0]
    if (!song?.id) return false
    const raw = isUnmBase(normalizedBase)
      ? await requestJson<{ data?: UrlPayloadItem[] }>(
          buildUrl(normalizedBase, '/api/song/enhance/player/url', { ids: `[${String(song.id)}]`, br: 320000 })
        )
      : await requestJson<{ data?: UrlPayloadItem[] }>(
          buildUrl(normalizedBase, '/song/url', { id: String(song.id), br: 320000 })
        )
    const candidate = pickBestUrlCandidate(raw?.data, song.dt || 0)
    const normalized = normalizeMediaUrl(candidate?.url)
    return Boolean(normalized && canUseInCurrentPage(normalized))
  } catch {
    return false
  }
}

export const pingPublicBackup = async () => {
  try {
    const meting = await searchFromMeting('周杰伦')
    if (meting.length > 0) {
      return true
    }
    return false
  } catch {
    return false
  }
}
