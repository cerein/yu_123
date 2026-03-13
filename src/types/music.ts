export interface IWordData {
  text: string;
  startTime: number;
  duration: number;
  space?: boolean;
}

export interface ILyricText {
  text: string;
  trText: string;
  words?: IWordData[];
  hasWordByWord?: boolean;
  startTime?: number;
  duration?: number;
}

export interface ILyric {
  lrcTimeArray: number[];
  lrcArray: ILyricText[];
  hasWordByWord?: boolean;
}

export interface Artist {
  id: number | string;
  name: string;
  picUrl?: string;
  img1v1Url?: string;
}

export interface Album {
  id: number | string;
  name: string;
  picUrl: string;
}

export interface SongResult {
  id: string | number;
  name: string;
  picUrl: string;
  ar: Artist[]; // Artists
  al: Album; // Album
  playMusicUrl?: string; // The audio URL
  lyric?: ILyric;
  dt?: number; // Duration in ms
}
