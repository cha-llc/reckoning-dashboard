import React, { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabase.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAutoRefresh } from '../hooks/useAutoRefresh.js'

const SUPABASE_URL  = 'https://vzzzqsmqqaoilkmskadl.supabase.co'
const ANON_KEY      = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6enpxc21xcWFvaWxrbXNrYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mzk0MzgsImV4cCI6MjA5MDIxNTQzOH0.M3pLdkRMFXyvTjcKhX3fR7o6pGtW7Xg7NKcO_sHw2Oo'
const PROXY         = `${SUPABASE_URL}/functions/v1/linear-proxy`
const POLL_MS       = 60000

const PRIORITY_COLORS = { 1: 'var(--crimson)', 2: 'var(--gold)', 3: 'var(--teal)', 4: 'var(--muted)', 0: 'var(--muted)' }
const PRIORITY_LABELS = { 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low', 0: '—' }

const STATIC_ISSUES = [
  { id:'CHA-52', linearId:null, title:'PHASE 1 — The Confession + Architecture', status:'In Progress', priority:1, due:'2026-05-31', url:'https://linear.app/cha-llc/issue/CHA-52' },
  { id:'CHA-46', linearId:null, title:'CAMPAIGN: Full-Scale Online Marketing Campaign', status:'In Progress', priority:1, due:null, url:'https://linear.app/cha-llc/issue/CHA-46' },
  { id:'CHA-45', linearId:null, title:'Phase 2 Stability Hold — Active', status:'In Progress', priority:2, due:null, url:'https://linear.app/cha-llc/issue/CHA-45' },
  { id:'CHA-51', linearId:null, title:'FREE ERA BLUEPRINT RECKONING — Master Campaign Epic', status:'In Progress', priority:1, due:null, url:'https://linear.app/cha-llc/issue/CHA-51' },
  { id:'CHA-48', linearId:null, title:'PHASE 2: Email Capture + Newsletter Drip — Days 8–14', status:'Todo', priority:2, due:'2026-04-27', url:'https://linear.app/cha-llc/issue/CHA-48' },
  { id:'CHA-49', linearId:null, title:'PHASE 3: Conversion Blitz — Days 15–21', status:'Todo', priority:2, due:'2026-05-04', url:'https://linear.app/cha-llc/issue/CHA-49' },
  { id:'CHA-50', linearId:null, title:'PHASE 4: Retention + Upsell — Days 22–30', status:'Todo', priority:3, due:'2026-05-13', url:'https://linear.app/cha-llc/issue/CHA-50' },
  { id:'CHA-53', linearId:null, title:'PHASE 2 — The Engine + The Circle (Jun–Jul)', status:'Todo', priority:1, due:'2026-07-31', url:'https://linear.app/cha-llc/issue/CHA-53' },
  { id:'CHA-54', linearId:null, title:'PHASE 3 — The Proof + Amplification (Aug–Oct)', status:'Todo', priority:2, due:'2026-10-31', url:'https://linear.app/cha-llc/issue/CHA-54' },
  { id:'CHA-55', linearId:null, title:'PHASE 4 — The Compounding + The Report (Nov–Dec)', status:'Todo', priority:2, due:'2026-12-31', url:'https://linear.app/cha-llc/issue/CHA-55' },
  { id:'CHA-57', linearId:null, title:'Phase 1 Full System Audit — All Systems Live', status:'Done', priority:2, due:null, url:'https://linear.app/cha-llc/issue/CHA-57' },
  { id:'CHA-56', linearId:null, title:'Customer Feedback Channel Automated Pipeline Live', status:'Done', priority:3, due:null, url:'https://linear.app/cha-llc/issue/CHA-56' },
  { id:'CHA-47', linearId:null, title:'PHASE 1: Awareness Content Blitz — Days 1–7', status:'Done', priority:1, due:'2026-04-20', url:'https://linear.app/cha-llc/issue/CHA-47' },
  { id:'CHA-16', linearId:null, title:'RISK-ANALYTICS-002: Analytics Pipeline Not Activated', status:'Done', priority:1, due:null, url:'https://linear.app/cha-llc/issue/CHA-16' },
]

function IssueCard({ id, linearId, title, status, priority, due, url, onMarkComplete, completing }) {
  const isOverdue = due && new Date(due) < new Date() && status !== 'Done'
  const isDone = status === 'Done'
  return (
    <div style={{
      background: 'var(--navy3)', borderRadius: 8, padding: '10px 12px',
      borderLeft: `3px solid ${isDone ? '#22c55e' : status === 'In Progress' ? 'var(--gold)' : 'var(--muted)'}`,
      display: 'flex', flexDirection: 'column', gap: 5,
      opacity: completing ? 0.5 : 1, transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <a href={url} target="_blank" rel="noreferrer"
          style={{ fontSize: 12, color: isDone ? 'var(--muted)' : 'var(--cream)', textDecoration: isDone ? 'line-through' : 'none', lineHeight: 1.4, flex: 1 }}>
          {title}
        </a>
        <span style={{ fontSize: 10, color: PRIORITY_COLORS[priority] || 'var(--muted)', whiteSpace: 'nowrap', fontWeight: 600 }}>
          {PRIORITY_LABELS[priority] || '—'}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{id}</span>
          {due && (
            <span style={{ fontSize: 10, color: isOverdue ? 'var(--crimson)' : 'var(--muted)' }}>
              {isOverdue ? '⚠ ' : ''}Due {new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>
        {!isDone ? (
          <button onClick={() => onMarkComplete(id, linearId)} disabled={completing}
            style={{
              fontSize: 10, padding: '3px 9px', borderRadius: 5, cursor: completing ? 'not-allowed' : 'pointer',
              border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.08)',
              color: '#22c55e', fontWeight: 600, transition: 'all .15s', whiteSpace: 'nowrap',
            }}>
            {completing ? 'Marking…' : '✓ Done'}
          </button>
        ) : (
          <span style={{ fontSize: 10, color: '#22c55e', fontWeight: 600 }}>✓ Complete</span>
        )}
      </div>
    </div>
  )
}

export default function SprintBoard() {
  const [issues, setIssues]         = useState(STATIC_ISSUES)
  const [milestones, setMilestones] = useState([])
  const [linearOk, setLinearOk]     = useState(false)
  const [completing, setCompleting] = useState({})
  const [lastSync, setLastSync]     = useState(null)
  const [filter, setFilter]         = useState('all')
  const [error, setError]           = useState(null)
  const [loading, setLoading]       = useState(true)
  const timerRef = useRef(null)

  const fetchLinear = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const r = await fetch(PROXY, {
        headers: { 'apikey': ANON_KEY, 'x-action': 'list' }
      })
      const d = await r.json()
      if (d.error) {
        // LINEAR_API_KEY not set yet — keep static data, show banner
        setError(d.error)
      } else if (d.issues) {
        setIssues(d.issues)
        setLinearOk(true)
        setLastSync(new Date())
        setError(null)
      }
    } catch { setError('Network error') }
    if (!silent) setLoading(false)
  }, [])

  useEffect(() => {
    supabase.from('phase_milestones').select('*').order('target_date')
      .then(({ data }) => setMilestones(data || []))
  }, [])

  useEffect(() => {
    fetchLinear(false)
    timerRef.current = setInterval(() => fetchLinear(true), POLL_MS)
    return () => clearInterval(timerRef.current)
  }, [fetchLinear])

  const markComplete = useCallback(async (issueId, linearId) => {
    // Optimistic update
    setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'Done' } : i))
    setCompleting(prev => ({ ...prev, [issueId]: true }))

    if (linearId) {
      try {
        const r = await fetch(PROXY, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'x-action': 'complete' },
          body: JSON.stringify({ linearId }),
        })
        const d = await r.json()
        if (!d.success) {
          // Revert
          setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'In Progress' } : i))
          setError('Could not mark ' + issueId + ' complete in Linear')
        } else {
          setTimeout(() => fetchLinear(true), 1500)
        }
      } catch {
        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: 'In Progress' } : i))
        setError('Network error — could not reach Linear')
      }
    }

    setCompleting(prev => { const n = { ...prev }; delete n[issueId]; return n })
  }, [fetchLinear])

  const done        = issues.filter(i => i.status === 'Done').length
  const inProgress  = issues.filter(i => i.status === 'In Progress').length
  const todo        = issues.filter(i => i.status === 'Todo').length
  useAutoRefresh(fetchLinear)

  const velocityPct = Math.round((done / Math.max(issues.length, 1)) * 100)
  const columns     = ['In Progress', 'Todo', 'Done']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        title="Sprint Board"
        sub="Linear issue tracker · Phase milestones · Sprint velocity"
        loading={loading}
        lastSync={lastSync}
        isLive={linearOk}
        onRefresh={() => fetchLinear(false)}
      >
        <a href="https://linear.app/cha-llc" target="_blank" rel="noreferrer"
          style={{ fontSize: 10, color: 'var(--teal)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 1 }}>
          Open Linear ↗
        </a>
      </PageHeader>

      {error && error !== 'LINEAR_API_KEY not configured' && (
        <div style={{ fontSize: 11, color: 'var(--crimson)', background: 'rgba(193,18,31,0.08)', border: '1px solid rgba(193,18,31,0.2)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--accent': '#22c55e' }}>
          <div className="kpi-label">Done</div>
          <div className="kpi-value" style={{ color: '#22c55e', fontSize: 28 }}>{done}</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: velocityPct + '%', background: '#22c55e' }} /></div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--gold)' }}>
          <div className="kpi-label">In Progress</div>
          <div className="kpi-value" style={{ color: 'var(--gold)', fontSize: 28 }}>{inProgress}</div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--muted)' }}>
          <div className="kpi-label">Todo</div>
          <div className="kpi-value" style={{ fontSize: 28 }}>{todo}</div>
        </div>
        <div className="kpi-card" style={{ '--accent': 'var(--teal)' }}>
          <div className="kpi-label">Velocity</div>
          <div className="kpi-value" style={{ color: 'var(--teal)', fontSize: 28 }}>{velocityPct}%</div>
          <div className="kpi-sub">{done} of {issues.length} resolved</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[['all','All Issues'],['In Progress','In Progress'],['Todo','Todo'],['Done','Done']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={'budget-tab ' + (filter === v ? 'active' : '')}>{l}</button>
        ))}
      </div>

      <div className="grid-3">
        {columns.map(col => {
          const colIssues = issues.filter(i => i.status === col && (filter === 'all' || filter === col))
          if (filter !== 'all' && filter !== col) return null
          return (
            <div key={col}>
              <div style={{
                fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 2,
                color: col === 'Done' ? '#22c55e' : col === 'In Progress' ? 'var(--gold)' : 'var(--muted)',
                padding: '0 0 8px', borderBottom: '1px solid var(--border)', marginBottom: 10,
                display: 'flex', justifyContent: 'space-between'
              }}>
                {col}
                <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 7px', borderRadius: 10, color: 'var(--muted)' }}>
                  {colIssues.length}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {colIssues.length === 0
                  ? <div style={{ fontSize: 11, color: 'var(--muted)', padding: '10px 0', textAlign: 'center' }}>No issues</div>
                  : colIssues.map(i => (
                    <IssueCard key={i.id} {...i} onMarkComplete={markComplete} completing={!!completing[i.id]} />
                  ))
                }
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-title">Phase 1 Milestones <span className="tag">Supabase</span></div>
        {milestones.length === 0
          ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>No milestones recorded yet</div>
          : (
            <div className="milestone-list">
              {milestones.map(m => (
                <div key={m.id} className={'milestone-item ' + m.status}>
                  <div className="ms-dot" />
                  <div className="ms-name">{m.milestone_name}</div>
                  {m.target_date && <div className="ms-date">{new Date(m.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                  {m.linked_linear_id && (
                    <a href={'https://linear.app/cha-llc/issue/' + m.linked_linear_id} target="_blank" rel="noreferrer"
                      style={{ fontSize: 10, color: 'var(--violet)', textDecoration: 'none' }}>{m.linked_linear_id}</a>
                  )}
                  <div className="ms-badge">{m.status?.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    </div>
  )
}
