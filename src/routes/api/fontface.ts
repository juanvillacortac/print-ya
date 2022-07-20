import type { RequestHandler } from '@sveltejs/kit'

export const GET: RequestHandler = ({ url }) => {
  const fontUrl = url.searchParams.get('src')
  const name = url.searchParams.get('name') || 'customFont'

  return {
    headers: {
      'Content-Type': 'text/css',
    },
    body: `@font-face {
  font-family: "${name}";
  src: url("${fontUrl}");
}`,
  }
}
