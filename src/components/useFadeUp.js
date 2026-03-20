import { useEffect, useRef } from 'react'

export function useFadeUp() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    
    const isMobile = window.innerWidth < 768
    
    // On mobile, use lower threshold so content appears sooner
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: isMobile ? 0.01 : 0.08, rootMargin: isMobile ? '50px 0px 0px 0px' : '0px 0px -28px 0px' }
    )
    el.querySelectorAll('.fade-up').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])

  return ref
}
