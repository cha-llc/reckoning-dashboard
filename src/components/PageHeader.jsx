import React from 'react'

/**
 * Shared PageHeader with live sync indicator, manual refresh, hourly auto-refresh.
 * Drop into any view — pass fetchFn, loading, lastSync, isLive, eyebrow, title, sub.
 */

function msUntilNextHour() {
  const now = new Date()
  const next = new Date(now)
  next.setHours(now.getHours() + 1, 0, 0, 0)
  return next.getTime() - now.getTime()
}

export { msUntilNextHour }

export default function PageHeader({ eyebrow, title, sub, loading, lastSync, isLive, onRefresh, children }) {
  const [spinning, setSpinning]   = React.useState(false)
  const [nextHourMs, setNextHourMs] = React.useState(msUntilNextHour())

  // Countdown ticks every 30s
  React.useEffect(() => {
    const t = setInterval(() => setNextHourMs(msUntilNextHour()), 30000)
    return () => clearInterval(t)
  }, [])

  // Spin while loading
  React.useEffect(() => {
    if (loading) setSpinning(true)
    else setTimeout(() => setSpinning(false), 400)
  }, [loading])

  const syncAgoMins  = lastSync ? Math.round((Date.now() - new Date(lastSync).getTime()) / 60000) : null
  const nextHourMins = Math.max(1, Math.round(nextHourMs / 60000))

  const handleRefresh = () => {
    setSpinning(true)
    onRefresh()
  }

  return (
    <div className="page-header">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div className="page-eyebrow">{eyebrow || 'Reckoning Dashboard'}</div>
      <div className="page-title">{title}</div>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4, flexWrap:'wrap' }}>
        {sub && <div className="page-sub" style={{ margin:0 }}>{sub}</div>}

        {/* Live dot + sync time */}
        <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10,
          color: loading ? 'var(--gold)' : isLive ? '#22c55e' : 'var(--muted)' }}>
          <div style={{
            width:6, height:6, borderRadius:'50%',
            background: loading ? 'var(--gold)' : isLive ? '#22c55e' : 'rgba(255,255,255,0.2)',
            animation: loading ? 'pulse 0.7s infinite' : isLive ? 'pulse 3s infinite' : 'none'
          }} />
          {loading ? 'Refreshing…'
            : isLive && syncAgoMins !== null
              ? syncAgoMins < 1 ? 'Just updated' : `Updated ${syncAgoMins}m ago`
              : 'Loading…'
          }
        </div>

        {/* Next auto-refresh countdown */}
        <div style={{ fontSize:10, color:'var(--muted)' }}>
          Auto-refresh in {nextHourMins}m
        </div>

        {/* Manual refresh button */}
        <button onClick={handleRefresh} disabled={loading}
          style={{
            display:'flex', alignItems:'center', gap:5,
            fontSize:11, padding:'4px 12px', borderRadius:6,
            cursor: loading ? 'not-allowed' : 'pointer',
            border:'1px solid var(--border2)', background:'transparent',
            color: loading ? 'var(--muted)' : 'var(--cream)',
            transition:'all .15s', fontFamily:'inherit',
          }}>
          <span style={{ display:'inline-block', fontSize:13,
            animation: spinning ? 'spin 1s linear infinite' : 'none' }}>↻</span>
          {loading ? 'Refreshing…' : 'Refresh now'}
        </button>

        {children}
      </div>
    </div>
  )
}
