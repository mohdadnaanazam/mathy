'use client'
import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface MovingBorderProps {
  children:   React.ReactNode
  className?: string
  onClick?:   () => void
  as?:        React.ElementType
  href?:      string
  disabled?:  boolean
}

export function MovingBorder({ children, className, onClick, as: Tag = 'button', href, disabled }: MovingBorderProps) {
  const [hovered, setHovered] = useState(false)

  const props: Record<string, unknown> = {
    onClick,
    onMouseEnter: () => setHovered(true),
    onMouseLeave: () => setHovered(false),
    disabled,
  }
  if (href) props.href = href

  return (
    <Tag {...props}
      className={cn(
        'relative inline-flex items-center justify-center overflow-hidden rounded-xl p-[1px] transition-all duration-300',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}>
      {/* Spinning border */}
      <motion.span
        animate={{ rotate: hovered ? 360 : 0 }}
        transition={{ duration: 1.5, ease: 'linear', repeat: hovered ? Infinity : 0 }}
        className='absolute inset-0 rounded-xl'
        style={{
          background: 'conic-gradient(from 0deg, transparent 0deg, #ffffff 60deg, #909090 120deg, transparent 180deg)',
        }}
      />
      {/* Inner content */}
      <span className='relative z-10 flex items-center justify-center rounded-[11px] bg-bw-card px-8 py-4 w-full h-full'>
        {children}
      </span>
    </Tag>
  )
}
