import { supabase } from '../supabase'

export interface CarouselItem {
  id: string
  gameId: number
  landscapeImage: string
  logoImage: string
  order: number
}

export interface TrendingGame {
  gameId: number
  order: number
}

export interface GameOfTheDay {
  gameId: number
  trailerUrl: string
}

export interface Collection {
  id: string
  name: string
  gameIds: number[]
  order: number
}

export interface PageModifierData {
  carousel: CarouselItem[]
  trendingGames: TrendingGame[]
  gameOfTheDay: GameOfTheDay | null
  collections: Collection[]
}

// Get all page modifier data
export async function getPageModifierData(): Promise<PageModifierData> {
  try {
    const { data, error } = await supabase
      .from('page_modifiers')
      .select('*')
      .eq('page', 'home')
      .single()

    if (error) {
      console.error('Error fetching page modifier data:', error)
      // Return default empty data
      return {
        carousel: [],
        trendingGames: [],
        gameOfTheDay: null,
        collections: []
      }
    }

    return {
      carousel: data?.carousel || [],
      trendingGames: data?.trending_games || [],
      gameOfTheDay: data?.game_of_the_day || null,
      collections: data?.collections || []
    }
  } catch (error) {
    console.error('Error in getPageModifierData:', error)
    return {
      carousel: [],
      trendingGames: [],
      gameOfTheDay: null,
      collections: []
    }
  }
}

// Update carousel items
export async function updateCarousel(items: CarouselItem[]): Promise<boolean> {
  try {
    console.log('=== UPDATE CAROUSEL STORE ===')
    console.log('Items to save:', items.length)
    
    // First check if record exists
    const { data: existing, error: fetchError } = await supabase
      .from('page_modifiers')
      .select('*')
      .eq('page', 'home')
      .single()

    console.log('Existing record:', existing ? 'Found' : 'Not found')
    if (fetchError) console.log('Fetch error:', fetchError)

    if (existing) {
      // Update existing record
      console.log('Updating existing record...')
      const { error } = await supabase
        .from('page_modifiers')
        .update({ carousel: items })
        .eq('page', 'home')

      if (error) {
        console.error('Error updating carousel:', error)
        return false
      }
      console.log('✅ Carousel updated successfully')
    } else {
      // Insert new record
      console.log('Inserting new record...')
      const { error } = await supabase
        .from('page_modifiers')
        .insert({
          page: 'home',
          carousel: items,
          trending_games: [],
          game_of_the_day: null,
          collections: []
        })

      if (error) {
        console.error('Error inserting carousel:', error)
        return false
      }
      console.log('✅ Carousel inserted successfully')
    }

    return true
  } catch (error) {
    console.error('Error in updateCarousel:', error)
    return false
  }
}

// Update trending games
export async function updateTrendingGames(games: TrendingGame[]): Promise<boolean> {
  try {
    // First check if record exists
    const { data: existing } = await supabase
      .from('page_modifiers')
      .select('*')
      .eq('page', 'home')
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('page_modifiers')
        .update({ trending_games: games })
        .eq('page', 'home')

      if (error) {
        console.error('Error updating trending games:', error)
        return false
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('page_modifiers')
        .insert({
          page: 'home',
          carousel: [],
          trending_games: games,
          game_of_the_day: null,
          collections: []
        })

      if (error) {
        console.error('Error inserting trending games:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in updateTrendingGames:', error)
    return false
  }
}

// Update game of the day
export async function updateGameOfTheDay(game: GameOfTheDay | null): Promise<boolean> {
  try {
    // First check if record exists
    const { data: existing } = await supabase
      .from('page_modifiers')
      .select('*')
      .eq('page', 'home')
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('page_modifiers')
        .update({ game_of_the_day: game })
        .eq('page', 'home')

      if (error) {
        console.error('Error updating game of the day:', error)
        return false
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('page_modifiers')
        .insert({
          page: 'home',
          carousel: [],
          trending_games: [],
          game_of_the_day: game,
          collections: []
        })

      if (error) {
        console.error('Error inserting game of the day:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in updateGameOfTheDay:', error)
    return false
  }
}

// Update collections
export async function updateCollections(collections: Collection[]): Promise<boolean> {
  try {
    // First check if record exists
    const { data: existing } = await supabase
      .from('page_modifiers')
      .select('*')
      .eq('page', 'home')
      .single()

    if (existing) {
      // Update existing record
      const { error } = await supabase
        .from('page_modifiers')
        .update({ collections: collections })
        .eq('page', 'home')

      if (error) {
        console.error('Error updating collections:', error)
        return false
      }
    } else {
      // Insert new record
      const { error } = await supabase
        .from('page_modifiers')
        .insert({
          page: 'home',
          carousel: [],
          trending_games: [],
          game_of_the_day: null,
          collections: collections
        })

      if (error) {
        console.error('Error inserting collections:', error)
        return false
      }
    }

    return true
  } catch (error) {
    console.error('Error in updateCollections:', error)
    return false
  }
}
