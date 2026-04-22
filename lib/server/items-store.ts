import { supabase } from '../supabase'

export interface Item {
  id: number
  title: string
  category: string
  description: string
  longDescription: string
  developer: string
  publisher?: string
  size: string
  releaseDate: string
  publishedDate?: string
  image: string
  landscapeImage?: string
  rating: string
  trending: boolean
  latest: boolean
  keyFeatures: string[]
  screenshots: string[]
  note?: string
  trailerUrl?: string
  steamUrl?: string
  edition?: string
  genres?: string[]
  downloads?: number
  views?: number
  uploaderName?: string
  uploaderId?: string
  likes?: number
  dislikes?: number
  reviews?: any[]
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
  updatedDate?: string
}

export async function getItems(): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching items:', error)
      // Return empty array instead of throwing to prevent app crash
      return []
    }

    // Transform database fields to match interface
    return (data || []).map(item => ({
      ...item,
      longDescription: item.long_description,
      releaseDate: item.release_date,
      publishedDate: item.published_date,
      keyFeatures: item.key_features || [],
      screenshots: item.screenshots || [],
      note: item.note || "",
      systemRequirements: item.system_requirements,
      androidRequirements: item.android_requirements,
      sharedPinCode: item.shared_pin_code,
      sharedRarPassword: item.shared_rar_password,
      cloudDownloads: item.cloud_downloads || [],
      uploadDate: item.upload_date,
      updatedDate: item.updated_date,
      trailerUrl: item.trailer_url,
      steamUrl: item.steam_url,
      landscapeImage: item.landscape_image,
      edition: item.edition,
      genres: item.genres || [],
      downloads: item.downloads || 0,
      views: item.views || 0,
      uploaderName: item.uploader_name,
      uploaderId: item.uploader_id,
      likes: item.likes || 0,
      dislikes: item.dislikes || 0,
    }))
  } catch (error) {
    console.error('Error in getItems:', error)
    return []
  }
}

export async function getItemById(id: number): Promise<Item | null> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Error fetching item by id:', error)
      return null
    }

    // Fetch approved reviews for this game
    const { data: reviewsData } = await supabase
      .from('game_reviews')
      .select('*')
      .eq('game_id', id)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    return {
      ...data,
      longDescription: data.long_description,
      releaseDate: data.release_date,
      publishedDate: data.published_date,
      keyFeatures: data.key_features || [],
      screenshots: data.screenshots || [],
      note: data.note || "",
      systemRequirements: data.system_requirements,
      androidRequirements: data.android_requirements,
      sharedPinCode: data.shared_pin_code,
      sharedRarPassword: data.shared_rar_password,
      cloudDownloads: data.cloud_downloads || [],
      uploadDate: data.upload_date,
      updatedDate: data.updated_date,
      trailerUrl: data.trailer_url,
      steamUrl: data.steam_url,
      landscapeImage: data.landscape_image,
      edition: data.edition,
      genres: data.genres || [],
      downloads: data.downloads || 0,
      views: data.views || 0,
      uploaderName: data.uploader_name,
      uploaderId: data.uploader_id,
      likes: data.likes || 0,
      dislikes: data.dislikes || 0,
      reviews: reviewsData || [],
    }
  } catch (error) {
    console.error('Error in getItemById:', error)
    return null
  }
}

export async function getRelatedGames(category: string, excludeId: number): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('id,title,category,description,image,landscape_image,rating,trending,latest,size,release_date,upload_date,downloads,views,genres')
      .eq('category', category)
      .neq('id', excludeId)
      .order('downloads', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching related games:', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      image: item.image,
      landscapeImage: item.landscape_image,
      rating: item.rating,
      trending: item.trending,
      latest: item.latest,
      size: item.size,
      releaseDate: item.release_date,
      uploadDate: item.upload_date,
      downloads: item.downloads || 0,
      views: item.views || 0,
      genres: item.genres || [],
      longDescription: "",
      developer: "",
      publisher: "",
      keyFeatures: [],
      screenshots: [],
      note: "",
      trailerUrl: "",
      steamUrl: "",
      edition: "",
      systemRequirements: { recommended: { os: "", processor: "", memory: "", graphics: "", storage: "" } },
      androidRequirements: { recommended: { os: "", ram: "", storage: "", processor: "" } },
      sharedPinCode: "",
      sharedRarPassword: "",
      cloudDownloads: [],
      updatedDate: "",
      uploaderName: "",
      uploaderId: "",
      likes: 0,
      dislikes: 0,
    }))
  } catch (error) {
    console.error('Error in getRelatedGames:', error)
    return []
  }
}

export async function getPopularGameIds(limit: number = 20): Promise<number[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('id')
      .order('downloads', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching popular game ids:', error)
      return []
    }

    return (data || []).map((item) => item.id)
  } catch (error) {
    console.error('Error in getPopularGameIds:', error)
    return []
  }
}

export async function getItemsLight(): Promise<Item[]> {
  try {
    const { data, error } = await supabase
      .from('items')
      .select('id,title,category,description,image,landscape_image,rating,trending,latest,size,release_date,upload_date,downloads,views,genres')
      .order('upload_date', { ascending: false })

    if (error) {
      console.error('Error fetching items (light):', error)
      return []
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      description: item.description,
      image: item.image,
      landscapeImage: item.landscape_image,
      rating: item.rating,
      trending: item.trending,
      latest: item.latest,
      size: item.size,
      releaseDate: item.release_date,
      uploadDate: item.upload_date,
      downloads: item.downloads || 0,
      views: item.views || 0,
      genres: item.genres || [],
      longDescription: "",
      developer: "",
      publisher: "",
      keyFeatures: [],
      screenshots: [],
      note: "",
      trailerUrl: "",
      steamUrl: "",
      edition: "",
      systemRequirements: { recommended: { os: "", processor: "", memory: "", graphics: "", storage: "" } },
      androidRequirements: { recommended: { os: "", ram: "", storage: "", processor: "" } },
      sharedPinCode: "",
      sharedRarPassword: "",
      cloudDownloads: [],
      updatedDate: "",
      uploaderName: "",
      uploaderId: "",
      likes: 0,
      dislikes: 0,
    }))
  } catch (error) {
    console.error('Error in getItemsLight:', error)
    return []
  }
}

export async function addItem(itemData: Omit<Item, 'id' | 'uploadDate' | 'updatedDate'>): Promise<Item> {
  const now = new Date().toISOString()
  // Random initial downloads (100-200) and views (500-1200) — only set once on creation
  const initDownloads = itemData.downloads ?? (Math.floor(Math.random() * 101) + 100)
  const initViews = itemData.views ?? (Math.floor(Math.random() * 701) + 500)

  const dbItem = {
    title: itemData.title,
    category: itemData.category,
    description: itemData.description,
    long_description: itemData.longDescription,
    developer: itemData.developer,
    publisher: itemData.publisher,
    size: itemData.size,
    release_date: itemData.releaseDate || null,
    published_date: itemData.publishedDate || null,
    image: itemData.image,
    landscape_image: itemData.landscapeImage,
    rating: itemData.rating,
    trending: itemData.trending,
    latest: itemData.latest,
    key_features: itemData.keyFeatures,
    screenshots: itemData.screenshots,
    note: itemData.note,
    trailer_url: itemData.trailerUrl,
    steam_url: itemData.steamUrl,
    edition: itemData.edition,
    genres: itemData.genres || [],
    downloads: initDownloads,
    views: initViews,
    uploader_name: itemData.uploaderName,
    uploader_id: itemData.uploaderId,
    system_requirements: itemData.systemRequirements,
    android_requirements: itemData.androidRequirements,
    shared_pin_code: itemData.sharedPinCode,
    shared_rar_password: itemData.sharedRarPassword,
    cloud_downloads: itemData.cloudDownloads,
    upload_date: now,
    updated_date: now
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

  // Transform back to interface format and clean screenshots
  const cleanedScreenshots = (data.screenshots || []).map((url: string) => {
    if (!url) return url

    // Handle RiotPixels URLs with size modifiers and additional paths
    if (url.includes('riotpixels.net')) {
      // Find the pattern where .jpg is followed by size modifier (like .jpg.480p.jpg)
      // Look for .jpg followed by .[number]p.jpg
      const jpgSizePattern = url.match(/\.jpg\.\d+p\.jpg/)
      if (jpgSizePattern) {
        // Find the position of this pattern
        const patternIndex = url.indexOf(jpgSizePattern[0])
        // Find if there's a slash after this pattern
        const slashAfterPattern = url.indexOf('/', patternIndex)
        if (slashAfterPattern !== -1) {
          url = url.substring(0, slashAfterPattern)
        }
      }

      // Remove size modifiers: .240p.jpg, .480p.jpg, .1080p.jpg
      url = url.replace(/\.240p\.jpg$/, '.jpg')
      url = url.replace(/\.480p\.jpg$/, '.jpg')
      url = url.replace(/\.1080p\.jpg$/, '.jpg')

      // Also handle cases where the extension might be .jpg.jpg (double extension)
      url = url.replace(/\.jpg\.jpg$/, '.jpg')

      // Ensure HTTPS protocol
      url = url.replace(/^http:/, 'https:')
    }

    return url
  })

  return {
    ...data,
    longDescription: data.long_description,
    releaseDate: data.release_date,
    publishedDate: data.published_date,
    keyFeatures: data.key_features || [],
    screenshots: cleanedScreenshots,
    note: data.note || "",
    systemRequirements: data.system_requirements,
    androidRequirements: data.android_requirements,
    sharedPinCode: data.shared_pin_code,
    sharedRarPassword: data.shared_rar_password,
    cloudDownloads: data.cloud_downloads || [],
    uploadDate: data.upload_date,
    updatedDate: data.updated_date,
    trailerUrl: data.trailer_url,
    steamUrl: data.steam_url,
    landscapeImage: data.landscape_image,
    edition: data.edition,
    genres: data.genres || [],
    downloads: data.downloads || 0,
    views: data.views || 0,
    uploaderName: data.uploader_name,
    uploaderId: data.uploader_id,
    likes: data.likes || 0,
    dislikes: data.dislikes || 0,
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
  if (itemData.publisher !== undefined) dbUpdate.publisher = itemData.publisher
  if (itemData.size !== undefined) dbUpdate.size = itemData.size
  if (itemData.releaseDate !== undefined && itemData.releaseDate) dbUpdate.release_date = itemData.releaseDate
  if (itemData.publishedDate !== undefined && itemData.publishedDate) dbUpdate.published_date = itemData.publishedDate
  if (itemData.image !== undefined) dbUpdate.image = itemData.image
  if (itemData.rating !== undefined) dbUpdate.rating = itemData.rating
  if (itemData.trending !== undefined) dbUpdate.trending = itemData.trending
  if (itemData.latest !== undefined) dbUpdate.latest = itemData.latest
  if (itemData.keyFeatures !== undefined) dbUpdate.key_features = itemData.keyFeatures
  if (itemData.screenshots !== undefined) dbUpdate.screenshots = itemData.screenshots
  if (itemData.note !== undefined) dbUpdate.note = itemData.note
  if (itemData.systemRequirements !== undefined) dbUpdate.system_requirements = itemData.systemRequirements
  if (itemData.androidRequirements !== undefined) dbUpdate.android_requirements = itemData.androidRequirements
  if (itemData.sharedPinCode !== undefined) dbUpdate.shared_pin_code = itemData.sharedPinCode
  if (itemData.sharedRarPassword !== undefined) dbUpdate.shared_rar_password = itemData.sharedRarPassword
  if (itemData.cloudDownloads !== undefined) dbUpdate.cloud_downloads = itemData.cloudDownloads
  if (itemData.uploadDate !== undefined) dbUpdate.upload_date = itemData.uploadDate
  if (itemData.trailerUrl !== undefined) dbUpdate.trailer_url = itemData.trailerUrl
  if (itemData.steamUrl !== undefined) dbUpdate.steam_url = itemData.steamUrl
  if (itemData.landscapeImage !== undefined) dbUpdate.landscape_image = itemData.landscapeImage
  if (itemData.edition !== undefined) dbUpdate.edition = itemData.edition
  if (itemData.genres !== undefined) dbUpdate.genres = itemData.genres
  if (itemData.uploaderName !== undefined) dbUpdate.uploader_name = itemData.uploaderName
  if (itemData.uploaderId !== undefined) dbUpdate.uploader_id = itemData.uploaderId
  // NOTE: downloads and views are NOT updated here — they are managed separately
  
  // Automatically set updated_date to current timestamp whenever an item is edited
  dbUpdate.updated_date = new Date().toISOString()
  
  console.log('updateItem: attempting to update id=', id, 'type=', typeof id, 'body=', JSON.stringify(dbUpdate).slice(0, 100))

  const { data, error } = await supabase
    .from('items')
    .update(dbUpdate)
    .eq('id', id)
    .select()
    .single()

  console.log('updateItem result: data=', !!data, 'error=', error)
  if (error) {
    console.error('Error updating item:', error)
    console.error('Update attempted with id:', id, 'and data:', dbUpdate)
    return null
  }

  // Transform back to interface format
  return {
    ...data,
    longDescription: data.long_description,
    releaseDate: data.release_date,
    publishedDate: data.published_date,
    keyFeatures: data.key_features || [],
    screenshots: data.screenshots || [],
    note: data.note || "",
    systemRequirements: data.system_requirements,
    androidRequirements: data.android_requirements,
    sharedPinCode: data.shared_pin_code,
    sharedRarPassword: data.shared_rar_password,
    cloudDownloads: data.cloud_downloads || [],
    uploadDate: data.upload_date,
    updatedDate: data.updated_date,
    trailerUrl: data.trailer_url,
    steamUrl: data.steam_url,
    landscapeImage: data.landscape_image,
    edition: data.edition,
    genres: data.genres || [],
    downloads: data.downloads || 0,
    views: data.views || 0,
    uploaderName: data.uploader_name,
    uploaderId: data.uploader_id,
    likes: data.likes || 0,
    dislikes: data.dislikes || 0,
  }
}

export async function deleteItem(id: number): Promise<boolean> {
  try {
    // First, delete all associated comments
    const { error: commentsError } = await supabase
      .from('comments')
      .delete()
      .eq('item_id', id)

    if (commentsError) {
      console.error('Error deleting associated comments:', commentsError)
      // Continue with deletion even if comments fail to delete
    }

    // Then delete all associated download pages
    const { error: downloadPagesError } = await supabase
      .from('download_pages')
      .delete()
      .eq('game_id', id)

    if (downloadPagesError) {
      console.error('Error deleting associated download pages:', downloadPagesError)
      // Continue with item deletion even if download pages fail to delete
    }

    // Then delete the item itself
    const { error: itemError } = await supabase
      .from('items')
      .delete()
      .eq('id', id)

    if (itemError) {
      console.error('Error deleting item:', itemError)
      return false
    }

    console.log(`Successfully deleted item ${id}, all associated comments, and download pages`)
    return true
  } catch (error) {
    console.error('Error in deleteItem:', error)
    return false
  }
}