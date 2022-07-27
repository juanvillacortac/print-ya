import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'
import { get } from '$lib/api'
import * as db from '$lib/db'
import { downloadFile } from '$lib/supabase'
import { parseShopifyProductsCSV } from '$lib/utils/modifiers'
import { marked } from 'marked'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'

const coords = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

type Coords = z.infer<typeof coords>

const lookup = async (coords: Coords) => {
  const res = await get(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${
      coords.longitude
    }&apiKey=${import.meta.env.VITE_GEOAPIFY_TOKEN}`
  )
  return res as any
}

export default trpc
  .router<tRPCContext>()
  .query('geocoding', {
    input: coords,
    resolve: ({ input }) => lookup(input),
  })
  .mutation('importShopifyProducts', {
    input: z.object({
      supabasePath: z.string(),
      storeId: z.string().cuid(),
    }),
    resolve: async ({ input, ctx }) => {
      const { userId } = await db.getUserDetails(ctx.event)
      if (!userId) return
      const start = Date.now()
      const blob = await downloadFile({
        bucket: 'assets',
        path: input.supabasePath,
      })
      if (!blob) return
      const downloadedIn = Date.now() - start
      const body = await blob.text()
      const startParsing = Date.now()
      const products = await parseShopifyProductsCSV({ body })
      const totalElapsed = Date.now() - start
      const elapsedParsing = Date.now() - startParsing

      const count = await db.createProductsFromBatch(products, input.storeId)

      const template = `You successfully imported ${count} products from **Shopify**`

      const html = marked(template, {
        sanitize: true,
      })

      let to = [(await db.getUser({ userId }))!.email]

      const msg: MailDataRequired = {
        to: [...new Set(to)],
        from: {
          name: `ShackCart`,
          email: `contact@shackcart.com`,
        },

        headers: {
          Priority: 'Urgent',
          Importance: 'high',
        },
        subject: `Products imported`,
        html,
      }
      await sendgrid.send(msg)
      // return {
      //   downloadedIn,
      //   totalElapsed,
      //   elapsedParsing,
      //   count: products.length,
      // }
    },
  })
