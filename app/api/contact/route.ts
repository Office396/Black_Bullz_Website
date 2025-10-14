import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
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
