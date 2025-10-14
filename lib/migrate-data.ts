import { supabase } from './supabase'
import { promises as fs } from 'fs'
import path from 'path'

export async function migrateExistingData() {
  try {
    console.log('Starting data migration...')

    // Migrate items
    const itemsPath = path.join(process.cwd(), 'data', 'items.json')
    try {
      const itemsData = await fs.readFile(itemsPath, 'utf-8')
      const items = JSON.parse(itemsData)

      if (items.length > 0) {
        console.log(`Migrating ${items.length} items...`)

        // Clear existing items first
        await supabase.from('items').delete().neq('id', 0)

        // Insert items
        const { error } = await supabase.from('items').insert(items)
        if (error) throw error

        console.log('Items migrated successfully')
      }
    } catch (error) {
      console.log('No existing items to migrate or migration failed:', error)
    }

    // Migrate admin credentials
    const adminPath = path.join(process.cwd(), 'data', 'admin.json')
    try {
      const adminData = await fs.readFile(adminPath, 'utf-8')
      const admin = JSON.parse(adminData)

      console.log('Migrating admin credentials...')

      // Clear existing admin credentials
      await supabase.from('admin_credentials').delete().neq('id', 0)

      // Insert admin credentials
      const { error } = await supabase.from('admin_credentials').insert({
        username: admin.username,
        password: admin.password,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      if (error) throw error

      console.log('Admin credentials migrated successfully')
    } catch (error) {
      console.log('No existing admin credentials to migrate or migration failed:', error)
    }

    // Migrate comments
    const commentsPath = path.join(process.cwd(), 'data', 'comments.json')
    try {
      const commentsData = await fs.readFile(commentsPath, 'utf-8')
      const commentsStore = JSON.parse(commentsData)

      const flattenedComments: any[] = []

      Object.keys(commentsStore).forEach(itemId => {
        const comments = commentsStore[itemId]
        comments.forEach((comment: any) => {
          flattenedComments.push({
            item_id: parseInt(itemId),
            item_name: comment.itemName,
            author: comment.author,
            email: comment.email || '',
            avatar: comment.avatar || null,
            content: comment.content,
            timestamp: comment.timestamp,
            likes: comment.likes || 0,
            dislikes: comment.dislikes || 0,
            status: comment.status || 'new',
            parent_id: null
          })

          // Add replies
          if (comment.replies) {
            comment.replies.forEach((reply: any) => {
              flattenedComments.push({
                item_id: parseInt(itemId),
                item_name: reply.itemName || comment.itemName,
                author: reply.author,
                email: reply.email || '',
                avatar: reply.avatar || null,
                content: reply.content,
                timestamp: reply.timestamp,
                likes: reply.likes || 0,
                dislikes: reply.dislikes || 0,
                status: reply.status || 'new',
                parent_id: comment.id
              })
            })
          }
        })
      })

      if (flattenedComments.length > 0) {
        console.log(`Migrating ${flattenedComments.length} comments...`)

        // Clear existing comments
        await supabase.from('comments').delete().neq('id', 0)

        // Insert comments
        const { error } = await supabase.from('comments').insert(flattenedComments)
        if (error) throw error

        console.log('Comments migrated successfully')
      }
    } catch (error) {
      console.log('No existing comments to migrate or migration failed:', error)
    }

    console.log('Data migration completed!')
  } catch (error) {
    console.error('Migration failed:', error)
    throw error
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateExistingData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}