/// <reference types="@sveltejs/kit" />

import type { Product, Store, StripedProduct } from '$lib/db'
import type { LayoutType } from '$lib/utils/layout'

declare namespace App {
  interface Locals {
    session: import('svelte-kit-cookie-session').Session<SessionData>
    cookies: Record<string, string>
  }
  interface Platform {}
  interface Session extends SessionData {
    host?: string
    userAgent?: string
  }
  interface Stuff extends Record<string, unknown> {
    layout: LayoutType
    store?: Store
    product?: Product
    products?: StripedProduct[]
    subtitle?: string
  }
}

interface SessionData {
  userId?: string | null
  expires?: string | null
}
