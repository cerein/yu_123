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

const EMERGENCY_PLAYBACK_URLS = demoSongs.map((song) => song.playMusicUrl).filter(Boolean)

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
const PUBLIC_API_BASES: string[] = [
  'https://netease-cloud-music-api-beta-lyart.vercel.app'
]
export const API_PRESET_BASES: string[] = ['/unm-api', ...PUBLIC_API_BASES]
const PARSER_APIS = [
  (id: string) => `${METING_BASE}?server=netease&type=url&id=${id}&br=999`,
  (id: string) => `${METING_BASE}?server=netease&type=url&id=${id}&br=320`,
  (id: string) => `https://music.163.com/song/media/outer/url?id=${id}.mp3`
]

const canUseLocalUnm = () => {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

const defaultApiBase = () => PUBLIC_API_BASES[0] || '/unm-api'

const shouldUseLocalUnm = () => canUseLocalUnm() && getApiBase() === '/unm-api'

const API_CANDIDATES = () => {
  const saved = getApiBase()
  const local = canUseLocalUnm() && saved === '/unm-api' ? ['/unm-api'] : []
  return Array.from(new Set([saved, ...local, ...PUBLIC_API_BASES].filter(Boolean)))
}

const REQUEST_TIMEOUT = 5000
const URL_FETCH_LEVELS = ['exhigh', 'standard'] as const
const URL_CACHE_TTL = 10 * 60 * 1000
const MAX_PLAYABLE_CANDIDATES = 6
const musicUrlCache = new Map<string, { url: string; expiresAt: number }>()

const buildUrl = (base: string, path: string, query: Record<string, string | number>) => {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => params.set(key, String(value)))
  params.set('timestamp', String(Date.now()))
  return `${prefix}${path}?${params.toString()}`
}

export const getApiBase = () => localStorage.getItem(API_BASE_KEY)?.trim() || defaultApiBase()

export const setApiBase = (base: string) => {
  const normalized = base.trim()
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

const isUnmBase = (base: string) => base === '/unm-api'

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

const normalizeMediaUrl = (url?: string | null) => {
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

const pickBestUrl = (items?: UrlPayloadItem[]) => {
  if (!Array.isArray(items) || items.length === 0) return ''
  const normalized = items.filter((item) => typeof item?.url === 'string' && item.url) as Array<
    UrlPayloadItem & { url: string }
  >
  if (normalized.length === 0) return ''
  const nonTrial = normalized.filter((item) => !item.freeTrialInfo)
  if (nonTrial.length === 0) return ''
  const sorted = [...nonTrial].sort((a, b) => {
    const bySize = (b.size || 0) - (a.size || 0)
    if (bySize !== 0) return bySize
    const byBitrate = (b.br || 0) - (a.br || 0)
    if (byBitrate !== 0) return byBitrate
    return (b.time || 0) - (a.time || 0)
  })
  return normalizeMediaUrl(sorted[0].url)
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

export const getMusicUrl = async (id: number | string): Promise<string> => {
  const cacheKey = String(id)
  const cached = musicUrlCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() && cached.url) {
    return cached.url
  }

  if (shouldUseLocalUnm()) {
    for (const level of URL_FETCH_LEVELS) {
      try {
        const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
          buildUrl('/unm-api', '/api/song/enhance/player/url/v1', {
            ids: JSON.stringify([String(id)]),
            level,
            encodeType: 'flac'
          })
        )
        const url = pickBestUrl(raw?.data)
        if (url) {
          musicUrlCache.set(cacheKey, { url, expiresAt: Date.now() + URL_CACHE_TTL })
          return url
        }
      } catch {}
    }

    try {
      const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
        buildUrl('/unm-api', '/api/song/enhance/player/url', {
          ids: JSON.stringify([String(id)]),
          br: 999000
        })
      )
      const url = pickBestUrl(raw?.data)
      if (url) {
        musicUrlCache.set(cacheKey, { url, expiresAt: Date.now() + URL_CACHE_TTL })
        return url
      }
    } catch {}
  }

  for (const base of API_CANDIDATES()) {
    for (const level of URL_FETCH_LEVELS) {
      try {
        const v1Path = isUnmBase(base) ? '/api/song/enhance/player/url/v1' : '/song/url/v1'
        const v1Query: Record<string, string | number> = {
          id: String(id),
          level,
          encodeType: 'flac'
        }
        if (isUnmBase(base)) {
          v1Query.ids = `["${String(id)}"]`
        }
        const rawV1 = await requestJson<{ data?: UrlPayloadItem[] }>(buildUrl(base, v1Path, v1Query))
        const urlV1 = pickBestUrl(rawV1?.data)
        if (urlV1) {
          musicUrlCache.set(cacheKey, { url: urlV1, expiresAt: Date.now() + URL_CACHE_TTL })
          return urlV1
        }
      } catch {}
    }

    for (const level of URL_FETCH_LEVELS) {
      try {
        const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
          buildUrl(base, '/song/url', { id: String(id), br: 320000, level })
        )
        const url = pickBestUrl(raw?.data)
        if (url) {
          musicUrlCache.set(cacheKey, { url, expiresAt: Date.now() + URL_CACHE_TTL })
          return url
        }
      } catch {}
    }

    try {
      const raw = await requestJson<{ data?: UrlPayloadItem[] }>(
        buildUrl(base, '/weapi/song/enhance/player/url/v1', { id: String(id), level: 'standard', br: 320000 })
      )
      const url = pickBestUrl(raw?.data)
      if (url) {
        musicUrlCache.set(cacheKey, { url, expiresAt: Date.now() + URL_CACHE_TTL })
        return url
      }
    } catch {
      continue
    }
  }

  for (const parser of PARSER_APIS) {
    try {
      const parserUrl = parser(String(id))
      if (!parserUrl) continue
      if (parserUrl.includes('meting')) {
        return normalizeMediaUrl(parserUrl)
      } else if (/^https?:\/\//i.test(parserUrl)) {
        return normalizeMediaUrl(parserUrl)
      }
    } catch {
      continue
    }
  }

  const target = demoSongs.find((item) => item.id === id)
  return target?.playMusicUrl ?? ''
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

export const resolvePlayableUrls = async (song: SongResult): Promise<string[]> => {
  const candidates: string[] = []
  const pushCandidate = (url?: string) => {
    if (candidates.length >= MAX_PLAYABLE_CANDIDATES) return
    const normalized = normalizeMediaUrl(url)
    if (!normalized) return
    if (!candidates.includes(normalized)) {
      candidates.push(normalized)
    }
  }

  pushCandidate(song.playMusicUrl)
  const keyword = `${song.name} ${song.ar?.[0]?.name || ''}`.trim()

  try {
    const freshUrl = await withTimeout(getMusicUrl(song.id), 2200)
    pushCandidate(freshUrl)
  } catch {}

  try {
    const fallbackSongs = await withTimeout(searchFromMeting(keyword), 2500)
    const exact = fallbackSongs.find((item) => item.name.toLowerCase() === song.name.toLowerCase())
    pushCandidate(exact?.playMusicUrl)
    fallbackSongs.slice(0, 2).forEach((item) => pushCandidate(item.playMusicUrl))
  } catch {}

  if (candidates.length >= 3) {
    return candidates
  }

  try {
    const backupTasks = ['tencent', 'kuwo', 'kugou', 'migu'].map((server) =>
      withTimeout(searchFromMeting(keyword, server as MetingServer), 2200)
    )
    const settled = await Promise.allSettled(backupTasks)
    for (const item of settled) {
      if (item.status !== 'fulfilled') continue
      const fallbackSongs = item.value
      const exact = fallbackSongs.find((item) => item.name.toLowerCase() === song.name.toLowerCase())
      pushCandidate(exact?.playMusicUrl)
      fallbackSongs.slice(0, 1).forEach((item) => pushCandidate(item.playMusicUrl))
      if (candidates.length >= MAX_PLAYABLE_CANDIDATES) {
        break
      }
    }
  } catch {}

  for (const url of EMERGENCY_PLAYBACK_URLS) {
    pushCandidate(url)
    if (candidates.length >= MAX_PLAYABLE_CANDIDATES) {
      break
    }
  }

  return candidates
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
