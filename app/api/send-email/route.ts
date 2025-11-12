import { NextResponse } from "next/server"
import { Resend } from "resend"

export async function POST(request: Request) {
  try {
    const { to, subject, html, text } = await request.json()

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: "RESEND_API_KEY not configured" }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    const data = await resend.emails.send({
      from: "BlackBullz <noreply@blackbullz.com>",
      to: [to],
      subject: subject,
      html: html,
      text: text,
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}