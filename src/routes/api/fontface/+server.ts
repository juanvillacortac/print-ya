import type { RequestHandler } from '@sveltejs/kit'

const fontface = ({
  name,
  url,
}: Record<'name' | 'url', string>) => `@font-face {
  font-family: "${name}";
  src: url("${url}");
}`

export const GET: RequestHandler = ({ url }) => {
  const fontUrl = url.searchParams.get('src')
  const name = url.searchParams.get('name') || 'customFont'

  if (!fontUrl) {
    return new Response("You must pass a 'src' query param", {
      status: 500,
      statusText: "You must pass a 'src' query param",
    })
  }

  return new Response(fontface({ name, url: fontUrl }), {
    headers: {
      'Content-Type': 'text/css',
    },
  })
}
