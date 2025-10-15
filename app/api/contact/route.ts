import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Send email using EmailJS REST API
    const serviceId = process.env.EMAILJS_SERVICE_ID
    const templateId = process.env.EMAILJS_TEMPLATE_ID
    const publicKey = process.env.EMAILJS_PUBLIC_KEY

    console.log("EmailJS Config:", { serviceId: serviceId ? "set" : "missing", templateId: templateId ? "set" : "missing", publicKey: publicKey ? "set" : "missing" })

    if (!serviceId || !templateId || !publicKey) {
      console.error("EmailJS configuration missing")
      return NextResponse.json({ success: false, error: "Email service not configured" }, { status: 500 })
    }

    const templateParams = {
      from_name: formData.name.trim(),
      from_email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      to_email: "blackbullzweb@gmail.com", // Your email address
    }

    console.log("Sending email with params:", templateParams)

    try {
      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          template_id: templateId,
          user_id: publicKey,
          template_params: templateParams,
        }),
      })

      console.log("EmailJS response status:", response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("EmailJS API error:", response.status, errorText)
        return NextResponse.json({ success: false, error: `Failed to send email: ${errorText}` }, { status: 500 })
      }

      console.log("Email sent successfully")
    } catch (emailError) {
      console.error("Failed to send email:", emailError)
      return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
    }

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
      // Don't fail the request if database save fails, since email was sent
    } else {
      console.log("Message saved to database successfully")
    }

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