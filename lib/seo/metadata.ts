/**
 * SEO Metadata Generation
 * Functions for generating page metadata, Open Graph tags, Twitter cards, and JSON-LD.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 12.1, 12.2, 12.3
 */

import type { Metadata } from 'next'
import {
  siteConfig,
  gameMetaConfig,
  difficultyMetaConfig,
  type GameType,
  type Difficulty,
  type SiteConfig,
  isValidGameType,
  isValidDifficulty,
  mapGameTypeToMode,
} from './config'

// ============================================================================
// Types
// ============================================================================

export interface GamePageParams {
  gameType: GameType
  difficulty?: Difficulty
  moreType?: string // For /game/more?type=speed_sort etc.
}

export interface OpenGraphData {
  type: 'website' | 'article' | 'game'
  title: string
  description: string
  url: string
  siteName: string
  locale: string
  images?: Array<{
    url: string
    width?: number
    height?: number
    alt?: string
  }>
}

export interface TwitterCardData {
  card: 'summary' | 'summary_large_image'
  title: string
  description: string
  site?: string
  creator?: string
}

export interface GameJsonLd {
  '@context': string
  '@type': string
  name: string
  url: string
  description: string
  applicationCategory: string
  operatingSystem: string
  offers: {
    '@type': string
    price: string
    priceCurrency: string
  }
  genre: string[]
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Capitalize first letter of a string
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/**
 * Get game title for metadata
 */
function getGameTitle(gameType: GameType): string {
  const config = gameMetaConfig[gameType]
  return config?.title || 'Brain Training Game'
}

/**
 * Get game description for metadata
 */
function getGameDescription(gameType: GameType, difficulty?: Difficulty): string {
  const gameConfig = gameMetaConfig[gameType]
  const baseDesc = gameConfig?.description || 'Train your brain with AI-generated challenges.'
  
  if (difficulty) {
    const diffConfig = difficultyMetaConfig[difficulty]
    return `${baseDesc} ${diffConfig.description}.`
  }
  
  return baseDesc
}

/**
 * Build canonical URL for a game page
 * 
 * Preconditions:
 * - gameType is a valid GameType
 * - difficulty is either a valid Difficulty or undefined
 * 
 * Postconditions:
 * - Returns a valid absolute URL
 * - URL correctly encodes game type and difficulty parameters
 */
export function buildCanonicalUrl(
  gameType: GameType,
  difficulty?: Difficulty,
  baseUrl: string = siteConfig.url
): string {
  const mode = mapGameTypeToMode(gameType)
  const params = new URLSearchParams()
  
  if (mode !== 'math') {
    params.set('mode', mode)
  }
  
  if (difficulty) {
    params.set('difficulty', difficulty)
  }
  
  const queryString = params.toString()
  return queryString ? `${baseUrl}/game?${queryString}` : `${baseUrl}/game`
}

/**
 * Build keywords array for a game page
 */
function buildKeywords(gameType: GameType, difficulty?: Difficulty): string[] {
  const gameConfig = gameMetaConfig[gameType]
  const keywords = [...siteConfig.keywords, ...(gameConfig?.keywords || [])]
  
  if (difficulty) {
    keywords.push(`${difficulty} math games`, `${difficulty} brain training`)
  }
  
  return [...new Set(keywords)] // Remove duplicates
}

/**
 * Format title to be within 30-60 characters
 * 
 * Postconditions:
 * - Returns title between 30-60 characters
 */
function formatTitle(gameTitle: string, diffLabel: string, siteName: string): string {
  // Try full format first: "Game Title - Difficulty | Site"
  if (diffLabel) {
    const fullTitle = `${gameTitle} - ${diffLabel} | ${siteName}`
    if (fullTitle.length >= 30 && fullTitle.length <= 60) {
      return fullTitle
    }
    
    // Try shorter format: "Game - Difficulty | Site"
    const shortTitle = `${gameTitle} - ${diffLabel} | ${siteName}`
    if (shortTitle.length <= 60) {
      return shortTitle.length >= 30 ? shortTitle : `Play ${shortTitle}`
    }
  }
  
  // Without difficulty: "Game Title | Site"
  const basicTitle = `${gameTitle} | ${siteName}`
  if (basicTitle.length >= 30 && basicTitle.length <= 60) {
    return basicTitle
  }
  
  // Pad if too short
  if (basicTitle.length < 30) {
    return `Play ${gameTitle} - Brain Training | ${siteName}`
  }
  
  // Truncate if too long
  return basicTitle.slice(0, 57) + '...'
}

/**
 * Ensure description is within 100-160 characters
 */
function formatDescription(description: string): string {
  if (description.length >= 100 && description.length <= 160) {
    return description
  }
  
  if (description.length < 100) {
    // Pad with additional context
    const padded = `${description} Train your brain daily with free AI-generated challenges.`
    return padded.length <= 160 ? padded : padded.slice(0, 157) + '...'
  }
  
  // Truncate if too long
  return description.slice(0, 157) + '...'
}

// ============================================================================
// Open Graph Generation
// ============================================================================

/**
 * Build Open Graph data for a game page
 * 
 * Requirements: 1.3
 */
export function buildOpenGraph(
  title: string,
  description: string,
  url: string,
  config: SiteConfig = siteConfig
): OpenGraphData {
  return {
    type: 'website',
    title,
    description,
    url,
    siteName: config.name,
    locale: config.locale,
  }
}

// ============================================================================
// Twitter Card Generation
// ============================================================================

/**
 * Build Twitter card data
 * 
 * Requirements: 1.4
 */
export function buildTwitterCard(
  title: string,
  description: string,
  config: SiteConfig = siteConfig
): TwitterCardData {
  return {
    card: 'summary_large_image',
    title,
    description,
    site: config.twitterHandle,
  }
}

// ============================================================================
// JSON-LD Generation
// ============================================================================

/**
 * Build JSON-LD structured data for a game page
 * 
 * Requirements: 1.5
 */
export function buildGameJsonLd(
  gameType: GameType,
  difficulty: Difficulty | undefined,
  config: SiteConfig = siteConfig
): GameJsonLd {
  const gameConfig = gameMetaConfig[gameType]
  const url = buildCanonicalUrl(gameType, difficulty, config.url)
  
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${config.name} - ${gameConfig.title}`,
    url,
    description: gameConfig.description,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    genre: ['Educational', 'Puzzle', 'Brain Training', gameConfig.category],
  }
}

// ============================================================================
// Main Metadata Generation
// ============================================================================

/**
 * Generate complete metadata for a game page
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6
 * 
 * Preconditions:
 * - gameType is a valid GameType enum value
 * - config contains valid site configuration
 * - difficulty is either a valid Difficulty or undefined
 * 
 * Postconditions:
 * - Returns complete Metadata object
 * - Title length is between 30-60 characters
 * - Description length is between 100-160 characters
 * - All required Open Graph fields are present
 */
export function generateGameMetadata(
  params: GamePageParams,
  config: SiteConfig = siteConfig
): Metadata {
  const { gameType, difficulty } = params
  
  // Validate inputs and use defaults if invalid
  const validGameType = isValidGameType(gameType) ? gameType : 'math'
  const validDifficulty = difficulty && isValidDifficulty(difficulty) ? difficulty : undefined
  
  // Build title
  const gameTitle = getGameTitle(validGameType)
  const diffLabel = validDifficulty ? capitalize(validDifficulty) : ''
  const title = formatTitle(gameTitle, diffLabel, config.name)
  
  // Build description
  const rawDescription = getGameDescription(validGameType, validDifficulty)
  const description = formatDescription(rawDescription)
  
  // Build canonical URL
  const canonicalUrl = buildCanonicalUrl(validGameType, validDifficulty, config.url)
  
  // Build keywords
  const keywords = buildKeywords(validGameType, validDifficulty)
  
  // Build Open Graph
  const openGraph = buildOpenGraph(title, description, canonicalUrl, config)
  
  // Build Twitter card
  const twitter = buildTwitterCard(title, description, config)
  
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      ...openGraph,
      type: 'website',
    },
    twitter,
  }
}

/**
 * Generate metadata with error handling and fallback
 * 
 * Requirements: 12.1, 12.2, 12.3
 * 
 * If generateMetadata throws due to invalid game type or missing config,
 * falls back to default site metadata.
 */
export function generateGameMetadataSafe(
  params: GamePageParams,
  config: SiteConfig = siteConfig
): Metadata {
  try {
    const metadata = generateGameMetadata(params, config)
    
    // Validate required Open Graph fields
    if (!metadata.openGraph?.title || !metadata.openGraph?.description) {
      throw new Error('Missing required Open Graph fields')
    }
    
    return metadata
  } catch (error) {
    // Log error for monitoring
    console.error('[SEO] Metadata generation failed:', error)
    
    // Return fallback metadata
    return {
      title: `Play Game | ${config.name}`,
      description: config.description,
      keywords: config.keywords,
      openGraph: {
        type: 'website',
        title: config.name,
        description: config.description,
        url: config.url,
        siteName: config.name,
        locale: config.locale,
      },
      twitter: {
        card: 'summary_large_image',
        title: config.name,
        description: config.description,
      },
    }
  }
}

/**
 * Generate JSON-LD script content for embedding in page
 */
export function generateJsonLdScript(
  gameType: GameType,
  difficulty?: Difficulty,
  config: SiteConfig = siteConfig
): string {
  const jsonLd = buildGameJsonLd(gameType, difficulty, config)
  return JSON.stringify(jsonLd)
}

export default generateGameMetadata
