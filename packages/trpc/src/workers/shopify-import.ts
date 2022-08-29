import { parseShopifyProductsCSV } from '@shackcart/db/utils'
import { supabase } from '@shackcart/shared'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
import { marked } from 'marked'
import { createProductsFromBatch, getUser } from '@shackcart/db'

export type ImportInput = {
  supabasePath: string
  categoryId?: string
  storeId: string
  userId: string
}

export const importProducts = async (input: ImportInput) => {
  const { supabasePath, categoryId, storeId, userId } = input
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')
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
