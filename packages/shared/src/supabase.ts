import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY

export const client = createClient(supabaseUrl || '', supabaseAnonKey || '')

export const removeFiles = async ({
  paths,
  bucket,
}: {
  paths: string[]
  bucket: string
}) => {
  let { error, data } = await client.storage.from(bucket).remove(paths)
  if (error) {
    throw error
  }
  return data
}

export const uploadFile = async ({
  file,
  path,
  bucket,
  fileName,
}: {
  file: File
  path: string
  bucket: string
  fileName?: string
}) => {
  const fileExt = file.name.split('.').pop()
  fileName = `${fileName || Math.random()}.${fileExt}`
  const filePath = `${path}/${fileName}`

  let { error: uploadError } = await client.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
    })
  if (uploadError) {
    throw uploadError
  }
  let { error: urlError, publicURL } = client.storage
    .from(bucket)
    .getPublicUrl(filePath)
  if (urlError) {
    throw urlError
  }
  return { url: publicURL, path: filePath }
}

export const downloadFile = async ({
  path,
  bucket,
}: Record<'path' | 'bucket', string>) => {
  let { error, data } = await client.storage.from(bucket).download(path)
  if (error) {
    throw error
  }
  return data
}
