import type { RequestHandler } from '@sveltejs/kit'
import { compile, type TemplateSource } from '$lib/compiler'
import chromium from 'chrome-aws-lambda'

export const get: RequestHandler = async ({ url }) => {
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

  let browser = null
  let file = null

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })

    let page = await browser.newPage()

    page.setContent(template)

    file = await page.screenshot({ type: 'png' })
  } catch (error) {
    return {
      body: error.message,
      status: 500,
    }
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }

  return {
    headers: {
      'Content-Type': 'image/png',
    },
    status: 200,
    body: file,
  }
}
