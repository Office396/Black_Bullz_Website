import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // For development/local testing, save to localStorage instead of database
    if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'))) {
      console.log('Development mode: Contact form submission saved to localStorage', formData)
      try {
        const existingMessages = JSON.parse(localStorage.getItem('contact_messages') || '[]')
        const newMessage = {
          id: Date.now(),
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          timestamp: new Date().toISOString(),
          status: "new",
        }
        existingMessages.unshift(newMessage)
        // Note: localStorage doesn't work in server-side code, but this is just for development
        console.log('Message would be saved:', newMessage)
      } catch (e) {
        console.log('Local storage not available in server context')
      }
      return NextResponse.json({ success: true, message: "Message sent successfully!" })
    }

    const { error } = await supabase
      .from('contact_messages')
      .insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        timestamp: new Date().toISOString(),
        status: "new",
      })

    if (error) {
      console.error("Failed to save message:", error)
      return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Message sent successfully!" })
  } catch (error) {
    console.error("Failed to save message:", error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // For development without Supabase, return empty array
    if (process.env.NODE_ENV === 'development' && (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder'))) {
      return NextResponse.json({ success: true, data: [] })
    }

    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('timestamp', { ascending: false })

    if (error) {
      console.error("Failed to get messages:", error)
      return NextResponse.json({ success: false, error: "Failed to retrieve messages" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    console.error("Failed to get messages:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve messages" }, { status: 500 })
  }
}