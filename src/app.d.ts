/// <reference types="@sveltejs/kit" />

declare namespace App {
  interface Locals {}

  interface Platform {}

  interface Session {
    host?: string
    userAgent?: string
  }

  interface Stuff {}
}
