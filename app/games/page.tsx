import { getItems } from "@/lib/server/items-store"
import { AllGamesClient } from "./client"

export default async function AllGamesPage() {
  let items: any[] = []
  try {
    items = await getItems()
  } catch (error) {
    console.error("Error fetching items:", error)
  }
  return <AllGamesClient initialItems={items} />
}
