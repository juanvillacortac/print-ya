import {
  PUBLIC_CANONICAL_HOST,
  PUBLIC_APP_HOST_SUBDOMAIN,
} from '$env/static/public'

export function getDefaultHost(): string {
  return PUBLIC_CANONICAL_HOST || __LOCALHOST_HOST__
}

export function isCanonical(host?: string) {
  return (
    (host || window.location.host) === getDefaultHost() ||
    (host || window.location.host) === __VERCEL_URL__ ||
    (host || window.location.host) === 'localhost:5173'
  )
}

export function getAbsoluteURL({
  path = '',
  host = getDefaultHost().replace(
    PUBLIC_APP_HOST_SUBDOMAIN ? `${PUBLIC_APP_HOST_SUBDOMAIN}.` : '',
    ''
  ),
  subdomain = '',
}: Partial<Record<'path' | 'host' | 'subdomain', string>> = {}) {
  const isGitpod = host.includes('gitpod.io')
  const hostWithSubdomain =
    subdomain && !isGitpod ? `${subdomain}.${host}` : host
  let baseURL = isLocalhost(host)
    ? isGitpod
      ? `https://${hostWithSubdomain}`
      : `http://${hostWithSubdomain}`
    : `https://${hostWithSubdomain}`
  try {
    const url = new URL(baseURL + path)
    if (isGitpod && !path.includes('/api/trpc')) {
      url.searchParams.set('store', subdomain)
    }
    return url.toString()
  } catch {
    return ''
  }
}

export function isLocalhost(host = getDefaultHost()) {
  return host?.includes(__LOCALHOST_HOST__)
}
