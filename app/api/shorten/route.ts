import { NextResponse } from "next/server"

// Prefer environment variables. These fallbacks are for immediate functionality during development.
const GP_LINKS_API_TOKEN = process.env.GP_LINKS_API_TOKEN || "b6bc57fccf0a18409483ce920d4a611acbb23de1"
const V2_LINKS_API_TOKEN = process.env.V2_LINKS_API_TOKEN || "dda37e26b732c2c143a0f4e3de09bb4edfb8ee26"

function generateAlias(gameId?: number, cloudIndex?: number): string {
  // Providers limit alias to 30 chars. Use a compact, safe, alphanumeric alias.
  const g = Math.abs(Number(gameId || 0)).toString(36).slice(-6) // up to 6
  const c = cloudIndex !== undefined ? `c${Math.abs(Number(cloudIndex)).toString(36).slice(-2)}` : '' // up to 3
  const t = Date.now().toString(36).slice(-4) // 4
  const r = Math.random().toString(36).slice(2, 6) // 4
  const alias = `g${g}${c}${t}${r}` // total <= 1+6+3+4+4 = 18
  return alias.slice(0, 28) // hard cap under 30
}

async function shortenWithGPLinks(originalUrl: string, alias: string) {
  try {
    const textApiUrl = `https://api.gplinks.com/api?api=${GP_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}&format=text`
    const textResp = await fetch(textApiUrl, { method: "GET" })
    if (textResp.ok) {
      const txt = (await textResp.text()).trim()
      if (txt && txt.startsWith("http")) {
        return { success: true as const, shortenedUrl: txt, provider: "gplinks" as const }
      }
    }
  } catch (_) {}

  try {
    const jsonApiUrl = `https://api.gplinks.com/api?api=${GP_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}`
    const jsonResp = await fetch(jsonApiUrl, { method: "GET" })
    if (jsonResp.ok) {
      const data = await jsonResp.json()
      const candidate = data?.shortenedUrl || data?.shorturl || data?.url
      if (candidate && typeof candidate === "string") {
        return { success: true as const, shortenedUrl: candidate, provider: "gplinks" as const }
      }
      if (data?.status === "error") {
        return { success: false as const, error: data?.message || "GP Links returned error" }
      }
    }
  } catch (e: any) {
    return { success: false as const, error: e?.message || "GP Links fetch failed" }
  }

  return { success: false as const, error: "GP Links methods failed" }
}

async function shortenWithV2Links(originalUrl: string, alias: string) {
  try {
    const textApiUrl = `https://v2links.com/api?api=${V2_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}&format=text`
    const textResp = await fetch(textApiUrl, { method: "GET" })
    if (textResp.ok) {
      const txt = (await textResp.text()).trim()
      if (txt && txt.startsWith("http")) {
        return { success: true as const, shortenedUrl: txt, provider: "v2links" as const }
      }
    }
  } catch (_) {}

  try {
    const jsonApiUrl = `https://v2links.com/api?api=${V2_LINKS_API_TOKEN}&url=${encodeURIComponent(originalUrl)}&alias=${alias}`
    const jsonResp = await fetch(jsonApiUrl, { method: "GET" })
    if (jsonResp.ok) {
      const data = await jsonResp.json()
      const candidate = data?.shortenedUrl || data?.shorturl || data?.url
      if (candidate && typeof candidate === "string") {
        return { success: true as const, shortenedUrl: candidate, provider: "v2links" as const }
      }
      if (data?.status === "error") {
        return { success: false as const, error: data?.message || "V2Links returned error" }
      }
    }
  } catch (e: any) {
    return { success: false as const, error: e?.message || "V2Links fetch failed" }
  }

  return { success: false as const, error: "V2Links methods failed" }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { url, gameId, cloudIndex }: { url?: string; gameId?: number; cloudIndex?: number } = body || {}

    if (!url || typeof url !== "string") {
      return NextResponse.json({ success: false, error: "Missing or invalid 'url'" }, { status: 400 })
    }

    const alias = generateAlias(gameId, cloudIndex)

    // Randomize provider order for load spreading
    const tryGPFirst = Math.random() < 0.5

    if (tryGPFirst) {
      const gp = await shortenWithGPLinks(url, alias)
      if ((gp as any).success) return NextResponse.json(gp)

      const v2 = await shortenWithV2Links(url, alias)
      if ((v2 as any).success) return NextResponse.json(v2)

      return NextResponse.json({ success: false, error: `Both services failed. GP: ${(gp as any).error || "n/a"}, V2: ${(v2 as any).error || "n/a"}` }, { status: 502 })
    } else {
      const v2 = await shortenWithV2Links(url, alias)
      if ((v2 as any).success) return NextResponse.json(v2)

      const gp = await shortenWithGPLinks(url, alias)
      if ((gp as any).success) return NextResponse.json(gp)

      return NextResponse.json({ success: false, error: `Both services failed. V2: ${(v2 as any).error || "n/a"}, GP: ${(gp as any).error || "n/a"}` }, { status: 502 })
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: `Server error: ${err?.message || "unknown"}` }, { status: 500 })
  }
}
