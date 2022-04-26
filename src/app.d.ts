/// <reference types="@sveltejs/kit" />

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
  interface Stuff {}
}

interface SessionData {
  userId?: string | null
  expires?: string | null
}
