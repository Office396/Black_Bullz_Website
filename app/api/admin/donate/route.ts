import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const PAGE = "donate"

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("page_modifiers")
      .select("donate_settings")
      .eq("page", PAGE)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 = row not found, that's fine
      console.error("[donate GET]", error)
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true, donate: data?.donate_settings || null })
  } catch (e) {
    console.error("[donate GET exception]", e)
    return NextResponse.json({ success: false, error: String(e) })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Check if row exists
    const { data: existing, error: fetchError } = await supabase
      .from("page_modifiers")
      .select("page")
      .eq("page", PAGE)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("[donate POST fetch]", fetchError)
      return NextResponse.json({ success: false, error: fetchError.message })
    }

    let saveError
    if (existing) {
      const { error } = await supabase
        .from("page_modifiers")
        .update({ donate_settings: body })
        .eq("page", PAGE)
      saveError = error
    } else {
      const { error } = await supabase
        .from("page_modifiers")
        .insert({ page: PAGE, donate_settings: body })
      saveError = error
    }

    if (saveError) {
      console.error("[donate POST save]", saveError)
      return NextResponse.json({ success: false, error: saveError.message })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[donate POST exception]", e)
    return NextResponse.json({ success: false, error: String(e) })
  }
}
