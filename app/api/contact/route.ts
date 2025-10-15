import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Send email using a simple SMTP approach or alternative service
    // Since EmailJS doesn't work in server environments, let's use a different approach

    // For now, just save to database and return success
    // You can implement a proper email service later

    console.log("Contact form submission:", {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    })

    // Save to Supabase database
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
      console.error("Failed to save message to database:", error)
      return NextResponse.json({ success: false, error: "Failed to save message" }, { status: 500 })
    }

    console.log("Message saved to database successfully")

    return NextResponse.json({ success: true, message: "Message sent successfully!" })
  } catch (error) {
    console.error("Failed to process message:", error)
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