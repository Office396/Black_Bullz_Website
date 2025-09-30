import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

// In a real app, you'd use a database. For this demo, we'll use a JSON file
// as a simple persistent store on the server-side.
const messagesFilePath = path.join(process.cwd(), "messages.json")

async function getMessages(): Promise<any[]> {
  try {
    const data = await fs.readFile(messagesFilePath, "utf-8")
    return JSON.parse(data)
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return []
    }
    throw error
  }
}

async function saveMessages(messages: any[]) {
  await fs.writeFile(messagesFilePath, JSON.stringify(messages, null, 2))
}

export async function POST(request: Request) {
  try {
    const formData = await request.json()

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const messages = await getMessages()

    const newEntry = {
      id: Date.now(),
      name: formData.name.trim(),
      email: formData.email.trim(),
      subject: formData.subject.trim(),
      message: formData.message.trim(),
      timestamp: new Date().toISOString(),
      status: "new",
    }

    messages.unshift(newEntry) // Add new message to the beginning
    await saveMessages(messages)

    return NextResponse.json({ success: true, message: "Message sent successfully!" })
  } catch (error) {
    console.error("Failed to save message:", error)
    return NextResponse.json({ success: false, error: "Failed to send message" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const messages = await getMessages()
    return NextResponse.json({ success: true, data: messages })
  } catch (error) {
    console.error("Failed to get messages:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve messages" }, { status: 500 })
  }
}