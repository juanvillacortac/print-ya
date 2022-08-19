import { z } from 'zod'
import { get } from '$lib/api'
import * as db from '$lib/db'
import { downloadFile } from '$lib/supabase'
import { parseShopifyProductsCSV } from '$lib/utils/modifiers'
import { marked } from 'marked'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import { PUBLIC_GEOAPIFY_TOKEN } from '$env/static/public'
import { SENDGRID_API_KEY } from '$env/static/private'
import { createServer } from '../shared'

const coords = z.object({
  latitude: z.number(),
  longitude: z.number(),
})

type Coords = z.infer<typeof coords>

const lookup = async (coords: Coords) => {
  const res = await get(
    `https://api.geoapify.com/v1/geocode/reverse?lat=${coords.latitude}&lon=${coords.longitude}&apiKey=${PUBLIC_GEOAPIFY_TOKEN}`
  )
  return res as any
}

export default createServer()
  .query('kit-locals', {
    resolve: ({ ctx }) => {
      const locals = JSON.parse(JSON.stringify(ctx.event.locals))
      delete locals.cookies
      delete locals.session
      return locals as Omit<App.Locals, 'cookies' | 'session'>
    },
  })
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
      const { userId } = await db.getUserDetails(ctx.event)
      if (!userId) return
      // const start = Date.now()
      const blob = await downloadFile({
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
        sendgrid.setApiKey(SENDGRID_API_KEY)
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
        sendgrid.setApiKey(SENDGRID_API_KEY)
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
