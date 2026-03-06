import type { ProgressEvent } from './types'

type ProgressCallback = (event: ProgressEvent) => void

let ws: WebSocket | null = null
let listeners: ProgressCallback[] = []

export function connectProgress(onEvent: ProgressCallback): () => void {
  listeners.push(onEvent)

  if (!ws || ws.readyState === WebSocket.CLOSED) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/ws/progress`
    ws = new WebSocket(wsUrl)

    ws.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data)
        listeners.forEach((cb) => cb(data))
      } catch {
        // ignore malformed messages
      }
    }

    ws.onclose = () => {
      ws = null
    }
  }

  return () => {
    listeners = listeners.filter((cb) => cb !== onEvent)
    if (listeners.length === 0 && ws) {
      ws.close()
      ws = null
    }
  }
}
