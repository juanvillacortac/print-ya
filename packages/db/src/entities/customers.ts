import { Prisma, prisma } from 'src/prisma.js'
import bcrypt from 'bcryptjs'
import type { Customer } from 'src/types.js'

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15
  return bcrypt.hash(password, saltRounds)
}

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export async function getCustomers({
  storeId,
  filter,
  orderBy = {
    createdAt: 'desc',
  },
  page = 1,
  pageSize = 20,
}: {
  storeId: string
  filter?: {
    name?: string
    email?: string
  }
  orderBy?: {
    id?: 'desc' | 'asc'
    firstName?: 'desc' | 'asc'
    lastName?: 'desc' | 'asc'
    email?: 'desc' | 'asc'
    createdAt?: 'desc' | 'asc'
  }
  page?: number
  pageSize?: number
}) {
  const segments = filter?.name?.split(' ') || []
  const isFullSearch = segments.length > 1
  const where: Prisma.CustomerWhereInput = {
    storeId,
    email: filter?.email
      ? {
          contains: filter.email,
        }
      : undefined,
    OR: filter?.name
      ? [
          {
            id: {
              startsWith: filter.name,
            },
          },
          {
            email: {
              startsWith: filter.name,
            },
          },
          {
            firstName: {
              startsWith: isFullSearch ? segments[0] : filter.name,
            },
          },
          {
            lastName: {
              startsWith: isFullSearch ? segments[1] : filter.name,
            },
          },
        ]
      : undefined,
  }
  const [count, customers] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy,
      take: pageSize,
      skip: pageSize * Math.max(page - 1, 0),
      include: {
        _count: {
          select: {
            orders: true,
          },
        },
      },
    }),
  ])
  return { count, customers }
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

export async function modifyCustomer({
  id,
  firstName,
  lastName,
  email,
  phoneNumber,
  currency,
}: Overwrite<
  Partial<Omit<Customer, 'storeId'>>,
  {
    id: string
  }
>): Promise<Customer> {
  const customerFound = await prisma.customer.findFirst({
    where: {
      email,
      id: {
        not: id,
      },
    },
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

  const customer = await prisma.customer.update({
    data: {
      email,
      firstName,
      lastName,
      currency,
      phoneNumber,
    },
    where: {
      id,
    },
  })

  return customer
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
