import * as trpc from '@trpc/server'
import geocoder from 'local-reverse-geocoder'
import { z } from 'zod'
import type { tRPCContext } from '.'
import mapbox from 'mapbox-geocoding'
import { get } from '$lib/api'

mapbox.setAccessToken('YOUR MAPBOX PUBLIC TOKEN')

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

export default trpc.router<tRPCContext>().query('geocoding', {
  input: coords,
  resolve: ({ input }) => lookup(input),
})
