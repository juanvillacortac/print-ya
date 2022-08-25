import { z } from 'zod'
import * as db from '@shackcart/db'
import { parseShopifyProductsCSV } from '@shackcart/db/utils'
import { marked } from 'marked'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import { createServer } from 'src/shared.js'
import { api, supabase } from '@shackcart/shared'

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
      const { userId } = ctx.session
      if (!userId) return
      // const start = Date.now()
      const blob = await supabase.downloadFile({
        bucket: 'assets',
        path: input.supabasePath,
      })
      if (!blob) return
      // const downloadedIn = Date.now() - start
      const body = await blob.text()
      // const startParsing = Date.now()
      const products = await parseShopifyProductsCSV(
        input.categoryId || undefined,
        { body }
      )
      // const totalElapsed = Date.now() - start
      // const elapsedParsing = Date.now() - startParsing

      sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')

      try {
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
      } catch (err) {
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
          subject: `Error importing products`,
          html: `<pre>${JSON.stringify(err, undefined, '  ')}</pre>`,
        }
        await sendgrid.send(msg)
      }
      // return {
      //   downloadedIn,
      //   totalElapsed,
      //   elapsedParsing,
      //   count: products.length,
      // }
    },
  })
