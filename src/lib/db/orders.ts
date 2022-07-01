import { prisma } from './common'
import type {
  Order as _Order,
  OrderFee as _OrderFee,
  OrderItem as _OrderItem,
  Product as _Product,
  ProductModifier as _ProductModifier,
  ProductModifierItem as _ProductModifierItem,
} from '@prisma/client'
import type { StripedProduct } from './products'
import type { ModifiersMap } from '$lib/utils/modifiers'
import { nanoid } from 'nanoid'

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type OrderItem = _OrderItem & {
  product: StripedProduct
}

export type OrderFee = Omit<_OrderFee, 'id' | 'orderId'>

export type Order = Overwrite<
  _Order,
  {
    customerId?: string
    billingData?: any
    shippingData?: any
    paymentMethods: string[]
    fees: OrderFee[]
    items: OrderItem[]
  }
>

export type StrippedOrder = Overwrite<
  Order,
  {
    items: _OrderItem[]
  }
>

export const getOrder = (orderId: string): Promise<Order | null> =>
  prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
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
            select: {
              id: true,
              name: true,
              createdAt: true,
              price: true,
              type: true,
              public: true,
              slug: true,
              description: true,
              store: true,
              storeCategory: true,
              storeCategoryId: true,
              storeId: true,
              updatedAt: true,
              template: true,
              minQuantity: true,
              meta: true,
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
    status?: Order['status']
    fulfillmentStatus?: Order['fulfillmentStatus']
  }
  orderBy?: {
    id?: 'desc' | 'asc'
    createdAt?: 'desc' | 'asc'
    total?: 'desc' | 'asc'
  }
}): Promise<StrippedOrder[]> =>
  prisma.order.findMany({
    where: {
      storeId,
      id: filter?.id
        ? {
            startsWith: filter.id,
          }
        : undefined,
      status: filter?.status,
      fulfillmentStatus: filter?.fulfillmentStatus,
    },
    include: {
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
  }) as Promise<StrippedOrder[]>

export const createOrder = async ({
  order,
  storeId,
}: {
  order: Overwrite<
    Omit<Order, 'id' | 'createdAt' | 'storeId' | 'total'>,
    {
      fulfillmentStatus?: Order['fulfillmentStatus']
      paymentMethods?: string[]
      items: {
        cost: number
        basePrice: number
        productId: string
        modifiers?: ModifiersMap | null
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
            select: {
              id: true,
              name: true,
              createdAt: true,
              price: true,
              type: true,
              public: true,
              slug: true,
              description: true,
              store: true,
              storeCategory: true,
              storeCategoryId: true,
              storeId: true,
              updatedAt: true,
              template: true,
              minQuantity: true,
              meta: true,
            },
          },
        },
      },
    },
  }) as Promise<Order>

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
        modifiers?: ModifiersMap | null
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
            select: {
              id: true,
              name: true,
              createdAt: true,
              price: true,
              type: true,
              public: true,
              slug: true,
              description: true,
              store: true,
              storeCategory: true,
              storeCategoryId: true,
              storeId: true,
              updatedAt: true,
              template: true,
              minQuantity: true,
              meta: true,
            },
          },
        },
      },
    },
  })
  console.log(updated)
  return updated as Order
}
