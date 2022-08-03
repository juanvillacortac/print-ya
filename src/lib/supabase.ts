import {
  PUBLIC_SUPABASE_ANON_KEY,
  PUBLIC_SUPABASE_URL,
} from '$env/static/public'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = PUBLIC_SUPABASE_URL
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const removeFiles = async ({
  paths,
  bucket,
}: {
  paths: string[]
  bucket: string
}) => {
  let { error, data } = await supabase.storage.from(bucket).remove(paths)
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

  let { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(filePath, file, {
      upsert: true,
    })
  if (uploadError) {
    throw uploadError
  }
  let { error: urlError, publicURL } = supabase.storage
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
  let { error, data } = await supabase.storage.from(bucket).download(path)
  if (error) {
    throw error
  }
  return data
}
