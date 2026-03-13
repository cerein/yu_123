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

export const searchMusic = async (keyword: string): Promise<SongResult[]> => {
  const normalized = keyword.trim().toLowerCase()
  if (!normalized) {
    return demoSongs
  }

  return demoSongs.filter((song) => {
    const artist = song.ar.map((item) => item.name).join(' ').toLowerCase()
    const album = song.al.name.toLowerCase()
    const name = song.name.toLowerCase()
    return artist.includes(normalized) || album.includes(normalized) || name.includes(normalized)
  })
}

export const getMusicUrl = async (id: number | string): Promise<string> => {
  const target = demoSongs.find((item) => item.id === id)
  return target?.playMusicUrl ?? ''
}

export const getLyric = async (id: number | string): Promise<ILyric> => {
  const key = String(id)
  return (
    lyricMap[key] ?? {
      lrcTimeArray: [0],
      lrcArray: [{ text: '纯音乐，请静静聆听。', trText: 'Instrumental, enjoy the moment.', startTime: 0, duration: 5000 }]
    }
  )
}
