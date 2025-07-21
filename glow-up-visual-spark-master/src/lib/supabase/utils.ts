import { supabase } from './client'
import { Database } from '@/types/supabase'

type Tables = Database['public']['Tables']
type TableName = keyof Tables

export async function fetchAll<T extends TableName>(
  table: T,
  columns: string = '*'
): Promise<Tables[T]['Row'][]> {
  const { data, error } = await supabase
    .from(table)
    .select(columns)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(`Error fetching ${table}:`, error)
    throw error
  }

  return data || []
}

export async function fetchById<T extends TableName>(
  table: T,
  id: string
): Promise<Tables[T]['Row'] | null> {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching ${table} with id ${id}:`, error)
    return null
  }

  return data
}

export async function create<T extends TableName>(
  table: T,
  data: Omit<Tables[T]['Insert'], 'id' | 'created_at' | 'updated_at'>
): Promise<Tables[T]['Row'] | null> {
  const { data: result, error } = await supabase
    .from(table)
    .insert([{
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error(`Error creating ${table}:`, error)
    throw error
  }

  return result
}

export async function update<T extends TableName>(
  table: T,
  id: string,
  updates: Partial<Tables[T]['Update']>
): Promise<Tables[T]['Row'] | null> {
  const { data, error } = await supabase
    .from(table)
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(`Error updating ${table} with id ${id}:`, error)
    throw error
  }

  return data
}

export async function softDelete<T extends TableName>(
  table: T,
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from(table)
    .update({ 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', id)

  if (error) {
    console.error(`Error soft deleting ${table} with id ${id}:`, error)
    return false
  }

  return true
}

export async function uploadFile(
  bucket: string,
  path: string,
  file: File
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file)

  if (error) {
    console.error('Error uploading file:', error)
    throw error
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return publicUrl
}

export async function deleteFile(bucket: string, path: string): Promise<boolean> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('Error deleting file:', error)
    return false
  }

  return true
}
