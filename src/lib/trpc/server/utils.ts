import * as trpc from '@trpc/server'
import { z } from 'zod'
import type { tRPCContext } from '.'
import { get } from '$lib/api'
import { downloadFile } from '$lib/supabase'
import { createWriteStream } from 'node:fs'
import { parseShopifyProductsCSV } from '$lib/utils/modifiers'

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
    resolve: async ({ input }) => {
      const start = Date.now()
      const blob = await downloadFile({
        bucket: 'assets',
        path: input.supabasePath,
      })
      if (!blob) return
      const downloadedIn = Date.now() - start
      const body = await blob.text()
      // const _ = await new Promise<void>((resolve, reject) => {
      //   createWriteStream(filePath).write(Buffer.from(arrayBuffer), (err) => {
      //     if (err) {
      //       reject(err)
      //       return
      //     }
      //     resolve()
      //     return
      //   })
      // })
      const startParsing = Date.now()
      const products = await parseShopifyProductsCSV({ body })
      const totalElapsed = Date.now() - start
      const elapsedParsing = Date.now() - startParsing
      return {
        downloadedIn,
        totalElapsed,
        elapsedParsing,
        count: products.length,
      }
    },
  })
