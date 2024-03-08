import * as p from '@clack/prompts'
import chalk from 'chalk'

import type { UpdateType, NotificationTypes, StreamDetail } from './types'

class Reporter {
  notifications: Record<UpdateType, NotificationTypes>

  constructor () {
    const notificationFields = { deletes: 0, updates: 0, ignores: 0, hydrated: 0 }
    this.notifications = {
      episode: structuredClone(notificationFields),
      ancestor: structuredClone(notificationFields),
      schedule: structuredClone(notificationFields)
    }
  }

  reportStats (exitReason: string): void {
    p.note(chalk.hex('#ED7100')(` ${exitReason} Log Processing \n
      ${chalk.greenBright(`Episode updates (${this.notifications.episode.updates}), ignored (${this.notifications.episode.ignores}), hydrated (${this.notifications.episode.hydrated})`)}
      ${chalk.blueBright(`Ancestor updates (${this.notifications.ancestor.updates}), ignored (${this.notifications.ancestor.ignores})`)}
      ${chalk.yellowBright(`Schedule updates (${this.notifications.schedule.updates}), ignored (${this.notifications.schedule.ignores}), deletes (${this.notifications.schedule.deletes})`)}
  `))
  }

  reportStream (stream: StreamDetail): void {
    this.#reportStream(stream.streamId, stream.startTimestamp, stream.eventDetails.length)
    stream.eventDetails.forEach(event => {
      if (event.eventType === 'update') {
        event.updated
          ? this.#reportUpdated(`  ✅ ${event.type} ${event.id} ${Boolean(event?.hydrated) ? 'hydrated 💧' : 'updated'}.`)
          : this.#reportIgnored(`  ${event.type} ${event.id} not updated.`)

        this.notifications[event.type][event.updated ? 'updates' : 'ignores'] += 1
        if (Boolean(event.hydrated)) this.notifications.episode.hydrated += 1
      } else {
        this.#reportDeleted(`  ❌ ${event.type} ${event.id} deleted.`)
        this.notifications.schedule.deletes += 1
      }
    })
  }

  reportError (message: string): void { console.error(chalk.redBright(message)) }
  reportInfo (message: string): void { console.error(chalk.cyan(message)) }

  #reportUpdated (message: string): void { console.error(chalk.green(message)) }
  #reportIgnored (message: string): void { console.error(chalk.gray(message)) }
  #reportDeleted (message: string): void { console.error(chalk.gray(message)) }

  #padTime (num: number): string { return num < 10 ? `0${num}` : num.toString() }
  #formatTimestamp (timestamp: number): string {
    const timestampDate = new Date(timestamp)
    const isToday = new Date().toLocaleDateString() === timestampDate.toLocaleDateString()
    const time = `${this.#padTime(timestampDate.getHours())}:${this.#padTime(timestampDate.getMinutes())}:${this.#padTime(timestampDate.getSeconds())}:${this.#padTime(timestampDate.getMilliseconds())}`
    return `${isToday ? 'Today' : timestampDate.toLocaleDateString()} at ${time}`
  }

  #reportStream (id: string, timestamp: number, items: number): void {
    console.log(chalk.white(this.#formatTimestamp(timestamp)), chalk.cyan(`\n 🗒️ Notification stream ${id}`), chalk.gray(`${items} items(s)`))
  }
}

const reporter = new Reporter()
export default reporter
