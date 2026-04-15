import React, { useState, useEffect } from 'react'

export default function Topbar() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div>
          <div className="topbar-logo">The Reckoning Dashboard</div>
          <div className="topbar-sub">C.H.A. LLC · Free Era Blueprint Reckoning</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="live-badge">
          <div className="live-dot" />
          Realtime
        </div>
        <div className="topbar-time">{dateStr} · {timeStr}</div>
      </div>
    </header>
  )
}
