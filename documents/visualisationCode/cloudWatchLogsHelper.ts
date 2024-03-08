import { CloudWatchLogsClient, GetLogEventsCommand, DescribeLogStreamsCommand } from '@aws-sdk/client-cloudwatch-logs'
import type { OutputLogEvent } from '@aws-sdk/client-cloudwatch-logs'

export default class CloudWatchLogsHelper {
  #client: CloudWatchLogsClient
  logGroupName: string

  constructor (environment: string) {
    this.#client = new CloudWatchLogsClient({ region: 'region' })
    this.logGroupName = `/aws/lambda/${environment}-lambda-name`
  }

  async #getLogNameForLogGroup (): Promise<string | undefined> {
    const command = new DescribeLogStreamsCommand({ logGroupName: this.logGroupName, descending: true })
    const response = await this.#client.send(command)

    let streamInfo = { streamName: '', creationTime: 0 }
    response?.logStreams?.forEach(stream => {
      if (stream.logStreamName !== undefined && stream.creationTime !== undefined) {
        if (stream.creationTime > streamInfo.creationTime) streamInfo = { streamName: stream.logStreamName, creationTime: stream.creationTime }
      }
    })

    return streamInfo.streamName
  }

  async getLatestLogs (): Promise<OutputLogEvent[] | undefined> {
    const streamName = await this.#getLogNameForLogGroup()
    console.log(streamName)

    const command = new GetLogEventsCommand({ logGroupName: this.logGroupName, logStreamName: streamName })
    const response = await this.#client.send(command)

    return response.events
  }
}
