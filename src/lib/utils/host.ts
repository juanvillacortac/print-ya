export const getDefaultHost = () =>
  import.meta.env.VITE_CANONICAL_HOST || process.env.LOCALHOST_HOST

export const isCanonical = (host?: string) =>
  (host || window.location.host) === getDefaultHost() ||
  (host || window.location.host) === `app.${getDefaultHost()}` ||
  (host || window.location.host) === 'localhost:3000'

export const getAbsoluteURL = ({
  path = '',
  host = getDefaultHost(),
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
