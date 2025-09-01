export interface Game {
  id: string
  title: string
  image: string
  rating: number
  downloads: string
  size: string
  date: string
  description: string
  category: "pc-games" | "android-games" | "software"
  requirements?: string[]
  features?: string[]
  trending?: boolean
  screenshots?: string[]
  downloadLink?: string
  rarPassword?: string
  mainPagePassword?: string
}

export const gameData: Record<string, Game[]> = {
  "pc-games": [
    {
      id: "cyberpunk-2077",
      title: "Cyberpunk 2077",
      image: "/cyberpunk-futuristic-game.png",
      rating: 4.5,
      downloads: "2.5M",
      size: "70 GB",
      date: "2024-01-15",
      category: "pc-games",
      description:
        "Cyberpunk 2077 is an open-world, action-adventure RPG set in the dark future of Night City — a dangerous megalopolis obsessed with power, glamour, and ceaseless body modification.",
      requirements: [
        "Windows 10 64-bit",
        "Intel Core i5-3570K or AMD FX-8310",
        "8 GB RAM",
        "NVIDIA GTX 780 or AMD Radeon RX 470",
        "70 GB available space",
      ],
      features: ["Open World RPG", "Character Customization", "Multiple Endings", "Cyberpunk Setting", "Action Combat"],
      trending: true,
      screenshots: ["/cyberpunk-screenshot1.png", "/cyberpunk-screenshot2.png"],
      downloadLink: "https://example.com/cyberpunk-2077",
      rarPassword: "password123",
      mainPagePassword: "admin123",
    },
    {
      id: "red-dead-redemption-2",
      title: "Red Dead Redemption 2",
      image: "/western-cowboy-game.png",
      rating: 4.8,
      downloads: "3.2M",
      size: "120 GB",
      date: "2024-01-10",
      category: "pc-games",
      description:
        "Red Dead Redemption 2 is an epic tale of life in America's unforgiving heartland. The game's vast and atmospheric world will also provide the foundation for a brand new online multiplayer experience.",
      requirements: [
        "Windows 10 64-bit",
        "Intel Core i5-2500K or AMD FX-6300",
        "8 GB RAM",
        "NVIDIA GTX 770 or AMD Radeon R9 280",
        "120 GB available space",
      ],
      features: ["Open World Western", "Story Campaign", "Online Multiplayer", "Horse Riding", "Hunting & Fishing"],
    },
    {
      id: "the-witcher-3",
      title: "The Witcher 3",
      image: "/fantasy-medieval-game.png",
      rating: 4.9,
      downloads: "4.1M",
      size: "50 GB",
      date: "2024-01-08",
      category: "pc-games",
      description:
        "The Witcher 3: Wild Hunt is a story-driven open world RPG set in a visually stunning fantasy universe full of meaningful choices and impactful consequences.",
      requirements: [
        "Windows 7 64-bit",
        "Intel Core i5-2500K or AMD Phenom II X4 940",
        "6 GB RAM",
        "NVIDIA GTX 660 or AMD Radeon HD 7870",
        "50 GB available space",
      ],
      features: ["Fantasy RPG", "Monster Hunting", "Magic System", "Multiple Endings", "DLC Expansions"],
    },
    {
      id: "grand-theft-auto-v",
      title: "Grand Theft Auto V",
      image: "/open-world-crime-game.png",
      rating: 4.6,
      downloads: "5.8M",
      size: "95 GB",
      date: "2024-01-05",
      category: "pc-games",
      description:
        "Grand Theft Auto V for PC offers players the option to explore the award-winning world of Los Santos and Blaine County in resolutions of up to 4K and beyond.",
      requirements: [
        "Windows 8.1 64-bit",
        "Intel Core i5 3470 or AMD X8 FX-8350",
        "8 GB RAM",
        "NVIDIA GTX 660 or AMD HD 7870",
        "95 GB available space",
      ],
      features: [
        "Open World Crime",
        "Three Protagonists",
        "Online Multiplayer",
        "Vehicle Customization",
        "Heist Missions",
      ],
    },
    {
      id: "assassins-creed-valhalla",
      title: "Assassin's Creed Valhalla",
      image: "/viking-warrior-game.png",
      rating: 4.3,
      downloads: "2.1M",
      size: "85 GB",
      date: "2024-01-03",
      category: "pc-games",
      description:
        "Become Eivor, a legendary Viking raider on a quest for glory. Explore England's Dark Ages as you raid your enemies, grow your settlement, and build your political power.",
      requirements: [
        "Windows 10 64-bit",
        "Intel Core i5-4460 or AMD Ryzen 3 1200",
        "8 GB RAM",
        "NVIDIA GTX 960 or AMD R9 380",
        "85 GB available space",
      ],
      features: [
        "Viking Adventure",
        "Settlement Building",
        "Raid Battles",
        "Historical Setting",
        "Character Progression",
      ],
    },
    {
      id: "call-of-duty-modern-warfare",
      title: "Call of Duty: Modern Warfare",
      image: "/military-shooter.png",
      rating: 4.4,
      downloads: "3.7M",
      size: "175 GB",
      date: "2024-01-01",
      category: "pc-games",
      description:
        "Call of Duty: Modern Warfare redefines the iconic series with a new engine delivering an immersive and photorealistic experience.",
      requirements: [
        "Windows 10 64-bit",
        "Intel Core i3-4340 or AMD FX-6300",
        "8 GB RAM",
        "NVIDIA GTX 670 or AMD Radeon HD 7950",
        "175 GB available space",
      ],
      features: ["Military Shooter", "Campaign Mode", "Multiplayer", "Battle Royale", "Cross-Platform Play"],
    },
  ],
  "android-games": [
    {
      id: "pubg-mobile",
      title: "PUBG Mobile",
      image: "/mobile-battle-royale.png",
      rating: 4.2,
      downloads: "5.6M",
      size: "2.5 GB",
      date: "2024-01-14",
      category: "android-games",
      description:
        "PUBG Mobile delivers the most intense free-to-play multiplayer action on mobile. Drop in, gear up, and compete in the original battle royale.",
      requirements: ["Android 5.1.1+", "3 GB RAM", "2.5 GB storage", "OpenGL ES 3.0"],
      features: ["Battle Royale", "100 Player Matches", "Multiple Maps", "Team Play", "Regular Updates"],
    },
    {
      id: "genshin-impact",
      title: "Genshin Impact",
      image: "/anime-mobile-rpg-game.png",
      rating: 4.7,
      downloads: "4.3M",
      size: "8.2 GB",
      date: "2024-01-12",
      category: "android-games",
      description:
        "Genshin Impact is an open-world action RPG that takes you on a journey across the fantastical world of Teyvat.",
      requirements: ["Android 7.0+", "4 GB RAM", "8 GB storage", "ARM64 processor"],
      features: ["Open World RPG", "Elemental Combat", "Character Collection", "Co-op Multiplayer", "Regular Events"],
    },
    {
      id: "call-of-duty-mobile",
      title: "Call of Duty Mobile",
      image: "/mobile-fps-shooter-game.png",
      rating: 4.5,
      downloads: "6.1M",
      size: "3.8 GB",
      date: "2024-01-09",
      category: "android-games",
      description:
        "Call of Duty: Mobile brings together maps, modes, weapons, and characters from across the Call of Duty franchise.",
      requirements: ["Android 5.1+", "3 GB RAM", "4 GB storage", "Adreno 530 or equivalent"],
      features: ["FPS Shooter", "Battle Royale", "Multiplayer Modes", "Iconic Maps", "Weapon Customization"],
    },
    {
      id: "minecraft-pe",
      title: "Minecraft PE",
      image: "/mobile-block-building-game.png",
      rating: 4.8,
      downloads: "7.2M",
      size: "1.2 GB",
      date: "2024-01-07",
      category: "android-games",
      description:
        "Minecraft is a game about placing blocks and going on adventures. Explore randomly generated worlds and build amazing things.",
      requirements: ["Android 4.2+", "1 GB RAM", "1.5 GB storage", "OpenGL ES 2.0"],
      features: ["Creative Building", "Survival Mode", "Multiplayer", "Infinite Worlds", "Regular Updates"],
    },
    {
      id: "among-us",
      title: "Among Us",
      image: "/mobile-social-deduction-game.png",
      rating: 4.1,
      downloads: "3.9M",
      size: "250 MB",
      date: "2024-01-06",
      category: "android-games",
      description:
        "Among Us is a multiplayer game of teamwork and betrayal. Play with 4-15 players online or via local WiFi as you attempt to prep your spaceship for departure.",
      requirements: ["Android 4.4+", "1 GB RAM", "300 MB storage", "Network connection"],
      features: ["Social Deduction", "Online Multiplayer", "Customization", "Multiple Maps", "Voice Chat"],
    },
    {
      id: "clash-royale",
      title: "Clash Royale",
      image: "/mobile-strategy-card-game.png",
      rating: 4.3,
      downloads: "4.7M",
      size: "180 MB",
      date: "2024-01-04",
      category: "android-games",
      description:
        "Clash Royale is a real-time multiplayer game starring the Royales, your favorite Clash characters and much more.",
      requirements: ["Android 4.1+", "1 GB RAM", "200 MB storage", "Network connection"],
      features: ["Strategy Card Game", "Real-time Battles", "Clan System", "Tournaments", "Card Collection"],
    },
  ],
  software: [
    {
      id: "adobe-photoshop-2024",
      title: "Adobe Photoshop 2024",
      image: "/photo-editing-software-interface.png",
      rating: 4.6,
      downloads: "3.2M",
      size: "2.8 GB",
      date: "2024-01-13",
      category: "software",
      description:
        "Adobe Photoshop is the world's most advanced image editing software. Create and enhance photographs, illustrations and 3D artwork.",
      requirements: ["Windows 10 64-bit v1903+", "8 GB RAM", "4 GB GPU VRAM", "4 GB storage"],
      features: ["Photo Editing", "Digital Art", "AI-Powered Tools", "Layer System", "Plugin Support"],
    },
    {
      id: "microsoft-office-365",
      title: "Microsoft Office 365",
      image: "/office-productivity-software.png",
      rating: 4.5,
      downloads: "5.1M",
      size: "4.2 GB",
      date: "2024-01-11",
      category: "software",
      description:
        "Microsoft 365 is a productivity suite that includes Word, Excel, PowerPoint, and more. Work anywhere with cloud-based apps.",
      requirements: ["Windows 10+", "4 GB RAM", "4 GB storage", "Internet connection"],
      features: ["Word Processing", "Spreadsheets", "Presentations", "Cloud Storage", "Collaboration Tools"],
    },
    {
      id: "visual-studio-code",
      title: "Visual Studio Code",
      image: "/code-editor-programming-software.png",
      rating: 4.9,
      downloads: "8.3M",
      size: "85 MB",
      date: "2024-01-09",
      category: "software",
      description:
        "Visual Studio Code is a lightweight but powerful source code editor which runs on your desktop and is available for Windows, macOS and Linux.",
      requirements: ["Windows 8+", "1 GB RAM", "200 MB storage", "1.6 GHz processor"],
      features: ["Code Editing", "Debugging", "Extensions", "Git Integration", "IntelliSense"],
    },
    {
      id: "vlc-media-player",
      title: "VLC Media Player",
      image: "/media-player-software-interface.png",
      rating: 4.7,
      downloads: "12.5M",
      size: "45 MB",
      date: "2024-01-08",
      category: "software",
      description:
        "VLC is a free and open source cross-platform multimedia player and framework that plays most multimedia files as well as DVDs, Audio CDs, VCDs.",
      requirements: ["Windows 7+", "512 MB RAM", "100 MB storage", "DirectX 9+"],
      features: ["Media Playback", "Format Support", "Streaming", "Subtitle Support", "Audio/Video Filters"],
    },
    {
      id: "winrar",
      title: "WinRAR",
      image: "/file-compression-software.png",
      rating: 4.2,
      downloads: "6.8M",
      size: "3.2 MB",
      date: "2024-01-06",
      category: "software",
      description:
        "WinRAR is a powerful archive manager. It can backup your data and reduce the size of email attachments, decompress RAR, ZIP and other files.",
      requirements: ["Windows XP+", "512 MB RAM", "10 MB storage", "x86/x64 processor"],
      features: [
        "File Compression",
        "Archive Creation",
        "Password Protection",
        "Repair Function",
        "Command Line Support",
      ],
    },
    {
      id: "steam",
      title: "Steam",
      image: "/gaming-platform-software.png",
      rating: 4.8,
      downloads: "15.2M",
      size: "1.5 GB",
      date: "2024-01-02",
      category: "software",
      description:
        "Steam is the ultimate destination for playing, discussing, and creating games. Join the community of millions of players worldwide.",
      requirements: ["Windows 10+", "512 MB RAM", "5 GB storage", "Internet connection"],
      features: ["Game Library", "Digital Store", "Community Features", "Workshop", "Cloud Saves"],
    },
  ],
}

export function getAllGames(): Game[] {
  return Object.values(gameData).flat()
}

export function getGameById(id: string): Game | undefined {
  return getAllGames().find((game) => game.id === id)
}

export function getGamesByCategory(category: string): Game[] {
  return gameData[category] || []
}

export function getTotalGameCount(): number {
  return getAllGames().length
}

export function getCategoryCount(category: string): number {
  return getGamesByCategory(category).length
}

export function getTrendingGames(): Game[] {
  return getAllGames()
    .filter((game) => game.trending)
    .slice(0, 10)
}

export function getLatestGames(limit?: number): Game[] {
  const sorted = getAllGames().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return limit ? sorted.slice(0, limit) : sorted
}

export function searchGames(query: string): Game[] {
  if (!query.trim()) return []

  const searchTerm = query.toLowerCase().trim()
  const results = getAllGames()
    .map((game) => {
      let score = 0

      // Title match (highest priority)
      if (game.title.toLowerCase().includes(searchTerm)) score += 10
      if (game.title.toLowerCase().startsWith(searchTerm)) score += 5

      // Category match
      if (game.category.toLowerCase().includes(searchTerm)) score += 8

      // Description match
      if (game.description.toLowerCase().includes(searchTerm)) score += 3

      // Features match
      if (game.features?.some((feature) => feature.toLowerCase().includes(searchTerm))) score += 6

      // Requirements match
      if (game.requirements?.some((req) => req.toLowerCase().includes(searchTerm))) score += 2

      // Partial word matches
      const words = searchTerm.split(" ")
      words.forEach((word) => {
        if (word.length > 2) {
          if (game.title.toLowerCase().includes(word)) score += 2
          if (game.description.toLowerCase().includes(word)) score += 1
        }
      })

      return { game, score }
    })
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((result) => result.game)

  return results
}
