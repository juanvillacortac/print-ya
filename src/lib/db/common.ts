import Prisma, * as PrismaAll from '@prisma/client'
const PrismaClient = Prisma?.PrismaClient || PrismaAll?.PrismaClient

export const prisma = new PrismaClient({
  errorFormat: 'pretty',
  rejectOnNotFound: false,
})

export function ErrorHandler(e: {
  stdout?
  message?: string
  status?: number
  name?: string
  error?: string
}): {
  status: number
  body: { message: string; error: string | null | undefined }
} {
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
  if (
    truncatedError instanceof PrismaAll.Prisma.PrismaClientKnownRequestError
  ) {
    if (truncatedError?.code === 'P2002') {
      payload.body.message = 'Already exists. Choose another name.'
    }
  }
  console.log(payload)
  return payload
}

export const slugify = (s: string) =>
  s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') //remove diacritics
    .toLowerCase()
    .replace(/\s+/g, '-') //spaces to dashes
    .replace(/&/g, '-and-') //ampersand to and
    .replace(/[^\w\-]+/g, '') //remove non-words
    .replace(/\-\-+/g, '-') //collapse multiple dashes
    .replace(/^-+/, '') //trim starting dash
    .replace(/-+$/, '') //trim ending dash
