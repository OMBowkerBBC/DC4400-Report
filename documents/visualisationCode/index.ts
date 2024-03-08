import inquirer from 'inquirer'

import CloudWatchLogsHelper from './cloudWatchLogsHelper'
import LogParser from './logParser'
import reporter from './reporter'

const sleep = (ms: number): any => new Promise((resolve) => setTimeout(resolve, ms))

const getLatestLogs = async (): Promise<void> => {
  const { environment } = await inquirer.prompt({
    name: 'environment',
    type: 'list',
    message: 'What environment do you want to get logs on?\n',
    choices: ['int', 'test', 'live']
  })

  const cloudwatchLogsHelper = new CloudWatchLogsHelper(environment)
  const logs = await cloudwatchLogsHelper.getLatestLogs()
  if (logs === undefined) {
    reporter.reportError('Unable to retrieve logs')
    process.exit(1)
  }

  const logParser = new LogParser(logs)
  const parsedLogs = logParser.parseLogs()
  reporter.reportInfo(`Got latest logs on ${environment as string}`)

  for (const stream of parsedLogs) {
    await sleep(500)
    reporter.reportStream(stream)
  }

  reporter.reportStats('Finished')
}

process.on('SIGINT', () => {
  reporter.reportStats('Stopped')
  process.exit(1)
})

getLatestLogs().then(() => { console.log('Finished') }).catch(e => { console.error(e) })

export default getLatestLogs
