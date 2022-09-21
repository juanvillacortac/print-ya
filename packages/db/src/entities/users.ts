import { prisma } from 'src/prisma.js'
import bcrypt from 'bcryptjs'
import { utils } from '@shackcart/shared'
import type { User } from 'src/types.js'

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 15
  return bcrypt.hash(password, saltRounds)
}

export async function updateUserPassword({
  email,
  newPassword,
}: Record<'email' | 'newPassword', string>) {
  await prisma.user.update({
    where: { email },
    data: {
      password: await hashPassword(newPassword),
    },
  })
}

export async function login({
  email,
  password,
  isLogin,
}: {
  email: string
  password: string
  isLogin: boolean
}): Promise<{
  status: number
  headers: { 'Set-Cookie': string }
  body: { userId: string }
}> {
  const userFound = await prisma.user.findUnique({
    where: { email },
    rejectOnNotFound: false,
  })
  if (!userFound && isLogin) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  let uid: string | null = null

  if (userFound) {
    const passwordMatch = await bcrypt.compare(password, userFound.password!)
    if (!passwordMatch) {
      throw {
        error: 'Wrong password or email address.',
      }
    }
    uid = userFound.id
  } else if (!isLogin) {
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    })
    let slug = utils.slugify('Labelshut')
    const coincidences = await prisma.store.findMany({
      where: {
        slug: {
          startsWith: slug,
        },
      },
    })
    if (coincidences.length) {
      slug = `${slug}-${coincidences.length}`
    }
    const store = await prisma.store.create({
      data: {
        slug,
        logo: 'http://labelshut.com/wp-content/uploads/2022/03/145px.png',
        favicon: 'http://labelshut.com/wp-content/uploads/2022/03/145px.png',
        name: 'Labelshut',
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    })
    uid = user.id
  }

  if (!uid) {
    throw {
      error: 'Wrong password or email address.',
    }
  }

  return {
    status: 200,
    headers: {
      'Set-Cookie': `teamId=${uid}; HttpOnly; Path=/; Max-Age=15778800;`,
    },
    body: {
      userId: uid,
    },
  }
}

export async function getUser({
  userId,
}: {
  userId: string
}): Promise<User | null> {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      createdAt: true,
      id: true,
      updatedAt: true,
    },
  })
}
