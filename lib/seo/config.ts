/**
 * SEO Site Configuration
 * Centralized configuration for site metadata and SEO settings.
 * 
 * Requirements: 1.1, 1.2
 */

// ============================================================================
// Site Configuration
// ============================================================================

export interface SiteConfig {
  name: string
  url: string
  description: string
  keywords: string[]
  author: string
  twitterHandle?: string
  locale: string
}

export const siteConfig: SiteConfig = {
  name: 'Mathy',
  url: 'https://matthy.netlify.app',
  description: 'Play free AI-generated math puzzles, memory grid challenges, and true/false equations. New games every hour. No signup required. Train your brain daily.',
  keywords: [
    'math games',
    'free math games',
    'brain training games',
    'online math practice',
    'memory games',
    'mental math',
    'math puzzles',
    'brain games online',
    'math challenge',
    'true false math',
    'memory grid game',
    'daily brain training',
  ],
  author: 'Mathy',
  locale: 'en_US',
}

// ============================================================================
// Game Types
// ============================================================================

export type GameType = 
  | 'math'
  | 'memory'
  | 'true_false'
  | 'ssc_cgl'
  | 'tictactoe'
  | 'speed_sort'
  | 'square_root'
  | 'percentage'
  | 'fraction'

export type Difficulty = 'easy' | 'medium' | 'hard'

export const validGameTypes: GameType[] = [
  'math',
  'memory',
  'true_false',
  'ssc_cgl',
  'tictactoe',
  'speed_sort',
  'square_root',
  'percentage',
  'fraction',
]

export const validDifficulties: Difficulty[] = ['easy', 'medium', 'hard']

// ============================================================================
// Game Metadata Configuration
// ============================================================================

export interface GameMetaConfig {
  title: string
  shortTitle: string
  description: string
  keywords: string[]
  category: string
}

export const gameMetaConfig: Record<GameType, GameMetaConfig> = {
  math: {
    title: 'Math Challenge',
    shortTitle: 'Math',
    description: 'Solve AI-generated math equations and test your mental arithmetic skills. Practice addition, subtraction, multiplication, and division.',
    keywords: ['math challenge', 'mental math', 'arithmetic practice', 'math equations'],
    category: 'Math',
  },
  memory: {
    title: 'Memory Grid',
    shortTitle: 'Memory',
    description: 'Test your visual memory with grid-based challenges. Remember patterns and improve your cognitive recall abilities.',
    keywords: ['memory game', 'visual memory', 'pattern recognition', 'memory training'],
    category: 'Memory',
  },
  true_false: {
    title: 'True or False Math',
    shortTitle: 'True/False',
    description: 'Quick-fire true or false math questions. Test your speed and accuracy with rapid equation verification.',
    keywords: ['true false math', 'quick math', 'equation verification', 'speed math'],
    category: 'Math',
  },
  ssc_cgl: {
    title: 'SSC CGL Practice',
    shortTitle: 'SSC CGL',
    description: 'Practice quantitative aptitude questions for SSC CGL and competitive exams. Improve your problem-solving skills.',
    keywords: ['ssc cgl', 'competitive exam', 'quantitative aptitude', 'exam practice'],
    category: 'Exam Prep',
  },
  tictactoe: {
    title: 'Math Tic-Tac-Toe',
    shortTitle: 'Tic-Tac-Toe',
    description: 'Play tic-tac-toe with a mathematical twist. Solve equations to claim your squares and beat the AI.',
    keywords: ['math tic tac toe', 'strategy game', 'math puzzle', 'brain game'],
    category: 'Strategy',
  },
  speed_sort: {
    title: 'Speed Sort',
    shortTitle: 'Speed Sort',
    description: 'Sort numbers as fast as you can. Test your numerical ordering skills and reaction time.',
    keywords: ['speed sort', 'number sorting', 'reaction game', 'quick thinking'],
    category: 'Speed',
  },
  square_root: {
    title: 'Square Root Challenge',
    shortTitle: 'Square Roots',
    description: 'Master square roots with progressive difficulty. Perfect for building mental math foundations.',
    keywords: ['square root', 'math practice', 'mental calculation', 'root finding'],
    category: 'Math',
  },
  percentage: {
    title: 'Percentage Problems',
    shortTitle: 'Percentages',
    description: 'Practice percentage calculations with real-world scenarios. Essential for everyday math skills.',
    keywords: ['percentage', 'percent calculation', 'math skills', 'practical math'],
    category: 'Math',
  },
  fraction: {
    title: 'Fraction Practice',
    shortTitle: 'Fractions',
    description: 'Work with fractions through interactive challenges. Add, subtract, multiply, and divide fractions.',
    keywords: ['fractions', 'fraction math', 'fraction practice', 'math fundamentals'],
    category: 'Math',
  },
}

// ============================================================================
// Difficulty Metadata
// ============================================================================

export interface DifficultyMetaConfig {
  label: string
  description: string
}

export const difficultyMetaConfig: Record<Difficulty, DifficultyMetaConfig> = {
  easy: {
    label: 'Easy',
    description: 'Perfect for beginners and warm-up sessions',
  },
  medium: {
    label: 'Medium',
    description: 'Balanced challenge for regular practice',
  },
  hard: {
    label: 'Hard',
    description: 'Advanced difficulty for experienced players',
  },
}

// ============================================================================
// Page Metadata Configuration
// ============================================================================

export interface PageMetaConfig {
  title: string
  description: string
  keywords?: string[]
  noIndex?: boolean
}

export const pageMetaConfig: Record<string, PageMetaConfig> = {
  '/': {
    title: 'Mathy — Free Math & Memory Brain Training Games',
    description: 'Play free AI-generated math puzzles, memory grid challenges, and true/false equations. New games every hour. No signup required. Train your brain daily.',
  },
  '/game': {
    title: 'Play Game',
    description: 'Solve AI-generated math equations, test your memory, or play true/false challenges. Pick your difficulty and start training your brain.',
  },
  '/leaderboard': {
    title: 'Leaderboard',
    description: 'See top scores and compete with players worldwide. Track your progress and climb the rankings.',
    keywords: ['leaderboard', 'high scores', 'rankings', 'competition'],
  },
  '/game/more': {
    title: 'More Games',
    description: 'Explore additional brain training games including speed sort, square roots, percentages, and fractions.',
    keywords: ['more games', 'brain games', 'math variety', 'extra challenges'],
  },
}

// ============================================================================
// URL Mapping Helpers
// ============================================================================

/**
 * Map URL mode parameter to GameType
 */
export function mapModeToGameType(mode: string | null | undefined): GameType {
  switch (mode) {
    case 'memory':
      return 'memory'
    case 'truefalse':
      return 'true_false'
    case 'ssccgl':
      return 'ssc_cgl'
    case 'tictactoe':
      return 'tictactoe'
    case 'more':
      return 'square_root' // Default for more games
    default:
      return 'math'
  }
}

/**
 * Map GameType to URL mode parameter
 */
export function mapGameTypeToMode(gameType: GameType): string {
  switch (gameType) {
    case 'memory':
      return 'memory'
    case 'true_false':
      return 'truefalse'
    case 'ssc_cgl':
      return 'ssccgl'
    case 'tictactoe':
      return 'tictactoe'
    case 'square_root':
    case 'percentage':
    case 'fraction':
    case 'speed_sort':
      return 'more'
    default:
      return 'math'
  }
}

/**
 * Check if a game type is valid
 */
export function isValidGameType(type: string): type is GameType {
  return validGameTypes.includes(type as GameType)
}

/**
 * Check if a difficulty is valid
 */
export function isValidDifficulty(diff: string): diff is Difficulty {
  return validDifficulties.includes(diff as Difficulty)
}

export default siteConfig
