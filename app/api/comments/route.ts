import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import {
  addComment,
  addReply,
  deleteCommentOrReply,
  flattenCommentsForAdmin,
  getComments,
  reactToComment,
  setCommentStatus,
} from "@/lib/server/data-store"
import { sendNotification } from "@/lib/server/user-store"

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

function forbidden(message: string) {
  return NextResponse.json({ error: message }, { status: 403 })
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const admin = searchParams.get("BullzGamez-Admin")
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
        const { itemId, itemName, author, email, content, avatar, userBadge, userBadgeColor } = body || {}
        if (!itemId || !itemName || !author || !content) return badRequest("Missing required fields")
        const updated = await addComment({ itemId: Number(itemId), itemName, author, email, content, avatar, userBadge, userBadgeColor })
        return NextResponse.json({ success: true, data: updated })
      }
      case "reply": {
        const { itemId, parentId, itemName, author, email, content, avatar, userBadge, userBadgeColor, adminToken } = body || {}
        if (!itemId || !parentId || !itemName || !author || !content) return badRequest("Missing required fields")
        const isAdmin = adminToken === "authenticated"
        const updated = await addReply({ itemId: Number(itemId), parentId: Number(parentId), itemName, author, email, content, avatar, userBadge, userBadgeColor, isAdmin })
        if (!isAdmin) {
          const { data: parentComment } = await supabase.from('comments').select('user_id, author').eq('id', parentId).single()
          if (parentComment?.user_id) {
            await sendNotification({ user_id: parentComment.user_id, title: 'New Reply', message: `${author} replied to your comment on ${itemName}`, type: 'info' })
          }
        }
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
      case "approve": {
        const { targetId, approvalStatus, adminToken } = body || {}
        if (adminToken !== "authenticated") return forbidden("Admin token required")
        if (!targetId) return badRequest("Missing targetId")
        const { data: comment } = await supabase.from('comments').select('user_id, author, item_name').eq('id', targetId).single()
        await supabase.from('comments').update({ approval_status: approvalStatus }).eq('id', targetId)
        if (comment?.user_id) {
          const statusText = approvalStatus === 'approved' ? 'approved' : 'rejected'
          await sendNotification({ user_id: comment.user_id, title: `Comment ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`, message: `Your comment on ${comment.item_name || 'a game'} has been ${statusText}`, type: approvalStatus === 'approved' ? 'success' : 'warning' })
        }
        return NextResponse.json({ success: true })
      }
      default:
        return badRequest("Unknown action")
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || "Server error" }, { status: 500 })
  }
}
