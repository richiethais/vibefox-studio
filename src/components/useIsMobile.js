import { useEffect, useState } from 'react'

export default function useIsMobile(breakpoint = 920) {
  // Always start false for SSR hydration compatibility — useEffect syncs on client
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [breakpoint])

  return isMobile
}
