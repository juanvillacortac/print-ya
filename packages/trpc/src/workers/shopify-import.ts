import { generateDefaultModifiers } from '@shackcart/db/utils'
import { supabase, utils } from '@shackcart/shared'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import { marked } from 'marked'
import csvtojson from 'csvtojson'
import { createProductsFromBatch, getUser, Product } from '@shackcart/db'
import { nanoid } from 'nanoid'

sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')

export type ImportInput = {
  supabasePath: string
  categoryId?: string
  storeId: string
  userId: string
}

export const importProducts = async (input: ImportInput) => {
  const { supabasePath, categoryId, storeId, userId } = input
  try {
    const blob = await supabase.downloadFile({
      bucket: 'assets',
      path: supabasePath,
    })
    if (!blob) throw new Error(`CSV file not found: ${supabasePath}`)

    const body = await blob.text()

    const products = await parseShopifyProductsCSV(categoryId || undefined, {
      body,
    })

    const count = await createProductsFromBatch(products, storeId)

    const template = `You successfully imported ${count} products from **Shopify**`

    const html = marked(template, {
      sanitize: true,
    })
    let to = [(await getUser({ userId }))!.email]

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
    let to = [(await getUser({ userId }))!.email]

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
      subject: `Error importing products`,
      html: `<pre>${JSON.stringify(err, undefined, '  ')}</pre>`,
    }
    await sendgrid.send(msg)
  }
}

export async function parseShopifyProductsCSV(
  categoryId: string | undefined,
  obj: { body: string } | { filePath: string } | never
): Promise<(Partial<Product> & { internalId: string })[]> {
  let data: any[]
  if ('body' in obj) {
    data = await csvtojson().fromString(obj.body)
  } else {
    data = await csvtojson().fromFile(obj.filePath)
  }
  const crypto_ = globalThis.crypto
    ? crypto
    : await import('@peculiar/webcrypto').then((m) => new m.Crypto())
  const products: (Partial<Product> & { internalId: string })[] = data.map(
    (p) => {
      const { meta, modifiers } = generateDefaultModifiers()
      const id = nanoid(6).toLocaleLowerCase()
      let slug = `${utils.slugify(p.Title)}-${id}`
      const product: Partial<Product> & { internalId: string } = {
        internalId: crypto_.randomUUID(),
        name: p.Title,
        type: 'template',
        storeCategoryId: categoryId,
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
