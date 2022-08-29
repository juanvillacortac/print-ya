import { File, FormData, Headers, Request, Response, fetch } from 'undici'

if (!globalThis.fetch) {
  globalThis.fetch = fetch as any
  globalThis.File = File as any
  globalThis.FormData = FormData as any
  globalThis.Headers = Headers as any
  globalThis.Request = Request as any
  globalThis.Response = Response as any
}
