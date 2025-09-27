import { NextRequest, NextResponse } from "next/server"
import {
  addComment,
  addReply,
  deleteCommentOrReply,
  flattenCommentsForAdmin,
  getComments,
  reactToComment,
  setCommentStatus,
} from "@/lib/server/data-store"

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const admin = searchParams.get("admin")
    const itemIdStr = searchParams.get("itemId")

    if (admin === "1") {
      const rows = await flattenCommentsForAdmin()
      return NextResponse.json({ success: true, data: rows })
    }

    if (!itemIdStr) {
      return badRequest("Missing itemId")
    }

    const itemId = Number(itemIdStr)
    if (!Number.isFinite(itemId)) return badRequest("Invalid itemId")

    const list = await getComments(itemId)
    return NextResponse.json({ success: true, data: list })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const action = String(body?.action || "")

    switch (action) {
      case "add": {
        const { itemId, itemName, author, email, content, avatar } = body || {}
        if (!itemId || !itemName || !author || !content) return badRequest("Missing required fields")
        const updated = await addComment({ itemId: Number(itemId), itemName, author, email, content, avatar })
        return NextResponse.json({ success: true, data: updated })
      }
      case "reply": {
        const { itemId, parentId, itemName, author, email, content, avatar } = body || {}
        if (!itemId || !parentId || !itemName || !author || !content) return badRequest("Missing required fields")
        const updated = await addReply({ itemId: Number(itemId), parentId: Number(parentId), itemName, author, email, content, avatar })
        return NextResponse.json({ success: true, data: updated })
      }
      case "react": {
        const { itemId, targetId, reaction } = body || {}
        if (!itemId || !targetId || (reaction !== "like" && reaction !== "dislike")) return badRequest("Missing or invalid fields")
        const updated = await reactToComment({ itemId: Number(itemId), targetId: Number(targetId), reaction })
        return NextResponse.json({ success: true, data: updated })
      }
      case "delete": {
        const { itemId, targetId, adminToken } = body || {}
        if (adminToken !== "authenticated") return forbidden("Admin token required")
        if (!itemId || !targetId) return badRequest("Missing itemId or targetId")
        const { updated, deleted } = await deleteCommentOrReply(Number(itemId), Number(targetId))
        return NextResponse.json({ success: true, deleted, data: updated })
      }
      case "status": {
        const { itemId, targetId, status, adminToken } = body || {}
        if (adminToken !== "authenticated") return forbidden("Admin token required")
        if (!itemId || !targetId || (status !== "new" && status !== "read")) return badRequest("Missing or invalid fields")
        const updated = await setCommentStatus(Number(itemId), Number(targetId), status)
        return NextResponse.json({ success: true, data: updated })
      }
      default:
        return badRequest("Unknown action")
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 })
  }
}
