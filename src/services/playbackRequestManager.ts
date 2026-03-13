import type { SongResult } from '../types/music'

type RequestStatus = 'pending' | 'active' | 'completed' | 'cancelled' | 'failed'

interface PlaybackRequest {
  id: string
  song: SongResult
  status: RequestStatus
  timestamp: number
  abortController: AbortController
}

class PlaybackRequestManager {
  private currentRequestId: string | null = null
  private requestMap = new Map<string, PlaybackRequest>()
  private requestCounter = 0

  private createId() {
    this.requestCounter += 1
    return `playback_${Date.now()}_${this.requestCounter}`
  }

  createRequest(song: SongResult) {
    this.cancelAllRequests()
    const id = this.createId()
    const request: PlaybackRequest = {
      id,
      song,
      status: 'pending',
      timestamp: Date.now(),
      abortController: new AbortController()
    }
    this.requestMap.set(id, request)
    this.currentRequestId = id
    return id
  }

  activateRequest(requestId: string) {
    const request = this.requestMap.get(requestId)
    if (!request) return false
    if (request.status === 'cancelled') return false
    request.status = 'active'
    return true
  }

  completeRequest(requestId: string) {
    const request = this.requestMap.get(requestId)
    if (!request) return
    request.status = 'completed'
    this.cleanupOldRequests()
  }

  failRequest(requestId: string) {
    const request = this.requestMap.get(requestId)
    if (!request) return
    request.status = 'failed'
  }

  cancelRequest(requestId: string) {
    const request = this.requestMap.get(requestId)
    if (!request) return
    if (request.status === 'cancelled') return
    if (!request.abortController.signal.aborted) {
      request.abortController.abort()
    }
    request.status = 'cancelled'
    if (this.currentRequestId === requestId) {
      this.currentRequestId = null
    }
  }

  cancelAllRequests() {
    this.requestMap.forEach((request) => {
      if (request.status !== 'completed' && request.status !== 'cancelled') {
        this.cancelRequest(request.id)
      }
    })
  }

  isRequestValid(requestId: string) {
    if (this.currentRequestId !== requestId) return false
    const request = this.requestMap.get(requestId)
    if (!request) return false
    return request.status !== 'cancelled'
  }

  getAbortSignal(requestId: string) {
    return this.requestMap.get(requestId)?.abortController.signal
  }

  private cleanupOldRequests() {
    if (this.requestMap.size <= 3) return
    const sorted = Array.from(this.requestMap.values()).sort((a, b) => b.timestamp - a.timestamp)
    const keep = new Set(sorted.slice(0, 3).map((item) => item.id))
    this.requestMap.forEach((_, id) => {
      if (!keep.has(id)) {
        this.requestMap.delete(id)
      }
    })
  }
}

export const playbackRequestManager = new PlaybackRequestManager()
