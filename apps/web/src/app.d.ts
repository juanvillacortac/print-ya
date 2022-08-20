declare const __LOCALHOST_HOST__: string
declare const __VERCEL_URL__: string

declare namespace App {
  interface Locals extends SessionData {
    layoutType: import('$lib/utils/layout').LayoutType

    session: import('svelte-kit-cookie-session').Session<SessionData>
    cookies: Record<string, string>

    host?: string
    fullHost?: string
    userAgent?: string
  }
  interface Platform {}
  // interface Session extends Pick<SessionData, 'userId'> {
  //   layout: import('$lib/utils/layout').LayoutType
  //   host?: string
  //   fullHost?: string
  //   userAgent?: string
  //   subtitle?: string
  // }
  // interface Stuff extends Record<string, unknown> {
  //   layout: import('$lib/utils/layout').LayoutType
  //   storeData?: StoreData
  //   store?: import('@shackcart/db').Store | null
  //   product?: import('@shackcart/db').Product | null
  //   products?: import('@shackcart/db').StripedProduct[] | null
  // }
}

interface SessionData {
  userId?: string | null
  customerId?: string | null
}

interface StoreData {
  theme: Record<'primary', string>
  header: {
    links: Record<'title' | 'href', string>[]
  }
  announcementBar: Record<'background' | 'text', string> &
    Partial<Record<'href', string>> & { visible: boolean }
  footer: {
    submit: Record<'title' | 'text', string>
    links: Record<'title' | 'href', string>[]
    appendix: Record<'title' | 'text' | 'img', string>
  }
}
