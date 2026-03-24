'use client'

import dynamic from 'next/dynamic'

const TicTacToeGame = dynamic(() => import('@/components/game/TicTacToeGame'), { ssr: false })

export default function TicTacToePage() {
  return <TicTacToeGame />
}
