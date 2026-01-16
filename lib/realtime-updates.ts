export interface RealtimeSubscription {
  unsubscribe: () => void
}

export interface RealtimeMessage {
  type: "post" | "comment" | "like" | "contest" | "leaderboard" | "admin-update"
  timestamp: number
  data: any
}

// Simulated real-time system (would connect to Supabase Realtime in production)
class RealtimeManager {
  private subscribers: Map<string, Set<(message: RealtimeMessage) => void>> = new Map()
  private messageBuffer: RealtimeMessage[] = []

  subscribe(channel: string, callback: (message: RealtimeMessage) => void): RealtimeSubscription {
    if (!this.subscribers.has(channel)) {
      this.subscribers.set(channel, new Set())
    }
    this.subscribers.get(channel)!.add(callback)

    return {
      unsubscribe: () => {
        const subs = this.subscribers.get(channel)
        if (subs) {
          subs.delete(callback)
          if (subs.size === 0) {
            this.subscribers.delete(channel)
          }
        }
      },
    }
  }

  broadcast(channel: string, message: Omit<RealtimeMessage, "timestamp">): void {
    const fullMessage: RealtimeMessage = {
      ...message,
      timestamp: Date.now(),
    }

    this.messageBuffer.push(fullMessage)
    if (this.messageBuffer.length > 1000) {
      this.messageBuffer = this.messageBuffer.slice(-500)
    }

    const subscribers = this.subscribers.get(channel)
    if (subscribers) {
      subscribers.forEach((callback) => {
        // Use setTimeout to simulate network delay
        setTimeout(() => callback(fullMessage), Math.random() * 100)
      })
    }
  }

  getBuffer(channel: string): RealtimeMessage[] {
    return this.messageBuffer.filter((msg) => msg.type.includes(channel))
  }
}

export const realtimeManager = new RealtimeManager()

export default realtimeManager
