import { useEffect, useRef } from 'react'

export function useFadeUp(deps = []) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08, rootMargin: '0px 0px -28px 0px' }
    )
    el.querySelectorAll('.fade-up:not(.visible)').forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, deps)

  return ref
}
