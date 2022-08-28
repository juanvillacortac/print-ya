import { z } from 'zod'
import { createServer } from 'src/shared.js'
import { api } from '@shackcart/shared'
import { importProducts } from 'src/workers/shopify-import.js'

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

const importRouter = createServer().mutation('importFromShopify', {
  input: z.object({
    supabasePath: z.string(),
    storeId: z.string().cuid(),
    categoryId: z.string().cuid().optional(),
    userId: z.string().cuid(),
  }),
  resolve: async ({ input, ctx }) => {
    const { categoryId, storeId, supabasePath, userId } = input
    await importProducts({
      supabasePath,
      categoryId,
      userId,
      storeId,
    })
  },
})

export default createServer()
  .query('geocoding', {
    input: coords,
    resolve: ({ input }) => lookup(input),
  })
  .mutation('importShopifyProducts', {
    input: z.object({
      supabasePath: z.string(),
      storeId: z.string().cuid(),
      categoryId: z.string().cuid().optional(),
    }),
    resolve: async ({ input, ctx }) => {
      const { userId } = await ctx.session.auth({ verify: true })
      if (!userId)
        return {
          ok: false,
        }

      const caller = importRouter.createCaller(ctx)

      caller.mutation('importFromShopify', { ...input, userId })
      return {
        ok: true,
      }
    },
  })
