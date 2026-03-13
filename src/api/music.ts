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
const ITUNES_TRACK_PREFIX = 'itunes-'
const thirdPartyTrackUrlMap = new Map<string, string>()
const DEFAULT_UNLOCK_BASES = ['http://127.0.0.1:3100', 'http://localhost:3100']
const PUBLIC_API_BASES = ['https://music-api.gdstudio.xyz']
const canUseLocalUnm = () => {
  if (typeof window === 'undefined') return false
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}
const API_CANDIDATES = () =>
  Array.from(
    new Set(
      [
        localStorage.getItem(API_BASE_KEY)?.trim(),
        ...PUBLIC_API_BASES,
        canUseLocalUnm() ? '/unm-api' : ''
      ].filter((item): item is string => Boolean(item))
    )
  )

const REQUEST_TIMEOUT = 7000

const buildUrl = (base: string, path: string, query: Record<string, string | number>) => {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => params.set(key, String(value)))
  params.set('timestamp', String(Date.now()))
  return `${prefix}${path}?${params.toString()}`
}

export const getApiBase = () => localStorage.getItem(API_BASE_KEY)?.trim() || PUBLIC_API_BASES[0]

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

const extractUrlFromPayload = (payload: any) => {
  if (!payload || typeof payload !== 'object') return ''
  const direct = payload.url
  if (typeof direct === 'string' && direct) return direct
  const dataUrl = payload?.data?.url
  if (typeof dataUrl === 'string' && dataUrl) return dataUrl
  const listUrl = payload?.data?.[0]?.url
  if (typeof listUrl === 'string' && listUrl) return listUrl
  const resultUrl = payload?.result?.url
  if (typeof resultUrl === 'string' && resultUrl) return resultUrl
  return ''
}

const isUnmBase = (base: string) => base === '/unm-api'

type RawSong = {
  id: number | string
  name: string
  dt?: number
  duration?: number
  ar?: Array<{ id: number | string; name: string }>
  artists?: Array<{ id: number | string; name: string }>
  al?: { id: number | string; name: string; picUrl?: string }
  album?: { id: number | string; name: string; picUrl?: string }
}

const mapSongs = (items: RawSong[]): SongResult[] =>
  items.map((song) => ({
    id: song.id,
    name: song.name,
    picUrl: song.al?.picUrl || song.album?.picUrl || 'https://picsum.photos/seed/musiccover/200/200',
    ar: Array.isArray(song.ar)
      ? song.ar.map((artist) => ({ id: artist.id, name: artist.name }))
      : Array.isArray(song.artists)
        ? song.artists.map((artist) => ({ id: artist.id, name: artist.name }))
        : [{ id: 'unknown', name: '未知歌手' }],
    al: {
      id: song.al?.id || song.album?.id || song.id,
      name: song.al?.name || song.album?.name || '未知专辑',
      picUrl: song.al?.picUrl || song.album?.picUrl || 'https://picsum.photos/seed/musiccover/200/200'
    },
    dt: song.dt || song.duration
  }))

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

interface ITunesSong {
  trackId: number
  trackName: string
  artistName: string
  collectionName?: string
  artworkUrl100?: string
  previewUrl?: string
  trackTimeMillis?: number
}

const searchFromITunes = async (keyword: string) => {
  if (!keyword.trim()) return []
  const term = encodeURIComponent(keyword.trim())
  const raw = await requestJson<{ resultCount: number; results: ITunesSong[] }>(
    `https://itunes.apple.com/search?term=${term}&entity=song&limit=30`
  )
  const list = Array.isArray(raw?.results) ? raw.results : []
  return list
    .filter((item) => item.previewUrl && item.trackId)
    .map((item) => {
      const id = `${ITUNES_TRACK_PREFIX}${item.trackId}`
      if (item.previewUrl) {
        thirdPartyTrackUrlMap.set(id, item.previewUrl)
      }
      return {
        id,
        name: item.trackName,
        picUrl: item.artworkUrl100 || 'https://picsum.photos/seed/itunesmusic/200/200',
        ar: [{ id: `artist-${item.trackId}`, name: item.artistName || '未知歌手' }],
        al: {
          id: `album-${item.trackId}`,
          name: item.collectionName || '未知专辑',
          picUrl: item.artworkUrl100 || 'https://picsum.photos/seed/itunesmusic/200/200'
        },
        playMusicUrl: item.previewUrl,
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
        if (songs.length > 0) {
          return songs
        }
        continue
      }

      if (!normalized) {
        const topRaw = await requestJson<{ data?: RawSong[] }>(
          buildUrl(base, '/top/song', { type: 0 })
        )
        const topSongs = Array.isArray(topRaw?.data) ? mapSongs(topRaw.data) : []
        if (topSongs.length > 0) {
          return topSongs.slice(0, 40)
        }
      }

      const searchRaw = await requestJson<{ result?: { songs?: RawSong[] } }>(
        buildUrl(base, '/cloudsearch', { keywords: normalized, type: 1, limit: 40, offset: 0 })
      )
      const songs = Array.isArray(searchRaw?.result?.songs) ? mapSongs(searchRaw.result.songs) : []
      if (songs.length > 0) {
        return songs
      }
    } catch {
      try {
        const searchRaw = await requestJson<{ result?: { songs?: RawSong[] } }>(
          buildUrl(base, '/weapi/cloudsearch/get/web', {
            s: normalized || '周杰伦',
            type: 1,
            limit: 40,
            offset: 0
          })
        )
        const songs = Array.isArray(searchRaw?.result?.songs) ? mapSongs(searchRaw.result.songs) : []
        if (songs.length > 0) {
          return songs
        }
      } catch {
        continue
      }
    }
  }

  try {
    const itunesSongs = await searchFromITunes(normalized)
    if (itunesSongs.length > 0) {
      return itunesSongs
    }
  } catch {
    //
  }

  for (const base of API_CANDIDATES()) {
    try {
      const quickSearch = await requestJson<{ result?: { songs?: RawSong[] } }>(
        buildUrl(base, '/search', { keywords: normalized || '周杰伦', limit: 30, offset: 0, type: 1 })
      )
      const songs = Array.isArray(quickSearch?.result?.songs) ? mapSongs(quickSearch.result.songs) : []
      if (songs.length > 0) {
        return songs
      }
    } catch {
      continue
    }
  }

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

export const getMusicUrl = async (id: number | string): Promise<string> => {
  if (typeof id === 'string' && id.startsWith(ITUNES_TRACK_PREFIX)) {
    return thirdPartyTrackUrlMap.get(id) || ''
  }

  for (const base of API_CANDIDATES()) {
    if (isUnmBase(base)) {
      try {
        const unmRaw = await requestJson<{ data?: Array<{ url?: string | null }> }>(
          buildUrl(base, '/api/song/enhance/player/url/v1', {
            ids: `["${String(id)}"]`,
            level: 'standard',
            encodeType: 'flac'
          })
        )
        const unmUrl = unmRaw?.data?.[0]?.url
        if (unmUrl) {
          return unmUrl
        }
      } catch {
        //
      }
      continue
    }

    try {
      for (const level of ['exhigh', 'lossless', 'higher', 'standard']) {
        const rawV1 = await requestJson<{ data?: Array<{ url?: string | null }> }>(
          buildUrl(base, '/song/url/v1', { id: String(id), level })
        )
        const urlV1 = rawV1?.data?.[0]?.url
        if (urlV1) {
          return urlV1
        }
      }
    } catch {
      try {
        const raw = await requestJson<{ data?: Array<{ url?: string | null }> }>(
          buildUrl(base, '/song/url', { id: String(id), level: 'standard' })
        )
        const url = raw?.data?.[0]?.url
        if (url) {
          return url
        }
      } catch {
        try {
          const legacyRaw = await requestJson<{ data?: Array<{ url?: string | null }> }>(
            buildUrl(base, '/weapi/song/enhance/player/url/v1', {
              id: String(id),
              br: 320000,
              level: 'standard'
            })
          )
          const url = legacyRaw?.data?.[0]?.url
          if (url) {
            return url
          }
        } catch {
          continue
        }
      }
    }
  }

  const unlockBases = Array.from(new Set([...API_CANDIDATES(), ...DEFAULT_UNLOCK_BASES]))
  for (const base of unlockBases) {
    try {
      for (const quality of ['lossless', 'exhigh', 'higher', 'standard']) {
        const unlockRaw = await requestJson<any>(
          buildUrl(base, '/unlock/song/url', { id: String(id), quality })
        )
        const unlockedUrl = extractUrlFromPayload(unlockRaw)
        if (unlockedUrl) {
          return unlockedUrl
        }
      }
    } catch {
      try {
        for (const quality of ['lossless', 'exhigh', 'higher', 'standard']) {
          const unlockRaw = await requestJson<any>(
            buildUrl(base, '/unblock/song/url', { id: String(id), quality })
          )
          const unlockedUrl = extractUrlFromPayload(unlockRaw)
          if (unlockedUrl) {
            return unlockedUrl
          }
        }
      } catch {
        continue
      }
    }
  }

  const target = demoSongs.find((item) => item.id === id)
  return target?.playMusicUrl ?? ''
}

export const resolvePlayableUrl = async (song: SongResult): Promise<string> => {
  if (song.playMusicUrl) {
    return song.playMusicUrl
  }

  const primaryUrl = await getMusicUrl(song.id)
  if (primaryUrl) {
    return primaryUrl
  }

  try {
    const keyword = `${song.name} ${song.ar?.[0]?.name || ''}`.trim()
    const fallbackSongs = await searchFromITunes(keyword)
    const exact = fallbackSongs.find((item) => item.name.toLowerCase() === song.name.toLowerCase())
    const picked = exact || fallbackSongs[0]
    return picked?.playMusicUrl || ''
  } catch {
    return ''
  }
}

export const resolvePlayableUrls = async (song: SongResult): Promise<string[]> => {
  const candidates: string[] = []
  const pushCandidate = (url?: string) => {
    if (!url) return
    if (!candidates.includes(url)) {
      candidates.push(url)
    }
  }

  pushCandidate(song.playMusicUrl)
  pushCandidate(await getMusicUrl(song.id))

  try {
    const keyword = `${song.name} ${song.ar?.[0]?.name || ''}`.trim()
    const fallbackSongs = await searchFromITunes(keyword)
    const exact = fallbackSongs.find((item) => item.name.toLowerCase() === song.name.toLowerCase())
    pushCandidate(exact?.playMusicUrl)
    fallbackSongs.slice(0, 5).forEach((item) => pushCandidate(item.playMusicUrl))
  } catch {
    //
  }

  return candidates
}

export const getLyric = async (id: number | string): Promise<ILyric> => {
  for (const base of API_CANDIDATES()) {
    if (isUnmBase(base)) {
      try {
        const lyricRaw = await requestJson<{ lrc?: { lyric?: string } }>(
          buildUrl(base, '/api/song/lyric', { id: String(id), lv: -1, tv: -1 })
        )
        const lrcText = lyricRaw?.lrc?.lyric || ''
        if (lrcText) {
          const parsed = parseLrc(lrcText)
          if (parsed.lrcArray.length > 0) {
            return parsed
          }
        }
      } catch {
        //
      }
      continue
    }

    try {
      const newLyricRaw = await requestJson<{ lrc?: { lyric?: string } }>(
        buildUrl(base, '/lyric/new', { id: String(id) })
      )
      const lrcText = newLyricRaw?.lrc?.lyric || ''
      if (lrcText) {
        const parsed = parseLrc(lrcText)
        if (parsed.lrcArray.length > 0) {
          return parsed
        }
      }
    } catch {
      try {
        const lyricRaw = await requestJson<{ lrc?: { lyric?: string } }>(
          buildUrl(base, '/lyric', { id: String(id) })
        )
        const lrcText = lyricRaw?.lrc?.lyric || ''
        if (lrcText) {
          const parsed = parseLrc(lrcText)
          if (parsed.lrcArray.length > 0) {
            return parsed
          }
        }
      } catch {
        try {
          const lyricRaw = await requestJson<{ lrc?: { lyric?: string } }>(
            buildUrl(base, '/weapi/song/lyric', { id: String(id), lv: -1, tv: -1 })
          )
          const lrcText = lyricRaw?.lrc?.lyric || ''
          if (lrcText) {
            const parsed = parseLrc(lrcText)
            if (parsed.lrcArray.length > 0) {
              return parsed
            }
          }
        } catch {
          continue
        }
      }
    }
  }

  const key = String(id)
  return (
    lyricMap[key] ?? {
      lrcTimeArray: [0],
      lrcArray: [{ text: '纯音乐，请静静聆听。', trText: 'Instrumental, enjoy the moment.', startTime: 0, duration: 5000 }]
    }
  )
}

export const pingMusicApi = async (base: string) => {
  const url = isUnmBase(base)
    ? buildUrl(base, '/api/search/get/web', { s: '周杰伦', type: 1, limit: 1, offset: 0, total: 1 })
    : buildUrl(base, '/cloudsearch', { keywords: '周杰伦', type: 1, limit: 1, offset: 0 })
  const result = await requestJson<{ code?: number; result?: { songs?: RawSong[] } }>(url)
  return Boolean(result?.result?.songs)
}

export const pingPublicBackup = async () => {
  const result = await searchFromITunes('周杰伦')
  return result.length > 0
}
