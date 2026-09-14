import { useState, useEffect } from 'react'

export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth <= breakpoint
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mql = window.matchMedia(`(max-width: ${breakpoint}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }

    // Immediate check
    onChange()

    mql.addEventListener('change', onChange)
    window.addEventListener('resize', onChange)

    return () => {
      mql.removeEventListener('change', onChange)
      window.removeEventListener('resize', onChange)
    }
  }, [breakpoint])

  return isMobile
}
