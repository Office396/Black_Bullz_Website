import { supabase } from '../supabase'

export interface Item {
  id: number
  title: string
  category: string
  description: string
  longDescription: string
  developer: string
  size: string
  releaseDate: string
  image: string
  rating: string
  trending: boolean
  latest: boolean
  keyFeatures: string[]
  screenshots: string[]
  systemRequirements: {
    recommended: {
      os: string
      processor: string
      memory: string
      graphics: string
      storage: string
    }
  }
  androidRequirements: {
    recommended: {
      os: string
      ram: string
      storage: string
      processor: string
    }
  }
  sharedPinCode: string
  sharedRarPassword?: string
  cloudDownloads: Array<{
    cloudName: string
    actualDownloadLinks: Array<{ name: string; url: string; size: string }>
  }>
  uploadDate: string
}

export async function getItems(): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .order('upload_date', { ascending: false })

  if (error) {
    console.error('Error fetching items:', error)
    throw error
  }

  // Transform database fields to match interface
  return (data || []).map(item => ({
    ...item,
    longDescription: item.long_description,
    releaseDate: item.release_date,
    keyFeatures: item.key_features || [],
    screenshots: item.screenshots || [],
    systemRequirements: item.system_requirements,
    androidRequirements: item.android_requirements,
    sharedPinCode: item.shared_pin_code,
    sharedRarPassword: item.shared_rar_password,
    cloudDownloads: item.cloud_downloads || []
  }))
}

export async function addItem(itemData: Omit<Item, 'id' | 'uploadDate'>): Promise<Item> {
  const now = new Date()
  const dbItem = {
    title: itemData.title,
    category: itemData.category,
    description: itemData.description,
    long_description: itemData.longDescription,
    developer: itemData.developer,
    size: itemData.size,
    release_date: itemData.releaseDate,
    image: itemData.image,
    rating: itemData.rating,
    trending: itemData.trending,
    latest: itemData.latest,
    key_features: itemData.keyFeatures,
    screenshots: itemData.screenshots,
    system_requirements: itemData.systemRequirements,
    android_requirements: itemData.androidRequirements,
    shared_pin_code: itemData.sharedPinCode,
    shared_rar_password: itemData.sharedRarPassword,
    cloud_downloads: itemData.cloudDownloads,
    upload_date: now.toISOString().split('T')[0]
  }

  const { data, error } = await supabase
    .from('items')
    .insert(dbItem)
    .select()
    .single()

  if (error) {
    console.error('Error adding item:', error)
    throw error
  }

  // Transform back to interface format
  return {
    ...data,
    longDescription: data.long_description,
    releaseDate: data.release_date,
    keyFeatures: data.key_features || [],
    screenshots: data.screenshots || [],
    systemRequirements: data.system_requirements,
    androidRequirements: data.android_requirements,
    sharedPinCode: data.shared_pin_code,
    sharedRarPassword: data.shared_rar_password,
    cloudDownloads: data.cloud_downloads || []
  }
}

export async function updateItem(id: number, itemData: Partial<Item>): Promise<Item | null> {
  // Transform interface fields to database fields
  const dbUpdate: any = {}
  if (itemData.title !== undefined) dbUpdate.title = itemData.title
  if (itemData.category !== undefined) dbUpdate.category = itemData.category
  if (itemData.description !== undefined) dbUpdate.description = itemData.description
  if (itemData.longDescription !== undefined) dbUpdate.long_description = itemData.longDescription
  if (itemData.developer !== undefined) dbUpdate.developer = itemData.developer
  if (itemData.size !== undefined) dbUpdate.size = itemData.size
  if (itemData.releaseDate !== undefined) dbUpdate.release_date = itemData.releaseDate
  if (itemData.image !== undefined) dbUpdate.image = itemData.image
  if (itemData.rating !== undefined) dbUpdate.rating = itemData.rating
  if (itemData.trending !== undefined) dbUpdate.trending = itemData.trending
  if (itemData.latest !== undefined) dbUpdate.latest = itemData.latest
  if (itemData.keyFeatures !== undefined) dbUpdate.key_features = itemData.keyFeatures
  if (itemData.screenshots !== undefined) dbUpdate.screenshots = itemData.screenshots
  if (itemData.systemRequirements !== undefined) dbUpdate.system_requirements = itemData.systemRequirements
  if (itemData.androidRequirements !== undefined) dbUpdate.android_requirements = itemData.androidRequirements
  if (itemData.sharedPinCode !== undefined) dbUpdate.shared_pin_code = itemData.sharedPinCode
  if (itemData.sharedRarPassword !== undefined) dbUpdate.shared_rar_password = itemData.sharedRarPassword
  if (itemData.cloudDownloads !== undefined) dbUpdate.cloud_downloads = itemData.cloudDownloads
  if (itemData.uploadDate !== undefined) dbUpdate.upload_date = itemData.uploadDate

  const { data, error } = await supabase
    .from('items')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating item:', error)
    return null
  }

  // Transform back to interface format
  return {
    ...data,
    longDescription: data.long_description,
    releaseDate: data.release_date,
    keyFeatures: data.key_features || [],
    screenshots: data.screenshots || [],
    systemRequirements: data.system_requirements,
    androidRequirements: data.android_requirements,
    sharedPinCode: data.shared_pin_code,
    sharedRarPassword: data.shared_rar_password,
    cloudDownloads: data.cloud_downloads || []
  }
}

export async function deleteItem(id: number): Promise<boolean> {
  const { error } = await supabase
    .from('items')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting item:', error)
    return false
  }

  return true
}