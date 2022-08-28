import { parseShopifyProductsCSV } from '@shackcart/db/utils'
import { supabase } from '@shackcart/shared'
import sendgrid, { type MailDataRequired } from '@sendgrid/mail'
// import { Worker, Processor, Queue } from 'bullmq'
import { createProductsFromBatch, getUser } from '@shackcart/db'
import { marked } from 'marked'
import { redis } from 'src/redis.js'
import { default as Queue } from 'bee-queue'

export type ImportInput = {
  supabasePath: string
  categoryId?: string
  storeId: string
  userId: string
}

const queue = new Queue<ImportInput>('shopifyImport', {
  redis,
})

queue.process(async (job) => {
  const { supabasePath, categoryId, storeId } = job.data
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

  return products.length
})

// const processor: Processor<ImportInput, number> = async (job) => {
//   const { supabasePath, categoryId, storeId } = job.data
//   const blob = await supabase.downloadFile({
//     bucket: 'assets',
//     path: supabasePath,
//   })
//   if (!blob) throw new Error(`CSV file not found: ${supabasePath}`)

//   const body = await blob.text()

//   const products = await parseShopifyProductsCSV(categoryId || undefined, {
//     body,
//   })

//   const count = await createProductsFromBatch(products, storeId)

//   return products.length
// }

// const worker = new Worker('shopifyImport', processor, {
//   concurrency: 50,
//   connection: redis,
// })

// worker.on('completed', async (job) => {
//   const { userId } = job.data
//   const count = job.returnvalue

//   const template = `You successfully imported ${count} products from **Shopify**`

//   const html = marked(template, {
//     sanitize: true,
//   })
//   let to = [(await getUser({ userId }))!.email]

//   const msg: MailDataRequired = {
//     to: [...new Set(to)],
//     from: {
//       name: `ShackCart`,
//       email: `contact@shackcart.com`,
//     },

//     headers: {
//       Priority: 'Urgent',
//       Importance: 'high',
//     },
//     subject: `Products imported`,
//     html,
//   }

//   sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')
//   await sendgrid.send(msg)
// })

// worker.on('failed', async (job, err) => {
//   const { userId } = job.data
//   let to = [(await getUser({ userId }))!.email]

//   const msg: MailDataRequired = {
//     to: [...new Set(to)],
//     from: {
//       name: `ShackCart`,
//       email: `contact@shackcart.com`,
//     },

//     headers: {
//       Priority: 'Urgent',
//       Importance: 'high',
//     },
//     subject: `Error importing products`,
//     html: `<pre>${JSON.stringify(err, undefined, '  ')}</pre>`,
//   }
//   sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')
//   await sendgrid.send(msg)
// })

// const importQueue = new Queue('shopifyImport')

export const importProducts = async (input: ImportInput) => {
  const job = queue.createJob(input)
  job.on('succeeded', async (count: number) => {
    const { userId } = job.data

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

    sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')
    await sendgrid.send(msg)
  })
  job.on('failed', async (err) => {
    const { userId } = job.data
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
    sendgrid.setApiKey(process.env.SENDGRID_API_KEY || '')
    await sendgrid.send(msg)
  })
  await job.save()
}

// export const importProducts = (input: ImportInput) =>
//   importQueue.add('shopifyImport', input)
