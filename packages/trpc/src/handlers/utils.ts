import { z } from 'zod'
import * as db from '@shackcart/db'
import { parseShopifyProductsCSV } from '@shackcart/db/utils'
import { marked } from 'marked'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import { createServer } from 'src/shared.js'
import { api, supabase } from '@shackcart/shared'
import { Queue } from 'bullmq'
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
      const { categoryId, storeId, supabasePath } = input
      const { userId } = await ctx.session.auth({ verify: true })
      if (!userId) return

      await importProducts({
        supabasePath,
        categoryId,
        userId,
        storeId,
      })
    },
  })
