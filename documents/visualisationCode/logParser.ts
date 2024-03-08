import type { OutputLogEvent } from '@aws-sdk/client-cloudwatch-logs'
import type { StreamDetail, EventDetail, UpdateType, SortedStream } from './types'

const logLocators = {
  updateMessage: /Got Update event for (.*?) (.*)/, // [message, type, pid/sid]
  deleteMessage: /Got Delete event for (.*?) (.*)/, // [message, type, pid/sid]
  scheduleUpdatedRegex: /Service schedule (.*) updated/
}

const requestIdRegex = /(?<=RequestId:\s)([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/

export default class LogParser {
  logs: OutputLogEvent[]

  constructor (logs: OutputLogEvent[]) {
    this.logs = logs
  }

  #getRequestId (message: string): string | null {
    const result = message.match(requestIdRegex)
    return result === null ? null : result[0]
  }

  #sortLogsIntoMessageStreams (logs: OutputLogEvent[]): Record<string, SortedStream> {
    const eventStreams: Record<string, SortedStream> = {}

    let currentStreamId = ''
    for (const event of logs) {
      if (event.message === undefined) continue // Sometimes Typescript and Eslint suck
      if (event.message.includes('INFO')) continue // Ignore metric logs

      const requestId = this.#getRequestId(event.message)
      if (requestId !== null && event.message.startsWith('START')) {
        eventStreams[requestId] = { events: [], startTime: event.timestamp as number, endTime: 0 }
        currentStreamId = requestId
      } else if (requestId !== null && eventStreams[requestId] !== undefined && event.message.startsWith('END')) {
        eventStreams[requestId].endTime = event.timestamp as number
        currentStreamId = ''
      } else Object.keys(eventStreams).includes(currentStreamId) && eventStreams[currentStreamId].events.push(event.message)
    }

    // Remove final stream if no END message was received
    if (currentStreamId !== '') {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete eventStreams[currentStreamId]
    }

    return eventStreams
  }

  #handleMultipleUpdateNotification (stream: string[]): EventDetail[] {
    const pids = stream.filter(event => event.includes('Got Update event for'))
      .map(item => {
        const match = item.match(logLocators.updateMessage)
        return match !== null ? { type: match[1], id: match[2] } : { type: '', id: '' }
      }).filter(item => item.type !== '')

    const eventDetails = pids.map(({ type, id }) => this.#determineEventDetailsValues(type as UpdateType, id, 'update', stream.filter(event => event.includes(id))))
    return eventDetails
  }

  #determineEventDetailsValues = (type: UpdateType, id: string, eventType: string, stream: string[]): EventDetail => {
    const eventDetail: EventDetail = { type, id, eventType, updated: true }

    if (eventType === 'update') {
      eventDetail.updated = type === 'schedule'
        ? stream.filter(event => event.match(logLocators.scheduleUpdatedRegex)).length > 0
        : !stream.some(event => event.includes('Ignore Update event'))
    }

    if (type === 'episode') eventDetail.hydrated = stream.some(event => event.includes('hydrated'))

    return eventDetail
  }

  parseLogs (): StreamDetail[] {
    const sortedLogs = this.#sortLogsIntoMessageStreams(this.logs)
    const streamDetails: StreamDetail[] = []

    for (const eventStream of Object.keys(sortedLogs)) {
      const stream = sortedLogs[eventStream]

      let eventType = 'update'
      const updateLogs = stream.events.filter(event => event.includes('Got Update event for'))

      // Multiple updates in single notification
      if (updateLogs.length > 1) {
        const eventDetails = this.#handleMultipleUpdateNotification(stream.events)
        streamDetails.push({ streamId: eventStream, eventDetails, startTimestamp: stream.startTime })
        continue
      }

      let eventTypeDeterminingLog = updateLogs[0]

      if (eventTypeDeterminingLog === undefined) {
        [eventTypeDeterminingLog] = stream.events.filter(event => event.includes('Got Delete event for'))
        eventType = 'delete'
      }

      const result = eventTypeDeterminingLog.match(logLocators[eventType === 'update' ? 'updateMessage' : 'deleteMessage'])
      if (result !== null) {
        const [, type, id] = result
        const eventDetail = this.#determineEventDetailsValues(type.toLowerCase() as UpdateType, id, eventType, stream.events)
        streamDetails.push({ streamId: eventStream, startTimestamp: stream.startTime, eventDetails: [eventDetail] })
      }
    }

    return streamDetails
  }
}
