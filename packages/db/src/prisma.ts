import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient({
  errorFormat: 'pretty',
  rejectOnNotFound: false,
})
export { Prisma } from '@prisma/client'
