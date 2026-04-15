import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase.js'

// Live issues from Linear pulled at build — hard-coded from API response
// Status: Done=3, In Progress=3, Todo=5, Backlog=14
const LINEAR_ISSUES = [
  { id:'CHA-52', title:'PHASE 1 — The Confession + Architecture', status:'In Progress', priority:1, due:'2026-05-31', url:'https://linear.app/cha-llc/issue/CHA-52' },
  { id:'CHA-46', title:'CAMPAIGN: Full-Scale Online Marketing Campaign', status:'In Progress', priority:1, due:null, url:'https://linear.app/cha-llc/issue/CHA-46' },
  { id:'CHA-45', title:'Phase 2 Stability Hold — Active', status:'In Progress', priority:2, due:null, url:'https://linear.app/cha-llc/issue/CHA-45' },
  { id:'CHA-51', title:'FREE ERA BLUEPRINT RECKONING — Master Campaign Epic', status:'In Progress', priority:1, due:null, url:'https://linear.app/cha-llc/issue/CHA-51' },
  { id:'CHA-48', title:'PHASE 2: Email Capture + Newsletter Drip — Days 8–14', status:'Todo', priority:2, due:'2026-04-27', url:'https://linear.app/cha-llc/issue/CHA-48' },
  { id:'CHA-49', title:'PHASE 3: Conversion Blitz — Days 15–21', status:'Todo', priority:2, due:'2026-05-04', url:'https://linear.app/cha-llc/issue/CHA-49' },
  { id:'CHA-50', title:'PHASE 4: Retention + Upsell — Days 22–30', status:'Todo', priority:3, due:'2026-05-13', url:'https://linear.app/cha-llc/issue/CHA-50' },
  { id:'CHA-53', title:'PHASE 2 — The Engine + The Circle (Jun–Jul)', status:'Todo', priority:1, due:'2026-07-31', url:'https://linear.app/cha-llc/issue/CHA-53' },
  { id:'CHA-54', title:'PHASE 3 — The Proof + Amplification (Aug–Oct)', status:'Todo', priority:2, due:'2026-10-31', url:'https://linear.app/cha-llc/issue/CHA-54' },
  { id:'CHA-55', title:'PHASE 4 — The Compounding + The Report (Nov–Dec)', status:'Todo', priority:2, due:'2026-12-31', url:'https://linear.app/cha-llc/issue/CHA-55' },
  { id:'CHA-57', title:'Phase 1 Full System Audit — All Systems Live', status:'Done', priority:2, due:null, url:'https://linear.app/cha-llc/issue/CHA-57' },
  { id:'CHA-56', title:'Customer Feedback Channel Automated Pipeline Live', status:'Done', priority:3, due:null, url:'https://linear.app/cha-llc/issue/CHA-56' },
  { id:'CHA-47', title:'PHASE 1: Awareness Content Blitz — Days 1–7', status:'Done', priority:1, due:'2026-04-20', url:'https://linear.app/cha-llc/issue/CHA-47' },
  { id:'CHA-16', title:'RISK-ANALYTICS-002: Analytics Pipeline Not Activated', status:'Done', priority:1, due:null, url:'https://linear.app/cha-llc/issue/CHA-16' },
]

const PRIORITY_COLORS = { 1: 'var(--crimson)', 2: 'var(--gold)', 3: 'var(--teal)', 4: 'var(--muted)' }
const PRIORITY_LABELS = { 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' }

function IssueCard({ id, title, status, priority, due, url }) {
  const isOverdue = due && new Date(due) < new Date() && status !== 'Done'
  return (
    <div style={{
      background: 'var(--navy3)', borderRadius: 8, padding: '10px 12px',
      borderLeft: `3px solid ${status === 'Done' ? '#22c55e' : status === 'In Progress' ? 'var(--gold)' : 'var(--muted)'}`,
      display: 'flex', flexDirection: 'column', gap: 4
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
        <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--cream)', textDecoration: 'none', lineHeight: 1.4, flex: 1 }}>
          {title}
        </a>
        <span style={{ fontSize: 10, color: PRIORITY_COLORS[priority], whiteSpace: 'nowrap', fontWeight: 600 }}>{PRIORITY_LABELS[priority]}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace' }}>{id}</span>
        {due && (
          <span style={{ fontSize: 10, color: isOverdue ? 'var(--crimson)' : 'var(--muted)' }}>
            {isOverdue ? '⚠ ' : ''}Due {new Date(due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  )
}

export default function SprintBoard() {
  const [milestones, setMilestones] = useState([])
  const [sprint, setSprint] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const [msRes, spRes] = await Promise.all([
        supabase.from('phase_milestones').select('*').order('target_date'),
        supabase.from('sprint_log').select('*').order('sprint_number', { ascending: false }).limit(1),
      ])
      setMilestones(msRes.data || [])
      setSprint(spRes.data?.[0] || null)
      setLoading(false)
    }
    load()
  }, [])

  const columns = ['In Progress', 'Todo', 'Done']
  const filteredIssues = LINEAR_ISSUES.filter(i => filter === 'all' || i.status === filter)

  const done = LINEAR_ISSUES.filter(i => i.status === 'Done').length
  const inProgress = LINEAR_ISSUES.filter(i => i.status === 'In Progress').length
  const todo = LINEAR_ISSUES.filter(i => i.status === 'Todo').length
  const backlog = LINEAR_ISSUES.filter(i => i.status === 'Backlog').length
  const velocityPct = Math.round((done / LINEAR_ISSUES.length) * 100)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div className="page-header">
        <div className="page-eyebrow">Reckoning Dashboard</div>
        <div className="page-title">Sprint Board</div>
        <div className="page-sub">Linear issue tracker · Phase milestones · Sprint velocity</div>
      </div>

      {/* Sprint velocity strip */}
      <div className="kpi-grid">
        <div className="kpi-card" style={{ '--accent': '#22c55e' }}>
          <div className="kpi-label">Done</div>
          <div className="kpi-value" style={{ color: '#22c55e', fontSize: 28 }}>{done}</div>
          <div className="kpi-bar"><div className="kpi-bar-fill" style={{ width: `${velocityPct}%`, background: '#22c55e' }} /></div>
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
          <div className="kpi-sub">{done} of {LINEAR_ISSUES.length} issues resolved</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[['all', 'All Issues'], ['In Progress', 'In Progress'], ['Todo', 'Todo'], ['Done', 'Done']].map(([v, l]) => (
          <button key={v} onClick={() => setFilter(v)} className={`budget-tab ${filter === v ? 'active' : ''}`}>
            {l}
          </button>
        ))}
        <a href="https://linear.app/cha-llc" target="_blank" rel="noreferrer"
          style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--teal)', textDecoration: 'none', alignSelf: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
          Open Linear ↗
        </a>
      </div>

      {/* Kanban columns */}
      <div className="grid-3">
        {columns.map(col => {
          const colIssues = LINEAR_ISSUES.filter(i => i.status === col && (filter === 'all' || filter === col))
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
                {colIssues.map(i => <IssueCard key={i.id} {...i} />)}
              </div>
            </div>
          )
        })}
      </div>

      {/* Phase milestones */}
      <div className="card">
        <div className="card-title">Phase 1 Milestones <span className="tag">Supabase</span></div>
        {loading
          ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading...</div>
          : milestones.length === 0
            ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>No milestones recorded yet</div>
            : (
              <div className="milestone-list">
                {milestones.map(m => (
                  <div key={m.id} className={`milestone-item ${m.status}`}>
                    <div className="ms-dot" />
                    <div className="ms-name">{m.milestone_name}</div>
                    {m.target_date && <div className="ms-date">{new Date(m.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
                    {m.linked_linear_id && (
                      <a href={`https://linear.app/cha-llc/issue/${m.linked_linear_id}`} target="_blank" rel="noreferrer"
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
