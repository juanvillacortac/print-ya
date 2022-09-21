import { prisma } from 'src/prisma.js'
import { nanoid } from 'nanoid'
import type { Order, Overwrite, StripedOrder } from 'src/types.js'

export const getOrder = (
  orderId: string,
  token?: string
): Promise<Order | null> =>
  prisma.order.findFirst({
    where: {
      id: orderId,
      token,
    },
    include: {
      customer: true,
      fees: {
        select: {
          name: true,
          fixed: true,
          percentage: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              group: true,
            },
          },
        },
      },
    },
  }) as Promise<Order | null>

export const getOrdersByStore = async ({
  storeId,
  filter,
  orderBy = {
    createdAt: 'desc',
  },
}: {
  storeId: string
  filter?: {
    id?: string
    customerId?: string
    status?: Order['status'][]
    fulfillmentStatus?: Order['fulfillmentStatus'][]
  }
  orderBy?: {
    id?: 'desc' | 'asc'
    createdAt?: 'desc' | 'asc'
    total?: 'desc' | 'asc'
  }
}): Promise<StripedOrder[]> =>
  prisma.order.findMany({
    where: {
      storeId,
      customerId: filter?.customerId,
      id: filter?.id
        ? {
            startsWith: filter.id,
          }
        : undefined,
      status: filter?.status
        ? {
            in: filter.status,
          }
        : undefined,
      fulfillmentStatus: filter?.fulfillmentStatus
        ? {
            in: filter.fulfillmentStatus,
          }
        : undefined,
    },
    include: {
      customer: true,
      fees: {
        select: {
          name: true,
          fixed: true,
          percentage: true,
        },
      },
      items: true,
    },
    orderBy,
  }) as Promise<StripedOrder[]>

export const createOrder = async ({
  order,
  storeId,
}: {
  order: Overwrite<
    Omit<
      Order,
      'id' | 'createdAt' | 'storeId' | 'total' | 'customer' | 'token'
    >,
    {
      fulfillmentStatus?: Order['fulfillmentStatus']
      paymentMethods?: string[]
      items: {
        cost: number
        basePrice: number
        productId: string
        modifiers?: any | null
        quantity: number
      }[]
    }
  >
  storeId: string
}): Promise<Order> =>
  prisma.order.create({
    data: {
      storeId,
      id: nanoid(8),
      customerId: order.customerId,
      billingData: order.billingData,
      paymentMethods: order.paymentMethods || [],
      total: order.items.map((i) => i.cost || 0).reduce((a, b) => a + b, 0),
      fees: {
        createMany: {
          data: order.fees.map((f) => ({
            percentage: f.percentage,
            fixed: f.fixed,
            name: f.name,
          })),
        },
      },
      items: {
        createMany: {
          data: order.items.map((i) => ({
            modifiers: i.modifiers || {},
            productId: i.productId,
            cost: i.cost,
            basePrice: i.basePrice,
            quantity: i.quantity,
          })),
        },
      },
    },
    include: {
      customer: true,
      fees: {
        select: {
          name: true,
          fixed: true,
          percentage: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              group: true,
            },
          },
        },
      },
    },
  }) as unknown as Promise<Order>

export const updateOrder = async (
  order: Overwrite<
    Partial<Omit<Order, 'createdAt' | 'storeId'>>,
    {
      id: string
      paymentMethods?: string[]
      fees?: Order['fees']
      fulfillmentStatus?: Order['fulfillmentStatus']
      items?: {
        productId: string
        modifiers?: any | null
        fulfilled?: number
        cost: number
        basePrice: number
        quantity: number
      }[]
    }
  >
): Promise<Order | null> => {
  const transactions = [
    ...(order.fees
      ? [
          prisma.orderFee.deleteMany({
            where: {
              orderId: order.id,
            },
          }),
        ]
      : []),
    ...(order.items
      ? [
          prisma.orderItem.deleteMany({
            where: {
              orderId: order.id,
            },
          }),
        ]
      : []),
  ]
  if (transactions.length) {
    await prisma.$transaction(transactions)
  }
  const original = await prisma.order.findUnique({
    where: {
      id: order.id,
    },
    select: {
      billingData: true,
      shippingData: true,
    },
  })
  const updated = await prisma.order.update({
    where: {
      id: order.id,
    },
    data: {
      paymentMethods: order.paymentMethods,
      status: order.status,
      token: order.token,
      billingData: order.billingData
        ? {
            ...((original?.billingData as any) || {}),
            ...order.billingData,
          }
        : undefined,
      shippingData: order.shippingData
        ? {
            ...((original?.shippingData as any) || {}),
            ...order.shippingData,
          }
        : undefined,
      total: order.items
        ? order.items.map((i) => i.cost || 0).reduce((a, b) => a + b, 0)
        : undefined,
      fees: order.fees
        ? {
            createMany: {
              data: order.fees.map((f) => ({
                percentage: f.percentage,
                fixed: f.fixed,
                name: f.name,
              })),
            },
          }
        : undefined,
      fulfillmentStatus: order.fulfillmentStatus,
      items: order.items
        ? {
            createMany: {
              data: order.items.map((i) => ({
                modifiers: i.modifiers || {},
                productId: i.productId,
                fulfilled: i.fulfilled,
                cost: i.cost,
                basePrice: i.basePrice,
                quantity: i.quantity,
              })),
            },
          }
        : undefined,
    },
    include: {
      customer: true,
      fees: {
        select: {
          name: true,
          fixed: true,
          percentage: true,
        },
      },
      items: {
        include: {
          product: {
            include: {
              group: true,
            },
          },
        },
      },
    },
  })
  return updated as unknown as Order
}
