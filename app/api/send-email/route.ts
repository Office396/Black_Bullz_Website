import { NextResponse } from "next/server"
import { Resend } from "resend"

const ADMIN_EMAIL = "admin@blackbullz.com" // Your admin email
const SUPPORT_EMAIL = "support@blackbullz.com" // Your support email

export async function POST(request: Request) {
  try {
    const { to, subject, replyContent, originalMessage, customerName, messageDate } = await request.json()

    if (!to || !replyContent || !originalMessage) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ success: false, error: "RESEND_API_KEY not configured" }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)

    // Professional HTML email template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>BlackBullz Support Response</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f4f4f4;">
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#f4f4f4;">
    <tr>
      <td align="center" style="padding:20px 0;">
        <table role="presentation" style="width:600px;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:#1a1a2e;padding:30px 40px;text-align:center;border-bottom:3px solid #16213e;">
              <img src="https://blackbullz.com/bull-logo.png" alt="BlackBullz" style="width:60px;height:60px;margin-bottom:15px;">
              <h1 style="margin:0;color:#ffd700;font-size:24px;font-weight:bold;">BlackBullz Support</h1>
              <p style="margin:5px 0 0 0;color:#cccccc;font-size:14px;">Professional Gaming Solutions</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 20px 0;color:#333;font-size:18px;">Hello ${customerName || 'Valued Customer'},</h2>

              <div style="color:#555;line-height:1.6;margin-bottom:30px;">
                ${replyContent.replace(/\n/g, '<br>')}
              </div>

              <!-- Reply Details -->
              <div style="background:#f8f9fa;border-left:4px solid #ffd700;padding:20px;margin:30px 0;border-radius:4px;">
                <h3 style="margin:0 0 10px 0;color:#333;font-size:16px;">Your Original Message:</h3>
                <p style="margin:0;color:#666;font-size:14px;">${originalMessage}</p>
                <p style="margin:10px 0 0 0;color:#888;font-size:12px;">Sent on ${messageDate || new Date().toLocaleDateString()}</p>
              </div>

              <div style="border-top:1px solid #eee;padding-top:30px;text-align:center;">
                <p style="margin:0 0 15px 0;color:#666;font-size:14px;">
                  Need more help? Contact us anytime at <a href="mailto:${SUPPORT_EMAIL}" style="color:#ffd700;text-decoration:none;">${SUPPORT_EMAIL}</a>
                </p>
                <p style="margin:0;color:#999;font-size:12px;">
                  Visit our website: <a href="https://blackbullz.com" style="color:#ffd700;text-decoration:none;">blackbullz.com</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#16213e;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#cccccc;font-size:12px;">
                © 2024 BlackBullz. All rights reserved.<br>
                This email was sent to ${to}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

    const data = await resend.emails.send({
      from: `BlackBullz Support <${SUPPORT_EMAIL}>`,
      to: [to],
      subject: subject || `Re: ${originalMessage.substring(0, 50)}...`,
      html: htmlContent,
      text: replyContent, // Fallback text version
    })

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("Email send error:", error)
    return NextResponse.json({ success: false, error: "Failed to send email" }, { status: 500 })
  }
}