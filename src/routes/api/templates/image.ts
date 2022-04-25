import { compile, type TemplateSource } from '$lib/compiler'
import type { RequestHandler } from '@sveltejs/kit'

export const get: RequestHandler = ({ url }) => {
  const decoded = atob(url.searchParams.get('data'))
  const payload: TemplateSource = JSON.parse(decoded)
  const { css, html } = compile(payload)

  const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <style>
      ${css}
    </style>
  </head>
  <body>
    ${html}
  </body>
</html>`

  return {
    headers: {
      'Content-Type': 'text/html',
    },
    status: 200,
    body: template,
  }
}
