import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const uploadFile = async ({
  file,
  path,
  bucket,
}: {
  file: File
  path: string
  bucket: string
}) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${Math.random()}.${fileExt}`
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
  return publicURL
}
