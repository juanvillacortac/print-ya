declare const __LOCALHOST_HOST__: string
declare const __VERCEL_URL__: string

declare namespace App {
  interface Locals extends SessionData {
    layoutType: import('@shackcart/db').LayoutType

    session: import('svelte-kit-cookie-session').Session<SessionData>
    cookies: Record<string, string>

    host?: string
    fullHost?: string
    userAgent?: string
  }
  interface PageError {
    name?: string
    message?: string
    stack?: string
  }
}

interface SessionData {
  token?: string
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
