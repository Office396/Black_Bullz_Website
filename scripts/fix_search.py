with open('components/header.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start = content.find('  const handleSearchInput = (value: string) => {')
depth = 0; found_open = False; end = -1
for idx in range(start, len(content)):
    c = content[idx]
    if c == '{': depth += 1; found_open = True
    elif c == '}':
        depth -= 1
        if found_open and depth == 0: end = idx + 1; break

new_func = (
    '  const handleSearchInput = (value: string) => {\n'
    '      setSearchQuery(value)\n'
    '      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)\n'
    '\n'
    '      const term = value.trim().toLowerCase()\n'
    '      if (!term) { setSearchResults([]); return }\n'
    '\n'
    '      const words = term.split(/\\s+/).filter(w => w.length > 0)\n'
    '      const results = allGamesRef.current\n'
    '        .map((item: SearchResult) => {\n'
    '          const title = item.title.toLowerCase()\n'
    '          const titleWords = title.split(/[\\s\\-_:()]+/).filter(w => w.length > 0)\n'
    '          let score = 0\n'
    '\n'
    '          if (title === term) return { ...item, score: 100000 }\n'
    '          if (title.startsWith(term)) score += 50000\n'
    '          if (title.includes(term)) score += 25000\n'
    '\n'
    '          let lastIdx = -1; let inOrder = true\n'
    '          for (const w of words) {\n'
    '            const i = title.indexOf(w, lastIdx + 1)\n'
    '            if (i === -1) { inOrder = false; break }\n'
    '            lastIdx = i\n'
    '          }\n'
    '          if (inOrder && words.length > 1) score += 10000\n'
    '\n'
    '          for (let i = 0; i < words.length; i++) {\n'
    '            for (let j = 0; j < titleWords.length; j++) {\n'
    '              if (titleWords[j] === words[i]) score += i === 0 && j === 0 ? 5000 : 2000\n'
    '              else if (titleWords[j].startsWith(words[i])) score += 1000\n'
    '              else if (titleWords[j].includes(words[i])) score += 500\n'
    '            }\n'
    '          }\n'
    '\n'
    '          if (words.length === 1) {\n'
    '            const chars = words[0].split("")\n'
    '            if (titleWords.length >= chars.length) {\n'
    '              const matches = chars.filter((c: string, i: number) => titleWords[i]?.[0] === c).length\n'
    '              if (matches === chars.length) score += 8000\n'
    '              else if (matches >= chars.length * 0.7) score += 3000\n'
    '            }\n'
    '          }\n'
    '\n'
    '          if (score < 1000) {\n'
    '            for (const sw of words) {\n'
    '              for (const tw of titleWords) {\n'
    '                const dist = getLevenshteinDistance(sw, tw)\n'
    '                const sim = 1 - dist / Math.max(sw.length, tw.length)\n'
    '                if (sim >= 0.7) score += Math.floor(sim * 800)\n'
    '              }\n'
    '            }\n'
    '          }\n'
    '\n'
    '          return { ...item, score }\n'
    '        })\n'
    '        .filter((item: any) => item.score > 0)\n'
    '        .sort((a: any, b: any) => b.score - a.score)\n'
    '        .slice(0, 8)\n'
    '\n'
    '      setSearchResults(results)\n'
    '    }'
)

result = content[:start] + new_func + content[end:]
with open('components/header.tsx', 'w', encoding='utf-8') as f:
    f.write(result)
print('Done')
