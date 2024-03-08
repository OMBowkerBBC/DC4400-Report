export type UpdateType = 'episode' | 'ancestor' | 'schedule'

export interface NotificationTypes {
  updates: number
  ignores: number
  deletes: number
  hydrated: number
}

export interface EventDetail {
  type: UpdateType
  eventType: string
  id: string
  updated: boolean
  hydrated?: boolean
}

export interface SortedStream {
  startTime: number
  endTime: number
  events: string[]
}

export interface StreamDetail { streamId: string, startTimestamp: number, eventDetails: EventDetail[] }
