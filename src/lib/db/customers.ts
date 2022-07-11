import { prisma } from './common'
import bcrypt from 'bcryptjs'
import type { RequestEvent } from '@sveltejs/kit/types/internal'
import type { Customer } from '@prisma/client'

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15
  return bcrypt.hash(password, saltRounds)
}

export async function loginCustomer({
  email,
  password,
  storeId,
}: {
  email: string
  password: string
  storeId
}): Promise<{
  status: number
  headers: { 'Set-Cookie': string }
  body: { customerId: string }
}> {
  const customerFound = await prisma.customer.findFirst({
    where: { email, storeId },
    include: {
      accounts: true,
    },
    rejectOnNotFound: false,
  })
  console.log(email, customerFound)
  if (!customerFound) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  let uid: string | null = null
  const account = customerFound?.accounts.find(
    (a) => a.provider === 'credentials'
  )?.authMeta as {
    password: string
  } | null

  if (customerFound && account) {
    const passwordMatch = await bcrypt.compare(password, account.password)
    if (!passwordMatch) {
      throw {
        error: 'Wrong password or email address.',
      }
    }
    uid = customerFound.id
  }

  if (!uid) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  return {
    status: 200,
    headers: {
      'Set-Cookie': `customerId=${uid}; HttpOnly; Path=/; Max-Age=15778800;`,
    },
    body: {
      customerId: uid,
    },
  }
}

export async function registerCustomer({
  firstName,
  lastName,
  phone,
  email,
  password,
  storeId,
}: {
  firstName: string
  lastName: string
  phone: string
  email: string
  password: string
  storeId
}): Promise<{
  status: number
  headers: { 'Set-Cookie': string }
  body: { customerId: string }
}> {
  const customerFound = await prisma.customer.findFirst({
    where: { email, storeId },
    select: {
      email: true,
    },
    rejectOnNotFound: false,
  })
  if (customerFound) {
    throw {
      error: 'Email already registered.',
    }
  }

  const customer = await prisma.customer.create({
    data: {
      email,
      firstName,
      lastName,
      phoneNumber: phone,
      store: {
        connect: {
          id: storeId,
        },
      },
      accounts: {
        create: {
          authMeta: {
            password: await hashPassword(password),
          },
          provider: 'credentials',
        },
      },
    },
  })

  return {
    status: 200,
    headers: {
      'Set-Cookie': `customerId=${customer.id}; HttpOnly; Path=/; Max-Age=15778800;`,
    },
    body: {
      customerId: customer.id,
    },
  }
}

export const getCustomerDetails = async (
  event: RequestEvent
): Promise<{
  customerId: string | null
  status: number
  body: { message: string }
}> => {
  const customerId = event?.locals?.session?.data?.customerId || null

  const payload = {
    customerId,
    status: 200,
    body: {
      message: 'OK',
    },
  }

  return payload
}

export async function getCustomer({
  customerId,
}: {
  customerId: string
}): Promise<Customer | null> {
  return await prisma.customer.findUnique({
    where: { id: customerId },
  })
}
