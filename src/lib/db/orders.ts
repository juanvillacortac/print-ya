import { prisma } from './common'
import type {
  Order as _Order,
  OrderFee,
  OrderItem as _OrderItem,
  Prisma,
  Product as _Product,
  ProductModifier as _ProductModifier,
  ProductModifierItem as _ProductModifierItem,
} from '@prisma/client'
import type { StripedProduct } from './products'
import type { ModifiersMap } from '$lib/utils/modifiers'

type Overwrite<T, U> = Pick<T, Exclude<keyof T, keyof U>> & U

export type OrderItem = _OrderItem & {
  product: StripedProduct
}

export type Order = Overwrite<
  _Order,
  {
    paymentMethods: string[]
    fees: Omit<OrderFee, 'id' | 'orderId'>[]
    items: OrderItem[]
  }
>

export type StrippedOrder = _Order & {
  items: Omit<OrderItem, 'product'>[]
}

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
}: {
  storeId: string
}): Promise<StrippedOrder[]> =>
  prisma.order.findMany({
    where: {
      storeId,
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
    orderBy: {
      createdAt: 'desc',
    },
  })

export const createOrder = async ({
  order,
  storeId,
}: {
  order: Overwrite<
    Omit<Order, 'id' | 'createdAt' | 'storeId'>,
    {
      items: {
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
      paymentMethods: order.paymentMethods,
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
