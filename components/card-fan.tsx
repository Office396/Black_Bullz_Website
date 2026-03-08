"use client"

import { useState } from "react"

interface CardFanProps {
  /** Array of image URLs to show as cards (can be fewer than count) */
  images: string[]
  /** Total game count in the collection */
  count: number
  /** Collection name (for alt text) */
  name: string
}

/**
 * Card fan animation:
 * - Default (stacked): cards sit neatly piled with tiny rotation offsets
 * - Hover (fanned): cards spread out UPWARD (translateY) so siblings aren't pushed
 *   and fan left/right with rotation; the count determines spread angle/spacing.
 */
export function CardFan({ images, count, name }: CardFanProps) {
  const [hovered, setHovered] = useState(false)

  // How many physical cards to render (1-5)
  const cardCount = Math.min(Math.max(images.length, 0), 5)

  // Fill missing images by cycling the available ones
  const cardImages = Array.from(
    { length: cardCount },
    (_, i) => images[i % images.length] || "/placeholder.svg"
  )

  function getTransform(i: number, total: number, fanned: boolean): string {
    if (!fanned) {
      // Stacked: tiny rotation so you can see multiple cards
      const rot = ((i - (total - 1) / 2) * 2.5).toFixed(2)
      return `rotate(${rot}deg)`
    }

    // Fanned: spread upward + outward
    const mid = (total - 1) / 2
    const t = i - mid // -mid … +mid, centre = 0

      // Rotation: up to ~18° at each edge, scales with card count
      const maxRot = Math.min(10 + total * 2, 18)
      const rot = (mid === 0) ? 0 : (t / mid) * maxRot

      // Horizontal spread (px): cards shift outward
      const maxSpread = Math.min(16 + total * 8, 44)
      const tx = (mid === 0) ? 0 : (t / mid) * maxSpread

    // Vertical lift: centre card goes highest; edges a bit lower
    const baseUp = 44
    const dropOff = Math.abs(t) * 5
    const ty = -(baseUp - dropOff)

    return `translateY(${ty}px) translateX(${tx}px) rotate(${rot}deg)`
  }

  function getTransition(i: number, total: number, fanned: boolean): string {
    if (fanned) {
      // Stagger outward from center: cards closer to edges go later
      const mid = (total - 1) / 2
      const delay = Math.abs(i - mid) * 35
      return `transform 0.38s cubic-bezier(0.34, 1.28, 0.64, 1) ${delay}ms, box-shadow 0.3s ease`
    } else {
      // Collapse back from edges first
      const mid = (total - 1) / 2
      const delay = (total - 1 - Math.abs(i - mid)) * 25
      return `transform 0.28s ease ${delay}ms, box-shadow 0.3s ease`
    }
  }

  return (
    <div
      className="relative w-full"
      style={{ paddingTop: "100%", cursor: "pointer" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card stack anchored to vertical center of the box */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ pointerEvents: "none" }}
      >
        {cardImages.map((src, i) => (
          <div
            key={i}
            className="absolute"
            style={{
              width: "60%",
              aspectRatio: "3/4",
              transform: getTransform(i, cardCount, hovered),
              transition: getTransition(i, cardCount, hovered),
              // Top card on hover = center card; stacked = last on top
              zIndex: hovered
                ? cardCount - Math.round(Math.abs(i - (cardCount - 1) / 2))
                : i,
              transformOrigin: "50% 85%",
              borderRadius: "8px",
              overflow: "hidden",
              boxShadow: hovered
                ? "0 10px 28px rgba(0,0,0,0.6)"
                : "0 3px 10px rgba(0,0,0,0.5)",
            }}
          >
            <img
              src={src}
              alt={`${name} ${i + 1}`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        ))}
      </div>
    </div>
  )
}
