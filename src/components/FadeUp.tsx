'use client'

import { useEffect, useRef, ReactNode } from 'react'

interface FadeUpProps {
  children: ReactNode
  /** Delay in ms before animation starts (default 0) */
  delay?: number
  /** Custom className for the wrapper div */
  className?: string
  /** Tag to render as (default 'div') */
  as?: keyof JSX.IntrinsicElements
}

export default function FadeUp({
  children,
  delay = 0,
  className = '',
  as: Tag = 'div',
}: FadeUpProps) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Start hidden
    el.style.opacity = '0'
    el.style.transform = 'translateY(32px)'
    el.style.transition = `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
          observer.disconnect()
        }
      },
      { threshold: 0.12 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    // @ts-expect-error — dynamic tag typing
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  )
}
