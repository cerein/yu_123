<template>
  <div class="page-shell">
    <header class="top-banner">
      <div class="welcome-tag">[welcome!]</div>
      <h1 class="title">- 我的个人主页 -</h1>
      <nav class="nav-bar">
        <a href="#" class="nav-item active">首页</a>
        <a href="#" class="nav-item">我的歌单</a>
        <a href="#" class="nav-item">我的日志</a>
        <a href="#" class="nav-item">联系我</a>
      </nav>
    </header>
    <main class="content-layout">
      <aside class="left-panel">
        <section class="card mini-player">
          <h3 class="card-title center">小音乐</h3>
          <p class="center sub">{{ currentSong ? currentSong.name : '暂无播放' }}</p>
          <div class="timeline-row">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
          <input
            v-model="currentTime"
            class="pink-range"
            type="range"
            min="0"
            :max="duration || 0"
            @input="seek"
          >
          <div class="player-actions">
            <button class="icon-btn" @click="prevSong">⏮</button>
            <button class="icon-btn main" @click="togglePlay">{{ isPlaying ? '⏸' : '▶' }}</button>
            <button class="icon-btn" @click="nextSong">⏭</button>
            <button class="icon-btn" @click="toggleFavorite">{{ isCurrentFavorite ? '❤' : '♡' }}</button>
          </div>
          <div class="volume-row">
            <span>音量</span>
            <input v-model="volume" class="pink-range" type="range" min="0" max="1" step="0.01">
          </div>
          <div class="mode-row">
            <button class="mode-btn" @click="togglePlayMode">{{ playModeLabel }}</button>
            <button class="mode-btn lyric-flag">歌词跟随·三行</button>
            <button class="mode-btn" @click="togglePlaybackRate">{{ playbackRateLabel }}</button>
            <button class="mode-btn" :disabled="!currentSong" @click="reparseCurrentSong">重解析</button>
          </div>
          <div class="mini-search-wrap">
            <div class="search-row">
              <input
                v-model.trim="searchQuery"
                class="search-input"
                placeholder="搜索歌曲 / 歌手 / 专辑"
                @keyup.enter="search"
              >
              <button class="search-btn" @click="search">搜索并选择</button>
            </div>
            <select v-model="selectedApiBase" class="search-input api-select">
              <option v-for="base in availableApiBases" :key="base" :value="base">
                {{ base }}
              </option>
            </select>
            <p v-if="isSearching" class="state-tip">搜索中...</p>
            <p v-else-if="searchError" class="state-tip error">{{ searchError }}</p>
            <p v-else-if="apiTestMsg" class="state-tip">{{ apiTestMsg }}</p>
          </div>
          <div class="mini-lyric">
            <p
              v-for="line in currentLyricWindow"
              :key="line.key"
              class="mini-lyric-line"
              :class="line.kind"
            >
              <span
                class="mini-lyric-text"
                :style="line.kind === 'current' ? { '--line-progress': `${Math.round(currentLyricProgress * 100)}%` } : undefined"
              >
                {{ line.text }}
              </span>
            </p>
          </div>
          <audio
            ref="audioPlayer"
            @timeupdate="updateTime"
            @ended="handleEnded"
            @loadedmetadata="handleLoadedMeta"
            @stalled="handleStalled"
            @waiting="handleWaiting"
          ></audio>
        </section>
        <section class="card">
          <h3 class="card-title">快速入口</h3>
          <div class="quick-grid">
            <button class="quick-btn" @click="showTab = 'all'">全部</button>
            <button class="quick-btn" @click="showTab = 'favorite'">收藏</button>
            <button class="quick-btn" @click="showTab = 'history'">历史</button>
          </div>
          <button class="import-btn" @click="triggerFileInput">导入本地音乐</button>
          <input ref="fileInput" class="hidden" type="file" accept="audio/*" multiple @change="handleFiles">
        </section>
        <section class="card">
          <h3 class="card-title">个人资料</h3>
          <p>性别：女</p>
          <p>爱好：旅行、摄影、读书</p>
          <p>职业：前端开发</p>
        </section>
      </aside>
      <section class="main-panel">
        <article class="pink-card">
          <div class="pink-head with-heart">个人简介 <button class="edit-btn" @click="toggleEditContent">{{ isEditingContent ? '保存内容' : '编辑内容' }}</button></div>
          <div class="pink-body intro-row">
            <p v-if="!isEditingContent">{{ introText }}</p>
            <textarea v-else v-model="introText" class="form-textarea content-editor"></textarea>
            <img class="intro-cover" :src="currentSong?.al.picUrl || 'https://picsum.photos/seed/card/280/170'" alt="cover">
          </div>
        </article>
        <article class="pink-card">
          <div class="pink-head with-heart">兴趣爱好 <span>❤</span></div>
          <div class="pink-body">
            <p v-if="!isEditingContent">{{ hobbyText }}</p>
            <textarea v-else v-model="hobbyText" class="form-textarea content-editor"></textarea>
          </div>
        </article>
        <article class="pink-card">
          <div class="pink-head">音乐列表</div>
          <div class="pink-body">
            <div class="list-wrap">
              <div
                v-for="song in visibleSongs"
                :key="song.id"
                class="song-item"
                :class="{ active: currentSong?.id === song.id }"
                @click="playSong(song)"
              >
                <img class="song-cover" :src="song.al.picUrl" alt="cover">
                <div class="song-meta">
                  <p class="song-name">{{ song.name }}</p>
                  <p class="song-sub">{{ song.ar.map((item) => item.name).join('/') }} · {{ song.al.name }}</p>
                </div>
                <p class="song-time">{{ song.dt ? formatTime(song.dt / 1000) : '--:--' }}</p>
              </div>
              <p v-if="visibleSongs.length === 0" class="empty-tip">当前分类没有歌曲</p>
            </div>
          </div>
        </article>
        <article class="pink-card">
          <div class="pink-head with-heart">我的留言 <span>💗</span></div>
          <div class="pink-body">
            <div class="form-grid">
              <input class="form-input" placeholder="昵称">
              <input class="form-input" placeholder="电子邮箱（选填）">
              <textarea class="form-textarea" placeholder="留言内容"></textarea>
              <button class="submit-btn">发送留言</button>
            </div>
          </div>
        </article>
        <article class="pink-card">
          <div class="pink-head with-heart">我的日志 <span>📝</span></div>
          <div class="pink-body">
            <p v-if="!isEditingContent" class="log-line">{{ logLine1 }}</p>
            <p v-if="!isEditingContent" class="log-line">{{ logLine2 }}</p>
            <template v-else>
              <input v-model="logLine1" class="form-input content-editor-input">
              <input v-model="logLine2" class="form-input content-editor-input">
            </template>
          </div>
        </article>
      </section>
    </main>
    <footer class="page-footer">
      <div class="footer-links">
        <a href="#">关于我</a>
        <a href="#">我的音乐</a>
        <a href="#">留言板</a>
        <a href="#">GitHub</a>
      </div>
      <p>© 2026 我的个人主页 · Vue3 + TypeScript</p>
    </footer>
    <div v-if="showSearchPopup" class="search-popup-mask" @click.self="closeSearchPopup">
      <div class="search-popup">
        <div class="search-popup-head">
          <div class="search-popup-title">
            <h4>选择歌曲</h4>
            <p>{{ searchQuery || '推荐歌曲' }} · {{ searchCandidates.length }} 首结果</p>
          </div>
          <button class="popup-close-btn" @click="closeSearchPopup">关闭</button>
        </div>
        <div class="search-popup-list">
          <button
            v-for="song in searchCandidates"
            :key="`popup-${song.id}`"
            class="search-popup-item"
            @click="chooseSearchSong(song)"
          >
            <img class="song-cover" :src="song.al.picUrl" alt="cover">
            <div class="song-meta">
              <p class="song-name">{{ song.name }}</p>
              <p class="song-sub">{{ song.ar.map((item) => item.name).join('/') }} · {{ song.al.name }}</p>
            </div>
            <div class="popup-item-right">
              <p class="song-time">{{ song.dt ? formatTime(song.dt / 1000) : '--:--' }}</p>
              <span v-if="currentSong && String(currentSong.id) === String(song.id)" class="playing-badge">播放中</span>
            </div>
          </button>
          <div v-if="searchCandidates.length === 0" class="popup-empty">
            <p class="popup-empty-title">没有可选歌曲</p>
            <p class="popup-empty-sub">试试更换关键词，或先检测 API 连通性</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  API_PRESET_BASES,
  getApiBase,
  getLyric,
  getSongDuration,
  invalidateSongSourceCache,
  pingMusicApi,
  reportPlaybackResult,
  resolvePlayableUrls,
  searchMusic,
  setApiBase
} from '../api/music'
import { playbackRequestManager } from '../services/playbackRequestManager'
import { debounce } from '../utils/debounce'
import type { ILyric, SongResult } from '../types/music'

type PlayMode = 'loop' | 'single' | 'random'
type ShowTab = 'all' | 'favorite' | 'history'

const FAVORITE_KEY = 'blog-music-favorite'
const HISTORY_KEY = 'blog-music-history'
const PLAY_MODE_KEY = 'blog-music-play-mode'
const VOLUME_KEY = 'blog-music-volume'
const RATE_KEY = 'blog-music-rate'
const LAST_SONG_KEY = 'blog-music-last-song'
const PROGRESS_KEY = 'blog-music-progress'
const PAGE_COPY_KEY = 'blog-page-copy'

const audioPlayer = ref<HTMLAudioElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const songs = ref<SongResult[]>([])
const currentSong = ref<SongResult | null>(null)
const lyrics = ref<ILyric | null>(null)
const currentLyricIndex = ref(0)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(0.7)
const playbackRate = ref(1)
const playMode = ref<PlayMode>('loop')
const showTab = ref<ShowTab>('all')
const favoriteIds = ref<string[]>([])
const historyIds = ref<string[]>([])
const userPlayIntent = ref(false)
const lastActionAt = ref(0)
const lastProgressSaveAt = ref(0)
const playSessionId = ref(0)
const lastRecoverAt = ref(0)
const isSearching = ref(false)
const searchError = ref('')
const selectedApiBase = ref('')
const availableApiBases = ref<string[]>([])
const apiTestMsg = ref('')
const currentLyricProgress = ref(0)
const showSearchPopup = ref(false)
const searchCandidates = ref<SongResult[]>([])
const isEditingContent = ref(false)
const introText = ref('这是一个把个人主页和音乐播放器融合在一起的纯前端页面。播放器核心交互参考了 AlgerMusicPlayer，保留了播放控制、列表管理、歌词同步、播放模式和本地歌单持久化。')
const hobbyText = ref('我喜欢在写代码和写作时听音乐，希望这个页面既有复古个人主页的观感，也有现代播放器的体验。你可以直接搜索示例歌曲，或者导入本地音乐文件立刻播放。')
const logLine1 = ref('今天把播放器重构成更稳定的流式播放链路。')
const logLine2 = ref('歌词滚动按换行触发，体验和 Alger 更一致。')

const currentSongId = computed(() => (currentSong.value ? String(currentSong.value.id) : ''))
const isCurrentFavorite = computed(() => favoriteIds.value.includes(currentSongId.value))

const playModeLabel = computed(() => {
  if (playMode.value === 'loop') return '列表循环'
  if (playMode.value === 'single') return '单曲循环'
  return '随机播放'
})

const playbackRateLabel = computed(() => `${playbackRate.value.toFixed(1)}x`)

const currentLyricWindow = computed(() => {
  const lines = lyrics.value?.lrcArray || []
  const pickText = (line?: { text?: string; trText?: string }) => {
    const main = line?.text?.trim()
    if (main) return main
    const trans = line?.trText?.trim()
    if (trans) return trans
    return '♪'
  }
  if (!lines.length) {
    return [
      { key: 'empty-prev', kind: 'prev', text: '' },
      { key: 'empty-current', kind: 'current', text: '暂无歌词' },
      { key: 'empty-next', kind: 'next', text: '' }
    ]
  }
  const index = Math.max(0, Math.min(currentLyricIndex.value, lines.length - 1))
  const prev = pickText(lines[index - 1])
  const current = pickText(lines[index])
  const next = pickText(lines[index + 1])
  return [
    { key: `prev-${index - 1}`, kind: 'prev', text: prev },
    { key: `current-${index}`, kind: 'current', text: current },
    { key: `next-${index + 1}`, kind: 'next', text: next }
  ]
})

const visibleSongs = computed(() => {
  if (showTab.value === 'favorite') {
    return songs.value.filter((song) => favoriteIds.value.includes(String(song.id)))
  }
  if (showTab.value === 'history') {
    const order = [...historyIds.value].reverse()
    return order
      .map((id) => songs.value.find((song) => String(song.id) === id))
      .filter((song): song is SongResult => Boolean(song))
  }
  return songs.value
})

const persistFavorites = () => {
  localStorage.setItem(FAVORITE_KEY, JSON.stringify(favoriteIds.value))
}

const persistHistory = () => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyIds.value.slice(-60)))
}

const bootstrapLocalState = () => {
  const rawFavorite = localStorage.getItem(FAVORITE_KEY)
  const rawHistory = localStorage.getItem(HISTORY_KEY)
  const rawMode = localStorage.getItem(PLAY_MODE_KEY)
  const rawVolume = localStorage.getItem(VOLUME_KEY)
  const rawRate = localStorage.getItem(RATE_KEY)
  favoriteIds.value = rawFavorite ? JSON.parse(rawFavorite) : []
  historyIds.value = rawHistory ? JSON.parse(rawHistory) : []
  playMode.value = rawMode === 'single' || rawMode === 'random' || rawMode === 'loop' ? rawMode : 'loop'
  volume.value = rawVolume ? Number(rawVolume) : 0.7
  playbackRate.value = rawRate ? Number(rawRate) : 1
  const rawCopy = localStorage.getItem(PAGE_COPY_KEY)
  if (rawCopy) {
    try {
      const parsed = JSON.parse(rawCopy) as {
        intro?: string
        hobby?: string
        log1?: string
        log2?: string
      }
      if (parsed.intro) introText.value = parsed.intro
      if (parsed.hobby) hobbyText.value = parsed.hobby
      if (parsed.log1) logLine1.value = parsed.log1
      if (parsed.log2) logLine2.value = parsed.log2
    } catch {
      localStorage.removeItem(PAGE_COPY_KEY)
    }
  }
}

const persistPageCopy = () => {
  localStorage.setItem(
    PAGE_COPY_KEY,
    JSON.stringify({
      intro: introText.value,
      hobby: hobbyText.value,
      log1: logLine1.value,
      log2: logLine2.value
    })
  )
}

const toggleEditContent = () => {
  if (isEditingContent.value) {
    persistPageCopy()
  }
  isEditingContent.value = !isEditingContent.value
}

const markHistory = (songId: string) => {
  historyIds.value = historyIds.value.filter((id) => id !== songId)
  historyIds.value.push(songId)
  persistHistory()
}

const getSearchResult = async (keyword: string) => {
  isSearching.value = true
  searchError.value = ''
  try {
    songs.value = await searchMusic(keyword)
    if (songs.value.length === 0 && keyword.trim()) {
      searchError.value = '没有搜索到歌曲，请换个关键词'
    }
  } catch {
    searchError.value = '搜索失败，请检查网络或更换 API 地址'
  } finally {
    isSearching.value = false
  }
}

const getPopupSearchResult = async (keyword: string) => {
  isSearching.value = true
  searchError.value = ''
  try {
    searchCandidates.value = await searchMusic(keyword)
    showSearchPopup.value = true
    if (searchCandidates.value.length === 0 && keyword.trim()) {
      searchError.value = '没有搜索到歌曲，请换个关键词'
    }
  } catch {
    searchError.value = '搜索失败，请检查网络或更换 API 地址'
    searchCandidates.value = []
    showSearchPopup.value = true
  } finally {
    isSearching.value = false
  }
}

const search = async () => {
  await getPopupSearchResult(searchQuery.value)
}

const closeSearchPopup = () => {
  showSearchPopup.value = false
}

const chooseSearchSong = async (song: SongResult) => {
  closeSearchPopup()
  const exists = songs.value.some((item) => String(item.id) === String(song.id))
  if (!exists) {
    songs.value = [song, ...songs.value]
  }
  showTab.value = 'all'
  await playSong(song)
}

const loadAvailableApiBases = async () => {
  const current = getApiBase()
  const seed = Array.from(new Set([current, ...API_PRESET_BASES].map((item) => item.trim()).filter(Boolean)))
  const okList: string[] = []
  for (const base of seed) {
    try {
      const ok = await pingMusicApi(base)
      if (ok) {
        okList.push(base)
      }
    } catch {}
  }
  availableApiBases.value = okList.length > 0 ? okList : seed
  selectedApiBase.value = availableApiBases.value.includes(current) ? current : availableApiBases.value[0] || current
  if (selectedApiBase.value) {
    setApiBase(selectedApiBase.value)
    apiTestMsg.value = `当前 API：${selectedApiBase.value}`
  }
}

const canTriggerAction = () => {
  const now = Date.now()
  if (now - lastActionAt.value < 220) return false
  lastActionAt.value = now
  return true
}

const isAbortPlayError = (error: unknown) => {
  if (error instanceof DOMException) {
    return error.name === 'AbortError'
  }
  if (error && typeof error === 'object' && 'name' in error) {
    return (error as { name?: string }).name === 'AbortError'
  }
  return false
}

const safeReadProgress = (songId: string) => {
  const saved = localStorage.getItem(PROGRESS_KEY)
  if (!saved) return 0
  try {
    const parsed = JSON.parse(saved) as { songId?: string; progress?: number }
    if (parsed.songId === songId && Number.isFinite(parsed.progress) && (parsed.progress || 0) > 0) {
      return parsed.progress || 0
    }
    return 0
  } catch {
    localStorage.removeItem(PROGRESS_KEY)
    return 0
  }
}

const LYRIC_TIME_OFFSET_MS = 220

const getCurrentLineIndex = (playTimeMs: number, lrc: ILyric) => {
  const list = lrc.lrcArray
  if (!list || list.length === 0) return -1
  const adjusted = playTimeMs + LYRIC_TIME_OFFSET_MS
  for (let i = 0; i < list.length; i += 1) {
    const current = list[i].startTime ?? 0
    const next = list[i + 1]?.startTime
    if (adjusted < current) {
      return i === 0 ? 0 : i - 1
    }
    if (next === undefined || adjusted < next) {
      return i
    }
  }
  return list.length - 1
}

const waitForPlayable = (player: HTMLAudioElement, timeoutMs = 6000) =>
  new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      player.removeEventListener('canplay', onCanPlay)
      player.removeEventListener('error', onError)
      window.clearTimeout(timer)
    }
    const onCanPlay = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('audio source failed'))
    }
    const timer = window.setTimeout(() => {
      cleanup()
      reject(new Error('audio load timeout'))
    }, timeoutMs)
    player.addEventListener('canplay', onCanPlay, { once: true })
    player.addEventListener('error', onError, { once: true })
  })

const waitForMetadata = (player: HTMLAudioElement, timeoutMs = 2000) =>
  new Promise<void>((resolve) => {
    if (Number.isFinite(player.duration) && player.duration > 0) {
      resolve()
      return
    }
    const cleanup = () => {
      player.removeEventListener('loadedmetadata', onLoadedMeta)
      player.removeEventListener('durationchange', onDurationChange)
      window.clearTimeout(timer)
    }
    const done = () => {
      cleanup()
      resolve()
    }
    const onLoadedMeta = () => done()
    const onDurationChange = () => {
      if (Number.isFinite(player.duration) && player.duration > 0) {
        done()
      }
    }
    const timer = window.setTimeout(done, timeoutMs)
    player.addEventListener('loadedmetadata', onLoadedMeta, { once: true })
    player.addEventListener('durationchange', onDurationChange)
  })

const isLikelyTrialSource = (song: SongResult, sourceDurationSec: number, currentSrc: string) => {
  if (String(song.id).startsWith('local-')) return false
  if (/jymusic|404/i.test(currentSrc)) return true
  if (!Number.isFinite(sourceDurationSec) || sourceDurationSec <= 0) return false
  const expectedSec = (song.dt || 0) / 1000
  if (expectedSec > 120 && sourceDurationSec < Math.min(45, expectedSec * 0.55)) return true
  if (expectedSec > 0 && sourceDurationSec > expectedSec * 1.8) return true
  return false
}

const canUsePreviewFallback = (song: SongResult) => {
  const expectedSec = (song.dt || 0) / 1000
  if (expectedSec <= 0) return true
  return expectedSec <= 90
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFiles = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (!target.files) return

  const imported: SongResult[] = Array.from(target.files).map((file, index) => ({
    id: `local-${Date.now()}-${index}`,
    name: file.name.replace(/\.[^/.]+$/, ''),
    picUrl: 'https://picsum.photos/seed/localmusic/200/200',
    ar: [{ id: 'local', name: '本地音乐' }],
    al: { id: 'local', name: '本地导入', picUrl: 'https://picsum.photos/seed/localmusic/200/200' },
    playMusicUrl: URL.createObjectURL(file)
  }))

  const oldLocal = songs.value.filter((song) => !String(song.id).startsWith('local-'))
  songs.value = [...imported, ...oldLocal]
  showTab.value = 'all'
}

const playSong = async (song: SongResult, options?: { forceRefresh?: boolean }) => {
  const player = audioPlayer.value
  if (!player) return
  searchError.value = ''

  if (currentSong.value?.id === song.id && !options?.forceRefresh) {
    togglePlay()
    return
  }

  if (!song.dt || song.dt === 0) {
    getSongDuration(song.id).then((dt) => {
      if (dt && dt > 0) {
        song.dt = dt
      }
    })
  }

  const requestId = playbackRequestManager.createRequest(song)
  if (!playbackRequestManager.activateRequest(requestId)) return
  const signal = playbackRequestManager.getAbortSignal(requestId)

  currentSong.value = song
  lyrics.value = null
  currentLyricIndex.value = 0
  currentLyricProgress.value = 0
  userPlayIntent.value = true

  try {
    const currentSession = ++playSessionId.value
    const urls = await resolvePlayableUrls(song, Boolean(options?.forceRefresh))
    if (urls.length === 0) {
      throw new Error('no playable url')
    }
    if (signal?.aborted) return

    let played = false
    let previewFallbackUrl = ''
    let attempts = 0
    for (const url of urls) {
      if (signal?.aborted) return
      attempts += 1
      try {
        player.pause()
        player.src = url
        player.load()
        player.playbackRate = playbackRate.value
        await waitForPlayable(player, 2200)
        await waitForMetadata(player, 800)
        const sourceDuration = Number.isFinite(player.duration) ? player.duration : 0
        const resolvedSrc = player.currentSrc || url
        if (isLikelyTrialSource(song, sourceDuration, resolvedSrc)) {
          reportPlaybackResult(url, false)
          if (!previewFallbackUrl) {
            previewFallbackUrl = url
          }
          player.pause()
          player.removeAttribute('src')
          player.load()
          if (attempts >= 2) {
            break
          }
          continue
        }
        const progress = safeReadProgress(String(song.id))
        if (progress > 0) {
          player.currentTime = progress
        }

        try {
          await player.play()
        } catch (error) {
          if (isAbortPlayError(error) || currentSession !== playSessionId.value) {
            return
          }
          throw error
        }

        currentSong.value = { ...song, playMusicUrl: url }
        reportPlaybackResult(url, true)
        if (Number.isFinite(player.duration) && player.duration > 0) {
          duration.value = player.duration
        } else if (song.dt && song.dt > 0) {
          duration.value = song.dt / 1000
        } else {
          getSongDuration(song.id).then((dt) => {
            if (dt && dt > 0 && currentSong.value && String(currentSong.value.id) === String(song.id)) {
              duration.value = dt / 1000
              currentSong.value = { ...currentSong.value, dt }
            }
          })
        }
        played = true
        break
      } catch (error) {
        reportPlaybackResult(url, false)
        if (isAbortPlayError(error)) {
          return
        }
        if (previewFallbackUrl && attempts >= 3) {
          break
        }
        continue
      }
    }

    if (!played && previewFallbackUrl && canUsePreviewFallback(song)) {
      if (signal?.aborted) return
      player.pause()
      player.src = previewFallbackUrl
      player.load()
      player.playbackRate = playbackRate.value
      await waitForPlayable(player, 2200)
      await waitForMetadata(player, 800)
      const progress = safeReadProgress(String(song.id))
      if (progress > 0) {
        player.currentTime = progress
      }
      await player.play()
      currentSong.value = { ...song, playMusicUrl: previewFallbackUrl }
      reportPlaybackResult(previewFallbackUrl, true)
      if (Number.isFinite(player.duration) && player.duration > 0) {
        duration.value = player.duration
      } else if (song.dt && song.dt > 0) {
        duration.value = song.dt / 1000
      }
      played = true
    }

    if (!played) {
      throw new Error('all candidate urls failed')
    }
    if (signal?.aborted) return
    isPlaying.value = true
    markHistory(String(song.id))
    localStorage.setItem(LAST_SONG_KEY, String(song.id))
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: song.name,
        artist: song.ar.map((item) => item.name).join('/'),
        album: song.al.name,
        artwork: [{ src: song.al.picUrl, sizes: '200x200', type: 'image/jpeg' }]
      })
      navigator.mediaSession.playbackState = 'playing'
    }

    playbackRequestManager.completeRequest(requestId)
    void getLyric(song.id)
      .then((lrc) => {
        if (signal?.aborted) return
        lyrics.value = lrc
      })
      .catch(() => {})
  } catch (error) {
    if (isAbortPlayError(error)) {
      return
    }
    playbackRequestManager.failRequest(requestId)
    searchError.value = '播放失败：该歌曲可能无可用音源，已尝试主接口、备源与第三方兜底，可点“重解析”或切换音源'
  }
}

const togglePlay = async () => {
  const player = audioPlayer.value
  if (!player || !currentSong.value) return
  if (player.paused) {
    const currentSession = ++playSessionId.value
    try {
      await player.play()
    } catch (error) {
      if (isAbortPlayError(error) || currentSession !== playSessionId.value) {
        return
      }
      throw error
    }
    isPlaying.value = true
    userPlayIntent.value = true
  } else {
    playSessionId.value += 1
    player.pause()
    isPlaying.value = false
    userPlayIntent.value = false
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused'
    }
  }
}

const nextIndex = (from: number) => {
  if (visibleSongs.value.length === 0) return -1
  if (playMode.value === 'random') {
    return Math.floor(Math.random() * visibleSongs.value.length)
  }
  if (playMode.value === 'single') {
    return from
  }
  return (from + 1) % visibleSongs.value.length
}

const prevIndex = (from: number) => {
  if (visibleSongs.value.length === 0) return -1
  if (playMode.value === 'random') {
    return Math.floor(Math.random() * visibleSongs.value.length)
  }
  if (playMode.value === 'single') {
    return from
  }
  return (from - 1 + visibleSongs.value.length) % visibleSongs.value.length
}

const nextSong = async () => {
  if (!canTriggerAction()) return
  if (!currentSong.value || visibleSongs.value.length === 0) return
  const index = visibleSongs.value.findIndex((song) => song.id === currentSong.value?.id)
  const target = nextIndex(index === -1 ? 0 : index)
  if (target < 0) return
  await playSong(visibleSongs.value[target])
}

const prevSong = async () => {
  if (!canTriggerAction()) return
  if (!currentSong.value || visibleSongs.value.length === 0) return
  const index = visibleSongs.value.findIndex((song) => song.id === currentSong.value?.id)
  const target = prevIndex(index === -1 ? 0 : index)
  if (target < 0) return
  await playSong(visibleSongs.value[target])
}

const handleEnded = async () => {
  await nextSong()
}

const reparseCurrentSong = async () => {
  if (!currentSong.value) return
  invalidateSongSourceCache(currentSong.value)
  await playSong(currentSong.value, { forceRefresh: true })
}

const tryAutoRecover = async () => {
  if (!currentSong.value || !isPlaying.value || !userPlayIntent.value) return
  const now = Date.now()
  if (now - lastRecoverAt.value < 8000) return
  lastRecoverAt.value = now
  invalidateSongSourceCache(currentSong.value)
  searchError.value = '检测到播放卡顿，正在自动重解析音源'
  await playSong(currentSong.value, { forceRefresh: true })
}

const handleStalled = () => {
  void tryAutoRecover()
}

const handleWaiting = () => {
  void tryAutoRecover()
}

const handleLoadedMeta = () => {
  if (!audioPlayer.value) return
  const metaDuration = Number.isFinite(audioPlayer.value.duration) ? audioPlayer.value.duration : 0
  if (metaDuration > 0) {
    duration.value = metaDuration
    return
  }
  if (currentSong.value?.dt && currentSong.value.dt > 0) {
    duration.value = currentSong.value.dt / 1000
  }
}

const updateTime = () => {
  if (!audioPlayer.value) return
  currentTime.value = audioPlayer.value.currentTime
  const liveDuration = Number.isFinite(audioPlayer.value.duration) ? audioPlayer.value.duration : 0
  if (liveDuration > 0) {
    duration.value = liveDuration
  } else if (currentSong.value?.dt && currentSong.value.dt > 0) {
    duration.value = currentSong.value.dt / 1000
  }
  const now = Date.now()
  if (currentSong.value && now - lastProgressSaveAt.value > 1000) {
    lastProgressSaveAt.value = now
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ songId: String(currentSong.value.id), progress: currentTime.value })
    )
  }
  if (!lyrics.value) return
  const matched = getCurrentLineIndex(currentTime.value * 1000, lyrics.value)
  if (matched >= 0 && matched !== currentLyricIndex.value) {
    currentLyricIndex.value = matched
  }
  if (matched >= 0) {
    const currentLine = lyrics.value.lrcArray[matched]
    const nextStart = lyrics.value.lrcArray[matched + 1]?.startTime
    const start = currentLine?.startTime ?? 0
    const end = nextStart ?? start + Math.max(currentLine?.duration ?? 4000, 1000)
    const total = Math.max(end - start, 1)
    const ratio = (currentTime.value * 1000 - start) / total
    currentLyricProgress.value = Math.min(1, Math.max(0, ratio))
  }
}

const seek = () => {
  if (!audioPlayer.value) return
  audioPlayer.value.currentTime = currentTime.value
}

const togglePlayMode = () => {
  if (playMode.value === 'loop') {
    playMode.value = 'single'
    return
  }
  if (playMode.value === 'single') {
    playMode.value = 'random'
    return
  }
  playMode.value = 'loop'
}

const togglePlaybackRate = () => {
  if (playbackRate.value === 1) {
    playbackRate.value = 1.25
  } else if (playbackRate.value === 1.25) {
    playbackRate.value = 1.5
  } else if (playbackRate.value === 1.5) {
    playbackRate.value = 0.75
  } else {
    playbackRate.value = 1
  }
  if (audioPlayer.value) {
    audioPlayer.value.playbackRate = playbackRate.value
  }
}

const toggleFavorite = () => {
  if (!currentSong.value) return
  const id = String(currentSong.value.id)
  if (favoriteIds.value.includes(id)) {
    favoriteIds.value = favoriteIds.value.filter((item) => item !== id)
  } else {
    favoriteIds.value = [...favoriteIds.value, id]
  }
  persistFavorites()
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

watch(volume, (value) => {
  if (!audioPlayer.value) return
  audioPlayer.value.volume = value
  localStorage.setItem(VOLUME_KEY, String(value))
})

watch(searchQuery, debounce(() => {
  searchError.value = ''
}, 300))

watch(playMode, (mode) => {
  localStorage.setItem(PLAY_MODE_KEY, mode)
})

watch(playbackRate, (rate) => {
  localStorage.setItem(RATE_KEY, String(rate))
  if (audioPlayer.value) {
    audioPlayer.value.playbackRate = rate
  }
})

onMounted(async () => {
  bootstrapLocalState()
  await loadAvailableApiBases()
  await getSearchResult('周杰伦')
  if (audioPlayer.value) {
    audioPlayer.value.volume = volume.value
    audioPlayer.value.playbackRate = playbackRate.value
  }
  if ('mediaSession' in navigator) {
    navigator.mediaSession.setActionHandler('play', () => {
      void togglePlay()
    })
    navigator.mediaSession.setActionHandler('pause', () => {
      void togglePlay()
    })
    navigator.mediaSession.setActionHandler('previoustrack', () => {
      void prevSong()
    })
    navigator.mediaSession.setActionHandler('nexttrack', () => {
      void nextSong()
    })
  }
})

watch(selectedApiBase, async (value) => {
  const base = value.trim()
  if (!base) return
  setApiBase(base)
  apiTestMsg.value = `当前 API：${base}`
  if (searchQuery.value.trim()) {
    await getSearchResult(searchQuery.value)
  }
})
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  background:
    radial-gradient(circle at 18% -16%, rgba(255, 135, 196, 0.18) 0%, rgba(255, 135, 196, 0) 42%),
    radial-gradient(circle at 90% 0%, rgba(108, 186, 255, 0.12) 0%, rgba(108, 186, 255, 0) 34%),
    linear-gradient(180deg, #14171d 0%, #0b0d11 100%);
  color: #f1f1f1;
}

.top-banner {
  background: linear-gradient(180deg, #c8f5ff 0%, #dffbff 100%);
  padding-top: 20px;
  border-bottom: 1px solid #2d2f33;
}

.welcome-tag {
  width: min(1220px, 96vw);
  margin: 0 auto;
  color: #b98d00;
  font-size: clamp(26px, 4vw, 42px);
  font-weight: 700;
}

.title {
  width: min(1220px, 96vw);
  margin: 8px auto 18px;
  text-align: center;
  color: #fff;
  font-size: clamp(32px, 5vw, 58px);
  text-shadow: 2px 2px 0 #6f8797;
}

.nav-bar {
  background: #1f2227;
  border-top: 1px solid #353a40;
  border-bottom: 1px solid #353a40;
  display: flex;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 8px 10px;
}

.nav-item {
  color: #c8cbd0;
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 13px;
}

.nav-item.active,
.nav-item:hover {
  background: #2d3138;
  color: #fff;
}

.content-layout {
  width: min(1240px, 96vw);
  margin: 16px auto 0;
  display: grid;
  grid-template-columns: 306px 1fr;
  gap: 16px;
  align-items: start;
}

.left-panel,
.main-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card,
.pink-card {
  border: 1px solid #3a3f49;
  border-radius: 10px;
  background: #1a1e25;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.34);
}

.card {
  padding: 12px;
}

.mini-player {
  position: sticky;
  top: 14px;
}

.card-title {
  color: #ffc0df;
  font-size: 14px;
  margin-bottom: 10px;
}

.center {
  text-align: center;
}

.sub {
  color: #b9bec8;
  font-size: 12px;
}

.timeline-row {
  display: flex;
  justify-content: space-between;
  color: #9ea5b0;
  font-size: 12px;
  margin: 10px 0 6px;
}

.pink-range {
  width: 100%;
  accent-color: #ff5fb0;
}

.player-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 12px 0;
}

.icon-btn {
  width: 34px;
  height: 34px;
  border: 1px solid #494f5a;
  border-radius: 999px;
  background: #262a31;
  color: #ff76bb;
}

.icon-btn.main {
  background: #ff63b2;
  color: #fff;
  border-color: transparent;
}

.volume-row {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 8px;
  align-items: center;
  color: #adb3bd;
  font-size: 12px;
  margin-bottom: 10px;
}

.mode-row {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  border: 1px solid #474d59;
  background: #2b2f36;
  border-radius: 7px;
  color: #ff8ac7;
  font-size: 12px;
  padding: 6px 4px;
}

.mode-btn.lyric-flag {
  pointer-events: none;
  opacity: 0.85;
}

.mini-search-wrap {
  margin-top: 10px;
  padding: 10px;
  border: 1px solid #3f4552;
  border-radius: 8px;
  background: #1a1f26;
}

.mini-lyric {
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px solid #3f4552;
  border-radius: 8px;
  background: #1a1f26;
  min-height: 102px;
  display: grid;
  align-content: center;
  gap: 6px;
}

.mini-lyric-line {
  margin: 0;
  text-align: center;
  color: #8d95a2;
  font-size: 12px;
  line-height: 1.45;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.25s ease;
}

.mini-lyric-text {
  display: inline-block;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mini-lyric-line.current {
  color: #ffd3ea;
  font-size: 16px;
  font-weight: 700;
  transform: scale(1.03);
}

.mini-lyric-line.current .mini-lyric-text {
  color: #ffd9ef;
  --line-progress: 0%;
  background: linear-gradient(
    90deg,
    #ffd9ef 0%,
    #ffd9ef var(--line-progress),
    #7f8796 var(--line-progress),
    #7f8796 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
}

@supports ((-webkit-background-clip: text) or (background-clip: text)) {
  .mini-lyric-line.current .mini-lyric-text {
    color: transparent;
    -webkit-text-fill-color: transparent;
  }
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.quick-btn,
.import-btn,
.search-btn,
.submit-btn {
  border: 1px solid #454b56;
  border-radius: 8px;
  background: #2b3038;
  color: #f5f7fa;
}

.quick-btn {
  height: 34px;
}

.import-btn {
  margin-top: 10px;
  width: 100%;
  height: 36px;
  background: #ff66b3;
  border-color: transparent;
}

.pink-head {
  min-height: 38px;
  padding: 0 14px;
  display: flex;
  align-items: center;
  background: linear-gradient(90deg, #ff9dd0 0%, #ffb5dc 100%);
  color: #ffffff;
  font-weight: 700;
  font-size: 14px;
}

.with-heart {
  justify-content: space-between;
}

.edit-btn {
  border: 1px solid rgba(255, 255, 255, 0.38);
  border-radius: 6px;
  background: rgba(31, 34, 40, 0.3);
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
}

.pink-body {
  padding: 14px;
  color: #dce2ec;
  line-height: 1.75;
  background: linear-gradient(180deg, #1c2028 0%, #171b22 100%);
}

.intro-row {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 14px;
  align-items: center;
}

.intro-cover {
  width: 100%;
  height: 164px;
  border-radius: 8px;
  object-fit: cover;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr 92px;
  gap: 10px;
}

.search-input,
.form-input,
.form-textarea {
  border: 1px solid #4b5260;
  border-radius: 8px;
  background: #171a1f;
  color: #f2f4f7;
  padding: 0 12px;
}

.search-input,
.form-input {
  height: 40px;
}

.api-select {
  margin-top: 10px;
}

.form-grid {
  display: grid;
  gap: 10px;
}

.form-textarea {
  min-height: 120px;
  padding-top: 10px;
  resize: vertical;
}

.content-editor {
  min-height: 140px;
}

.content-editor-input + .content-editor-input {
  margin-top: 8px;
}

.submit-btn {
  height: 36px;
  width: 120px;
  justify-self: end;
  background: #ff66b3;
  border-color: transparent;
}

.search-btn {
  background: #ff66b3;
  border-color: transparent;
}

.search-btn.ghost {
  background: #2b3038;
  border-color: #525866;
  color: #ffacd8;
}

.search-btn:disabled {
  opacity: 0.6;
}

.state-tip {
  margin-top: 8px;
  color: #9ca4b0;
  font-size: 12px;
}

.state-tip.error {
  color: #ff7fbf;
}

.list-wrap {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.song-item {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #495160;
  border-radius: 8px;
  padding: 8px;
  background: #161b22;
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.song-item:hover {
  border-color: #ff7fbe;
  background: #25202c;
  transform: translateY(-1px);
}

.song-item.active {
  border-color: #ff78be;
  background: #2b2331;
}

.song-cover {
  width: 54px;
  height: 54px;
  border-radius: 6px;
  object-fit: cover;
}

.song-name {
  font-weight: 700;
  color: #f8f8f8;
}

.song-sub,
.song-time {
  color: #9ba3af;
  font-size: 12px;
}

.lyric-wrap {
  margin-top: 12px;
  max-height: 460px;
  overflow: auto;
  padding: 8px 2px;
  scroll-behavior: smooth;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.lyric-wrap::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.lyric-line {
  text-align: center;
  color: #a4acb8;
  margin: 14px 0;
  transition: all 0.25s ease;
  opacity: 0.7;
  user-select: none;
}

.lyric-line span {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.lyric-line.on {
  color: #ffd3ea;
  font-size: 18px;
  font-weight: 700;
  opacity: 1;
  transform: scale(1.05);
}

.empty-tip,
.log-line {
  color: #a1a8b5;
}

.empty-tip {
  text-align: center;
  padding: 24px 0;
}

.log-line + .log-line {
  margin-top: 6px;
}

.page-footer {
  width: min(1240px, 96vw);
  margin: 18px auto 0;
  padding: 22px 8px 30px;
  text-align: center;
  color: #8d95a2;
  font-size: 12px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 14px;
  margin-bottom: 8px;
}

.footer-links a {
  color: #ff8dcb;
  text-decoration: none;
}

.search-popup-mask {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 12, 0.72);
  display: grid;
  place-items: center;
  z-index: 30;
  padding: 16px;
}

.search-popup {
  width: min(760px, 94vw);
  max-height: 82vh;
  border: 1px solid #434b58;
  border-radius: 12px;
  background: linear-gradient(180deg, #1b2028 0%, #141820 100%);
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
}

.search-popup-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: linear-gradient(90deg, #ff9ed1 0%, #ffb8df 100%);
  color: #ffffff;
}

.search-popup-title h4 {
  margin: 0;
  font-size: 16px;
}

.search-popup-title p {
  margin: 2px 0 0;
  font-size: 12px;
  opacity: 0.9;
}

.popup-close-btn {
  border: 1px solid rgba(255, 255, 255, 0.45);
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.18);
  color: #fff;
  font-size: 12px;
  padding: 4px 10px;
}

.search-popup-list {
  max-height: calc(82vh - 54px);
  overflow: auto;
  padding: 12px 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-popup-item {
  display: grid;
  grid-template-columns: 54px 1fr auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #3f4652;
  border-radius: 8px;
  padding: 10px;
  background: #181d24;
  cursor: pointer;
  color: inherit;
  text-align: left;
  transition: border-color 0.2s ease, transform 0.2s ease, background 0.2s ease;
}

.search-popup-item:hover {
  border-color: #ff78be;
  background: #2b2331;
  transform: translateY(-1px);
}

.popup-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.playing-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 54px;
  height: 20px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(255, 103, 179, 0.2);
  border: 1px solid rgba(255, 120, 190, 0.55);
  color: #ff9fd2;
  font-size: 11px;
}

.popup-empty {
  border: 1px dashed #475062;
  border-radius: 10px;
  padding: 28px 14px;
  text-align: center;
}

.popup-empty-title {
  margin: 0;
  color: #d7deea;
  font-weight: 700;
}

.popup-empty-sub {
  margin: 6px 0 0;
  color: #9ca5b4;
  font-size: 12px;
}

@media (max-width: 1100px) {
  .content-layout {
    grid-template-columns: 280px 1fr;
  }

  .intro-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .mini-player {
    position: static;
  }

  .search-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .title {
    letter-spacing: 0;
    font-size: clamp(28px, 8vw, 36px);
  }

  .pink-body {
    padding: 12px;
  }

  .content-layout {
    width: min(1240px, 97vw);
    gap: 12px;
  }

  .song-item {
    grid-template-columns: 48px 1fr auto;
    gap: 8px;
    padding: 7px;
  }

  .song-cover {
    width: 48px;
    height: 48px;
  }
}
</style>
