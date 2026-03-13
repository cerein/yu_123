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
            <button class="mode-btn" @click="showLyrics = !showLyrics">{{ showLyrics ? '歌曲列表' : '歌词面板' }}</button>
            <button class="mode-btn" @click="togglePlaybackRate">{{ playbackRateLabel }}</button>
          </div>
          <audio ref="audioPlayer" @timeupdate="updateTime" @ended="handleEnded" @loadedmetadata="handleLoadedMeta"></audio>
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
          <div class="pink-head">个人简介</div>
          <div class="pink-body intro-row">
            <p>
              这是一个把个人主页和音乐播放器融合在一起的纯前端页面。播放器核心交互参考了 AlgerMusicPlayer，
              保留了播放控制、列表管理、歌词同步、播放模式和本地歌单持久化。
            </p>
            <img class="intro-cover" :src="currentSong?.al.picUrl || 'https://picsum.photos/seed/card/280/170'" alt="cover">
          </div>
        </article>
        <article class="pink-card">
          <div class="pink-head with-heart">兴趣爱好 <span>❤</span></div>
          <div class="pink-body">
            <p>
              我喜欢在写代码和写作时听音乐，希望这个页面既有复古个人主页的观感，也有现代播放器的体验。
              你可以直接搜索示例歌曲，或者导入本地音乐文件立刻播放。
            </p>
          </div>
        </article>
        <article class="pink-card">
          <div class="pink-head">音乐列表</div>
          <div class="pink-body">
            <div class="search-row">
              <input
                v-model.trim="searchQuery"
                class="search-input"
                placeholder="搜索歌曲 / 歌手 / 专辑"
                @keyup.enter="search"
              >
              <button class="search-btn" @click="search">搜索</button>
            </div>
            <div v-if="!showLyrics" class="list-wrap">
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
            <div v-else class="lyric-wrap">
              <p
                v-for="(line, index) in lyrics?.lrcArray || []"
                :key="`${line.text}-${index}`"
                class="lyric-line"
                :class="{ on: currentLyricIndex === index }"
              >
                {{ line.text }}
                <span v-if="line.trText">{{ line.trText }}</span>
              </p>
              <p v-if="!lyrics || lyrics.lrcArray.length === 0" class="empty-tip">暂无歌词</p>
            </div>
          </div>
        </article>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getLyric, getMusicUrl, searchMusic } from '../api/music'
import { playbackRequestManager } from '../services/playbackRequestManager'
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

const audioPlayer = ref<HTMLAudioElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const searchQuery = ref('')
const songs = ref<SongResult[]>([])
const currentSong = ref<SongResult | null>(null)
const lyrics = ref<ILyric | null>(null)
const currentLyricIndex = ref(0)
const showLyrics = ref(false)
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

const currentSongId = computed(() => (currentSong.value ? String(currentSong.value.id) : ''))
const isCurrentFavorite = computed(() => favoriteIds.value.includes(currentSongId.value))

const playModeLabel = computed(() => {
  if (playMode.value === 'loop') return '列表循环'
  if (playMode.value === 'single') return '单曲循环'
  return '随机播放'
})

const playbackRateLabel = computed(() => `${playbackRate.value.toFixed(1)}x`)

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
}

const markHistory = (songId: string) => {
  historyIds.value = historyIds.value.filter((id) => id !== songId)
  historyIds.value.push(songId)
  persistHistory()
}

const search = async () => {
  songs.value = await searchMusic(searchQuery.value)
}

const canTriggerAction = () => {
  const now = Date.now()
  if (now - lastActionAt.value < 220) return false
  lastActionAt.value = now
  return true
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

const playSong = async (song: SongResult) => {
  const player = audioPlayer.value
  if (!player) return

  if (currentSong.value?.id === song.id) {
    togglePlay()
    return
  }

  const requestId = playbackRequestManager.createRequest(song)
  if (!playbackRequestManager.activateRequest(requestId)) return
  const signal = playbackRequestManager.getAbortSignal(requestId)

  currentSong.value = song
  lyrics.value = null
  currentLyricIndex.value = 0
  userPlayIntent.value = true

  try {
    const url = song.playMusicUrl || (await getMusicUrl(song.id))
    if (signal?.aborted || !playbackRequestManager.isRequestValid(requestId)) return
    player.src = url
    player.playbackRate = playbackRate.value

    const saved = localStorage.getItem(PROGRESS_KEY)
    if (saved) {
      const { songId, progress } = JSON.parse(saved) as { songId: string; progress: number }
      if (songId === String(song.id) && Number.isFinite(progress) && progress > 0) {
        player.currentTime = progress
      }
    }

    await player.play()
    if (signal?.aborted || !playbackRequestManager.isRequestValid(requestId)) return
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

    const lrc = await getLyric(song.id)
    if (signal?.aborted || !playbackRequestManager.isRequestValid(requestId)) return
    lyrics.value = lrc
    playbackRequestManager.completeRequest(requestId)
  } catch {
    playbackRequestManager.failRequest(requestId)
  }
}

const togglePlay = async () => {
  const player = audioPlayer.value
  if (!player || !currentSong.value) return
  if (player.paused) {
    await player.play()
    isPlaying.value = true
    userPlayIntent.value = true
  } else {
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

const handleLoadedMeta = () => {
  if (!audioPlayer.value) return
  duration.value = Number.isFinite(audioPlayer.value.duration) ? audioPlayer.value.duration : 0
}

const updateTime = () => {
  if (!audioPlayer.value) return
  currentTime.value = audioPlayer.value.currentTime
  duration.value = Number.isFinite(audioPlayer.value.duration) ? audioPlayer.value.duration : 0
  const now = Date.now()
  if (currentSong.value && now - lastProgressSaveAt.value > 1000) {
    lastProgressSaveAt.value = now
    localStorage.setItem(
      PROGRESS_KEY,
      JSON.stringify({ songId: String(currentSong.value.id), progress: currentTime.value })
    )
  }
  if (!lyrics.value) return
  const matched = lyrics.value.lrcArray.findIndex((line, index) => {
    const current = line.startTime ?? 0
    const next = lyrics.value?.lrcArray[index + 1]?.startTime
    if (next === undefined) {
      return currentTime.value * 1000 >= current
    }
    return currentTime.value * 1000 >= current && currentTime.value * 1000 < next
  })
  if (matched >= 0) {
    currentLyricIndex.value = matched
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

watch(showTab, () => {
  showLyrics.value = false
})

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
  await search()
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
</script>

<style scoped>
.page-shell {
  min-height: 100vh;
  background: #ffffff;
  color: #333;
}

.top-banner {
  background: #dff6ff;
  padding: 22px 18px 10px;
  border-bottom: 1px solid #f3c3d5;
}

.welcome-tag {
  color: #b58500;
  font-weight: 700;
  font-size: 34px;
  letter-spacing: 1px;
}

.title {
  text-align: center;
  margin: 10px 0 16px;
  font-size: 48px;
  color: #fdfdfd;
  text-shadow: 2px 2px 0 #7c95aa;
}

.nav-bar {
  display: flex;
  gap: 24px;
  justify-content: center;
  font-size: 14px;
}

.nav-item {
  color: #666;
  text-decoration: none;
}

.nav-item.active {
  font-weight: 700;
}

.content-layout {
  width: min(1280px, 96vw);
  margin: 18px auto 0;
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 16px;
  align-items: start;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card {
  border: 1px solid #ffc5dc;
  border-radius: 8px;
  background: #fff;
  padding: 12px;
}

.card-title {
  font-size: 15px;
  margin-bottom: 8px;
  color: #ff5da9;
  font-weight: 700;
}

.center {
  text-align: center;
}

.sub {
  font-size: 12px;
  color: #666;
}

.timeline-row {
  display: flex;
  justify-content: space-between;
  margin: 10px 0 6px;
  font-size: 12px;
  color: #9f9f9f;
}

.pink-range {
  width: 100%;
  accent-color: #ff76bb;
}

.player-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 12px 0;
}

.icon-btn {
  border: 1px solid #ffd1e7;
  border-radius: 999px;
  width: 34px;
  height: 34px;
  background: #fff;
  color: #ff5da9;
  font-size: 16px;
}

.icon-btn.main {
  background: #ff76bb;
  color: #fff;
}

.volume-row {
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 8px;
  align-items: center;
  font-size: 12px;
  margin-bottom: 10px;
}

.mode-row {
  display: flex;
  gap: 8px;
}

.mode-btn {
  flex: 1;
  border: 1px solid #ffc6e1;
  background: #fff8fc;
  border-radius: 6px;
  padding: 6px 4px;
  color: #ff5da9;
  font-size: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.quick-btn {
  border: 1px solid #ffd3e8;
  background: #fff;
  border-radius: 6px;
  height: 34px;
  color: #ff5da9;
}

.import-btn {
  margin-top: 10px;
  width: 100%;
  border: none;
  border-radius: 6px;
  background: #ff76bb;
  color: #fff;
  height: 36px;
}

.main-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pink-card {
  border: 1px solid #ffcae2;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.pink-head {
  height: 42px;
  background: #ffc4df;
  color: #fff;
  font-weight: 700;
  display: flex;
  align-items: center;
  padding: 0 14px;
}

.with-heart {
  justify-content: space-between;
}

.pink-body {
  padding: 14px;
  font-size: 14px;
  line-height: 1.8;
}

.intro-row {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 16px;
  align-items: center;
}

.intro-cover {
  width: 100%;
  height: 170px;
  object-fit: cover;
  border-radius: 8px;
}

.search-row {
  display: grid;
  grid-template-columns: 1fr 92px;
  gap: 10px;
}

.search-input {
  border: 1px solid #ffd5e9;
  border-radius: 8px;
  height: 40px;
  padding: 0 12px;
}

.search-btn {
  border: none;
  border-radius: 8px;
  background: #ff76bb;
  color: #fff;
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
  border: 1px solid #ffe0ef;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
}

.song-item.active {
  background: #fff1f8;
  border-color: #ff95c7;
}

.song-cover {
  width: 54px;
  height: 54px;
  border-radius: 6px;
  object-fit: cover;
}

.song-name {
  font-weight: 700;
}

.song-sub {
  font-size: 12px;
  color: #7d7d7d;
}

.song-time {
  font-size: 12px;
  color: #999;
}

.lyric-wrap {
  margin-top: 12px;
  max-height: 460px;
  overflow: auto;
  padding: 8px 2px;
}

.lyric-line {
  text-align: center;
  color: #999;
  margin: 14px 0;
}

.lyric-line span {
  display: block;
  font-size: 12px;
  opacity: 0.8;
}

.lyric-line.on {
  color: #ff5da9;
  font-size: 18px;
  font-weight: 700;
}

.empty-tip {
  text-align: center;
  color: #999;
  padding: 26px 0;
}

@media (max-width: 960px) {
  .content-layout {
    grid-template-columns: 1fr;
  }

  .intro-row {
    grid-template-columns: 1fr;
  }

  .title {
    font-size: 36px;
  }
}
</style>
