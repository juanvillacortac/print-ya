export const getDefaultHost: any = () =>
  import.meta.env.VITE_CANONICAL_HOST || process.env.LOCALHOST_HOST

export const isCanonical = (host?: string) =>
  (host || window.location.host) === getDefaultHost() ||
  (host || window.location.host) === process.env.VERCEL_URL ||
  (host || window.location.host) === 'localhost:3000'

export const getAbsoluteURL = ({
  path = '',
  host = getDefaultHost().replace(
    import.meta.env.VITE_APP_HOST_SUBDOMAIN
      ? `${import.meta.env.VITE_APP_HOST_SUBDOMAIN}.`
      : '',
    ''
  ),
  subdomain = '',
} = {}) => {
  const hostWithSubdomain = subdomain ? `${subdomain}.${host}` : host
  let baseURL = isLocalhost(host)
    ? `http://${hostWithSubdomain}`
    : `https://${hostWithSubdomain}`
  return baseURL + path
}

export const isLocalhost = (host = getDefaultHost()) => {
  return host?.includes(process.env.LOCALHOST_HOST)
  // const splitedHost = host.split('.')
  // return splitedHost
  //   .slice(
  //     0,
  //     splitedHost.length >= 3 ? splitedHost.length - 1 : splitedHost.length
  //   )
  //   .some((str) => str.startsWith('localhost'))
}
