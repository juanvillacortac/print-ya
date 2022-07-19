export function getDefaultHost(): string {
  return import.meta.env.VITE_CANONICAL_HOST || __LOCALHOST_HOST__
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
    import.meta.env.VITE_APP_HOST_SUBDOMAIN
      ? `${import.meta.env.VITE_APP_HOST_SUBDOMAIN}.`
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
  return host?.includes(__LOCALHOST_HOST__)
  // const splitedHost = host.split('.')
  // return splitedHost
  //   .slice(
  //     0,
  //     splitedHost.length >= 3 ? splitedHost.length - 1 : splitedHost.length
  //   )
  //   .some((str) => str.startsWith('localhost'))
}
