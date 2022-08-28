import { default as Redis } from 'ioredis'

class RedisClient extends Redis {
  constructor(redisUrl: string) {
    super(redisUrl)
  }
}

export const redis = new RedisClient(process.env.REDIS_URL || '')
