import pkg, { PrismaClient } from '@prisma/client'
import { dev } from '$app/env'

declare global {
  var _prisma: PrismaClient // eslint-disable-line
}

let _prisma
if (dev) {
  if (!global._prisma) {
    global._prisma = new PrismaClient({
      errorFormat: 'pretty',
      rejectOnNotFound: false,
    })
  }
  _prisma = global._prisma
} else {
  const { PrismaClient: PrismaClientProd } = pkg
  _prisma = new PrismaClientProd({
    errorFormat: 'pretty',
    rejectOnNotFound: false,
  })
}

export const prisma: PrismaClient = _prisma

export function ErrorHandler(e: {
  stdout?
  message?: string
  status?: number
  name?: string
  error?: string
}): { status: number; body: { message: string; error: string } } {
  if (e && e instanceof Error) {
    e = new Error(e.toString())
  }
  let truncatedError = e
  if (e.stdout) {
    truncatedError = e.stdout
  }
  const payload = {
    status: truncatedError.status || 500,
    body: {
      message: 'Ooops, something is not okay, are you okay?',
      error: truncatedError.error || truncatedError.message,
    },
  }
  console.log(payload.body.error)
  if (truncatedError?.name === 'NotFoundError') {
    payload.status = 404
  }
  if (truncatedError instanceof pkg.Prisma.PrismaClientKnownRequestError) {
    if (truncatedError?.code === 'P2002') {
      payload.body.message = 'Already exists. Choose another name.'
    }
  }
  return payload
}
