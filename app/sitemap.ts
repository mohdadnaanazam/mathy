import type { MetadataRoute } from 'next'
import { siteConfig, validGameTypes, validDifficulties, mapGameTypeToMode } from '@/lib/seo'

const BASE = siteConfig.url

/**
 * Generate sitemap with all game type and difficulty combinations
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE}/leaderboard`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
  ]
  
  // Game pages - all game type and difficulty combinations
  const gamePages: MetadataRoute.Sitemap = []
  
  // Main game page (math default)
  gamePages.push({
    url: `${BASE}/game`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.9,
  })
  
  // Game pages with mode parameter
  for (const gameType of validGameTypes) {
    const mode = mapGameTypeToMode(gameType)
    
    // Skip math as it's the default
    if (mode === 'math') continue
    
    // Base game type page
    gamePages.push({
      url: `${BASE}/game?mode=${mode}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    })
    
    // Game type with each difficulty
    for (const difficulty of validDifficulties) {
      gamePages.push({
        url: `${BASE}/game?mode=${mode}&difficulty=${difficulty}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
      })
    }
  }
  
  // Math game with difficulties (default mode)
  for (const difficulty of validDifficulties) {
    gamePages.push({
      url: `${BASE}/game?difficulty=${difficulty}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    })
  }
  
  // More games page
  gamePages.push({
    url: `${BASE}/game/more`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  })
  
  // Tic-tac-toe page
  gamePages.push({
    url: `${BASE}/game/tictactoe`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  })
  
  return [...staticPages, ...gamePages]
}
