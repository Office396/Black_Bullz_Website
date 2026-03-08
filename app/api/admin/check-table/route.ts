import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Try to query the table
    const { data, error } = await supabase
      .from('page_modifiers')
      .select('page')
      .limit(1)

    if (error) {
      console.error('Table check error:', error)
      return NextResponse.json({
        exists: false,
        error: error.message,
        code: error.code,
        hint: error.hint,
        details: error.details
      })
    }

    return NextResponse.json({
      exists: true,
      message: 'Table exists and is accessible',
      hasData: data && data.length > 0
    })
  } catch (error) {
    console.error('Table check failed:', error)
    return NextResponse.json({
      exists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
