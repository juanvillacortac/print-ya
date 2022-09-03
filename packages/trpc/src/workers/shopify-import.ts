import { generateDefaultModifiers } from '@shackcart/db/utils'
import { supabase, utils } from '@shackcart/shared'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import csvtojson from 'csvtojson'
import { marked } from 'marked'
import * as db from '@shackcart/db'
import { nanoid } from 'nanoid'
import { createServer } from 'src/shared.js'
import { z } from 'zod'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')

export type ImportInput = {
  supabasePath: string
  importId: string
  categoryId?: string
  storeId: string
  userId: string
}

export const importProducts = async (input: ImportInput) => {
  const { supabasePath, categoryId, storeId, userId, importId } = input
  try {
    const blob = await supabase.downloadFile({
      bucket: 'assets',
      path: supabasePath,
    })
    if (!blob) throw new Error(`CSV file not found: ${supabasePath}`)

    const body = await blob.text()

    const products = await parseShopifyProductsCSV(
      categoryId || undefined,
      importId,
      {
        body,
      }
    )

    const count = await db.createProductsFromBatch(products, storeId)

    await db.updateShopifyImportStatus({ id: importId, status: 'pending' })

    const store = await db.getStore({ id: storeId })

    const url = utils.getAbsoluteURL({
      path: `/stores/${store?.slug}/products/import`,
    })

    const template = `You successfully imported ${count} products from **Shopify**, review here: [#${importId}](${url})`

    const html = marked(template, {
      sanitize: true,
    })
    let to = [(await db.getUser({ userId }))!.email]

    const msg: MailDataRequired = {
      to: [...new Set(to)],
      from: {
        name: `ShackCart`,
        email: `contact@shackcart.com`,
      },

      headers: {
        Priority: 'Urgent',
        Importance: 'high',
      },
      subject: `Products imported`,
      html,
    }

    await sendgrid.send(msg)
  } catch (err) {
    console.error('Error importing products')
    console.error(err)
    let to = [(await db.getUser({ userId }))!.email]

    await db.updateShopifyImportStatus({ id: importId, status: 'failed' })

    const msg: MailDataRequired = {
      to: [...new Set(to)],
      from: {
        name: `ShackCart`,
        email: `contact@shackcart.com`,
      },

      headers: {
        Priority: 'Urgent',
        Importance: 'high',
      },
      subject: `Error importing products - #${importId}`,
      html: `<h1>Error importing products</h1>
<strong>#${importId}</strong>
<pre>${JSON.stringify(err, undefined, '  ')}</pre>`,
    }

    await sendgrid.send(msg)
  } finally {
    await supabase.removeFiles({
      bucket: 'assets',
      paths: [supabasePath],
    })
  }
}

export async function parseShopifyProductsCSV(
  categoryId: string | undefined,
  shopifyImportId: string,
  obj: { body: string } | { filePath: string } | never
): Promise<(Partial<db.Product> & { internalId: string })[]> {
  let data: any[]
  if ('body' in obj) {
    data = await csvtojson().fromString(obj.body)
  } else {
    data = await csvtojson().fromFile(obj.filePath)
  }
  const crypto_ = globalThis.crypto
    ? crypto
    : await import('@peculiar/webcrypto').then((m) => new m.Crypto())
  const products: (Partial<db.Product> & { internalId: string })[] = data.map(
    (p) => {
      const { meta, modifiers } = generateDefaultModifiers()
      const id = nanoid(6).toLocaleLowerCase()
      let slug = `${utils.slugify(p.Title)}-${id}`
      const product: Partial<db.Product> & { internalId: string } = {
        internalId: crypto_.randomUUID(),
        name: p.Title,
        type: 'template',
        storeCategoryId: categoryId,
        shopifyImportId,
        slug,
        meta: {
          mockups: [],
          templateImage: p['Image Src'],
          ...meta,
        },
        tags: String(p['Tags'])
          .split(', ')
          .map((t) => ({
            name: t,
            id: '',
          })),
        description: p['Body (HTML)'],
        public: false,
        price: Number.parseFloat(p['Variant Price']),
        modifiers,
      }
      return product
    }
  )
  return products
}

export default createServer().mutation('create', {
  input: z.object({
    supabasePath: z.string(),
    storeId: z.string().cuid(),
    importId: z.string().cuid(),
    categoryId: z.string().cuid().optional(),
    userId: z.string().cuid(),
  }),
  resolve: async ({ input }) => {
    await importProducts(input)
  },
})
