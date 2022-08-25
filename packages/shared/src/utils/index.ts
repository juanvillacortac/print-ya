export const slugify = (s: string) =>
  s
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') //remove diacritics
    .toLowerCase()
    .replace(/\s+/g, '-') //spaces to dashes
    .replace(/&/g, '-and-') //ampersand to and
    .replace(/[^\w\-]+/g, '') //remove non-words
    .replace(/\-\-+/g, '-') //collapse multiple dashes
    .replace(/^-+/, '') //trim starting dash
    .replace(/-+$/, '') //trim ending dash

export function getDefaultHost(): string {
  return (
    process.env.PUBLIC_CANONICAL_HOST || process.env.__LOCALHOST_HOST__ || ''
  )
}

export function isCanonical(host?: string) {
  return (
    (host || window.location.host) === getDefaultHost() ||
    (host || window.location.host) === process.env.__VERCEL_URL__ ||
    (host || window.location.host) === 'localhost:5173'
  )
}

export function getAbsoluteURL({
  path = '',
  host = getDefaultHost().replace(
    process.env.PUBLIC_APP_HOST_SUBDOMAIN
      ? `${process.env.PUBLIC_APP_HOST_SUBDOMAIN}.`
      : '',
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
  return host?.includes(process.env.__LOCALHOST_HOST__ || '')
}
