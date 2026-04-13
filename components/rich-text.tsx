import React from "react"

/** Renders text with basic markdown: **bold**, *italic*, __underline__, `code`, [link](url), and lists */
export function RichContent({ text }: { text: string }) {
  if (!text) return null
  
  // Use [\s\S] to match across newlines
  const parts = text.split(/(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|__[\s\S]*?__|`[\s\S]*?`|\[[\s\S]*?\]\([\s\S]*?\)|^- [\s\S]*?(?=\n|$))/gm)
  
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (!part) return null

        // Bold
        if (part.startsWith('**') && part.endsWith('**') && part.length >= 4)
          return <strong key={i} className="font-bold text-white">{part.slice(2, -2)}</strong>
        
        // Italic (make sure not to match single * if it's not closed correctly, though regex handles this)
        if (part.startsWith('*') && part.endsWith('*') && part.length >= 2 && !part.startsWith('**'))
          return <em key={i} className="italic text-white">{part.slice(1, -1)}</em>
          
        // Underline
        if (part.startsWith('__') && part.endsWith('__') && part.length >= 4)
          return <span key={i} className="underline decoration-[#9d4edd] decoration-2 underline-offset-4">{part.slice(2, -2)}</span>
          
        // Code
        if (part.startsWith('`') && part.endsWith('`') && part.length >= 2)
          return <code key={i} className="bg-[#2d1b54]/60 text-[#c77dff] px-1.5 py-0.5 rounded text-[13px] font-mono">{part.slice(1, -1)}</code>
          
        // Link
        const linkMatch = part.match(/^\[([\s\S]*?)\]\(([\s\S]*?)\)$/)
        if (linkMatch)
          return <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-[#c77dff] hover:text-white underline decoration-[#c77dff]/40 underline-offset-2 transition-colors font-medium">{linkMatch[1]}</a>
          
        // List Item
        if (part.startsWith('- '))
          return <span key={i} className="flex gap-2.5 my-1.5"><span className="text-[#9d4edd] font-bold mt-0.5">•</span><span>{part.slice(2)}</span></span>

        return <span key={i}>{part}</span>
      })}
    </span>
  )
}
