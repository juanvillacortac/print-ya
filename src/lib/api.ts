type Fetch = (info: RequestInfo, init?: RequestInit) => Promise<Response>

async function send({
  method,
  path,
  data = {},
  headers = {},
  timeout = 120000,
  fetch: fetcher = fetch,
}): Promise<Record<string, any>> {
  const abortController =
    typeof AbortController !== 'undefined'
      ? AbortController
      : await import('node-abort-controller').then((m) => m.AbortController)

  const controller = new abortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const opts = {
    method,
    headers: {},
    body: null as any,
    signal: controller.signal,
  }
  if (Object.keys(data).length > 0) {
    const parsedData = data
    for (const [key, value] of Object.entries(data)) {
      if (value === '') {
        parsedData[key] = null
      }
    }
    if (parsedData) {
      opts.headers['Content-Type'] = 'application/json'
      opts.body = JSON.stringify(parsedData)
    }
  }

  if (headers) {
    opts.headers = {
      ...opts.headers,
      ...headers,
    }
  }
  const response = await fetcher(`${path}`, opts as any)

  clearTimeout(id)

  const contentType = response.headers.get('content-type')

  let responseData = {}
  if (contentType) {
    if (contentType?.indexOf('application/json') !== -1) {
      responseData = await response.json()
    } else if (contentType?.indexOf('text/plain') !== -1) {
      responseData = await response.text()
    } else {
      return {}
    }
  } else {
    return {}
  }
  if (response.status === 404) return responseData
  if (!response.ok) throw responseData
  return responseData
}

export function get<T = Record<string, unknown>>(
  path: string,
  options?: {
    headers?: Record<string, unknown>
    fetch?: Fetch
  }
): Promise<T> {
  return send({ method: 'GET', path, ...options }) as Promise<T>
}

export function del<T = Record<string, unknown>>(
  path: string,
  data: Record<string, unknown>,
  headers?: Record<string, unknown>
): Promise<T> {
  return send({ method: 'DELETE', path, data, headers }) as Promise<T>
}

export function post<T = Record<string, unknown>, I = Record<string, unknown>>(
  path: string,
  data: I,
  headers?: Record<string, unknown>
): Promise<T> {
  return send({ method: 'POST', path, data, headers }) as Promise<T>
}

export function put<T = Record<string, unknown>>(
  path: string,
  data: Record<string, unknown>,
  headers?: Record<string, unknown>
): Promise<T> {
  return send({ method: 'PUT', path, data, headers }) as Promise<T>
}
