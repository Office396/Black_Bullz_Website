import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    console.log("Contact form submission received:", {
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
    })

    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("Supabase config check:", {
      url: supabaseUrl ? "set" : "missing",
      key: supabaseKey ? "set" : "missing"
    })

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase configuration missing")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
    }

    // Save to Supabase database
    console.log("Attempting to save to database...")
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
        timestamp: new Date().toISOString(),
        status: "new",
      })
      .select()

    if (error) {
      console.error("Database error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
      return NextResponse.json({ success: false, error: `Database error: ${error.message}` }, { status: 500 })
    }

    console.log("Message saved successfully:", data)

    return NextResponse.json({ success: true, message: "Message sent successfully!" })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error("Supabase configuration missing")
      return NextResponse.json({ success: false, error: "Database not configured" }, { status: 500 })
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