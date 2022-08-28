import BeeQueue from 'bee-queue'
import { redis } from 'src/redis.js'

const queue = new BeeQueue<undefined | null | never | void>('test', {
  redis,
})

queue.process(async (job) => {
  await new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, 20000)
  })
})

export const testQueue = async () => {
  const job = queue.createJob(undefined)
  job.on('succeeded', () => {
    console.log(`Message was sent.`)
  })
  await job.save()
}
