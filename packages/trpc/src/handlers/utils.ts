import { z } from 'zod'
import { createServer } from 'src/shared.js'
import { api } from '@shackcart/shared'
import { prisma } from '@shackcart/db'

const coords = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

type Coords = z.infer<typeof coords>

const lookup = async (coords: Coords) => {
  const res = await api.get(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=${process.env.PUBLIC_GEOAPIFY_TOKEN}`
  )
  return res as any
}

export default createServer()
  .query('geocoding', {
    input: coords,
    resolve: ({ input }) => lookup(input),
  })
  .query('deleteAllProducts', {
    resolve: async ({}) => {
      await prisma.orderItem.deleteMany({})
      await prisma.orderFee.deleteMany({})
      await prisma.tagsOnProducts.deleteMany({})
      await prisma.categoriesOnProducts.deleteMany({})
      await prisma.productTag.deleteMany({})
      await prisma.productCategory.deleteMany({})
      await prisma.order.deleteMany({})
      await prisma.productModifierItem.deleteMany({})
      await prisma.productModifier.deleteMany({})
      await prisma.product.deleteMany({})
      await prisma.shopifyImport.deleteMany({})
      return {
        ok: true,
      }
    },
  })
