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
    store?: import('$lib/db').Store | null
    product?: import('$lib/db').Product | null
    products?: import('$lib/db').StripedProduct[] | null
  }
}

interface SessionData {
  userId?: string | null
  customerId?: string | null
}
