import { useEffect, useRef } from 'react'

/**
 * Schedules fetchFn to fire at the top of every hour, then every 60 minutes.
 * Call this once per view — pass the same fetchFn used for manual refresh.
 */
export function useAutoRefresh(fetchFn) {
  const hourTimerRef = useRef(null)

  useEffect(() => {
    function msUntilNextHour() {
      const now = new Date()
      const next = new Date(now)
      next.setHours(now.getHours() + 1, 0, 0, 0)
      return next.getTime() - now.getTime()
    }

    // Fire at next :00, then every 60 min
    hourTimerRef.current = setTimeout(() => {
      fetchFn(true)
      hourTimerRef.current = setInterval(() => fetchFn(true), 60 * 60 * 1000)
    }, msUntilNextHour())

    return () => {
      clearTimeout(hourTimerRef.current)
      clearInterval(hourTimerRef.current)
    }
  }, [fetchFn])
}
