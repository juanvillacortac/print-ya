/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {
    layout: import('$lib/utils/layout').LayoutType
    session: import('svelte-kit-cookie-session').Session<SessionData>
    cookies: Record<string, string>
  }
  interface Platform {}
  interface Session extends SessionData {
    layout: import('$lib/utils/layout').LayoutType
    host?: string
    fullHost?: string
    userAgent?: string

    subtitle?: string
  }
  interface Stuff extends Record<string, unknown> {
    layout: import('$lib/utils/layout').LayoutType
    store?: import('$lib/db').Store
    product?: import('$lib/db').Product
    products?: import('$lib/db').StripedProduct[]
  }
}

interface SessionData {
  userId?: string | null
  expires?: string | null
}
