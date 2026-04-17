import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts'
import { useCommandCenter, useBudgetAnalytics, useProducts, usePhaseProgress } from '../hooks/useData.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAutoRefresh } from '../hooks/useAutoRefresh.js'

const fmt = n => n === undefined || n === null ? '$0' : `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtShort = n => `$${Number(n || 0).toFixed(2)}`

function KpiCard({ label, value, sub, color, pct, barColor }) {
  return (
    <div className="kpi-card" style={{ '--accent': color }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
      {pct !== undefined && (
        <div className="kpi-bar">
          <div className="kpi-bar-fill" style={{ width: `${Math.min(pct, 100)}%`, background: barColor || color }} />
        </div>
      )}
    </div>
  )
}

function PhaseSeg({ phase, isActive, isPast, daysPct, target, label, start, end, color }) {
  const shortDate = d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return (
    <div className={`phase-seg ${isActive ? 'active' : ''}`} style={{ '--phase-color': color, opacity: isPast ? 0.5 : 1 }}>
      <div className="phase-seg-label">{label}</div>
      <div className="phase-seg-dates">{shortDate(start)} – {shortDate(end)}</div>
      <div className="phase-seg-target">${target.toLocaleString()}</div>
      <div className="phase-seg-bar">
        <div className="phase-seg-fill" style={{ width: `${isActive ? daysPct : isPast ? 100 : 0}%` }} />
      </div>
      <div className="phase-seg-pct">
        {isActive ? `Day ${daysPct}% elapsed` : isPast ? 'Complete' : 'Upcoming'}
      </div>
    </div>
  )
}

function MilestoneItem({ milestone_name, status, target_date, linked_linear_id }) {
  const label = { done: 'done', in_progress: 'in progress', pending: 'pending', blocked: 'blocked' }
  return (
    <div className={`milestone-item ${status}`}>
      <div className="ms-dot" />
      <div className="ms-name">{milestone_name}</div>
      {target_date && <div className="ms-date">{new Date(target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>}
      <div className="ms-badge">{label[status] || status}</div>
    </div>
  )
}

function EventItem({ event_type, event_category, product, created_at }) {
  const icons = { revenue: '💰', engagement: '💬', content: '📝', system: '⚙️', feedback: '📣', lead: '📋', social: '📱' }
  const when = (() => {
    const diff = Date.now() - new Date(created_at).getTime()
    if (diff < 60000) return 'just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return `${Math.floor(diff / 86400000)}d ago`
  })()
  return (
    <div className="event-item">
      <div className="event-icon">{icons[event_category] || '📌'}</div>
      <div className="event-text">{event_type.replace(/_/g, ' ')}{product ? ` · ${product}` : ''}</div>
      <div className="event-time">{when}</div>
    </div>
  )
}

// ── BUDGET ANALYTICS SECTION ──────────────────────────────────────────────
function BudgetAnalytics() {
  const { data, loading, mode, setMode } = useBudgetAnalytics()

  if (loading) return (
    <div className="card col-span-2">
      <div className="card-title">Budget Analytics <span className="tag">Budget Manager</span></div>
      <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading...</div>
    </div>
  )

  // SEED DATA GUARD — the current Supabase budget tables contain only
  // test/seed entries ($14.97 revenue, $592.83 expenses). None of it is real.
  // Flip this to false only after real financial data has been entered
  // in the Budget Manager app and the seed rows have been removed.
  const SEED_DATA_ONLY = true

  const hasRealData = !SEED_DATA_ONLY && data && (data.months.length > 0)

  return (
    <div className="card col-span-2">
      <div className="card-title">
        Budget Analytics
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tag">Budget Manager</span>
          <a href="https://cha-budget-manager.vercel.app/analytics" target="_blank" rel="noreferrer"
            style={{ fontSize: 9, color: 'var(--teal)', textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>
            Open Full App ↗
          </a>
        </div>
      </div>

      {/* Business / Personal toggle */}
      <div className="budget-toggle">
        <button className={`budget-tab ${mode === 'business' ? 'active' : ''}`} onClick={() => setMode('business')}>
          🏢 Business
        </button>
        <button className={`budget-tab ${mode === 'personal' ? 'active' : ''}`} onClick={() => setMode('personal')}>
          👤 Personal
        </button>
      </div>

      {/* Empty state — shown until real data exists and SEED_DATA_ONLY is set to false */}
      {!hasRealData ? (
        <div style={{
          background: 'var(--navy3)', border: '1px dashed var(--border2)',
          borderRadius: 10, padding: '28px 20px', textAlign: 'center'
        }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>📊</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--cream)', marginBottom: 6 }}>
            No financial data recorded yet
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>
            Budget categories and divisions are configured.<br />
            Add your first revenue or expense entry to see analytics here.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[
              { label: '+ Add Revenue', url: 'https://cha-budget-manager.vercel.app/revenue' },
              { label: '+ Add Expense', url: 'https://cha-budget-manager.vercel.app/expenses' },
              { label: 'Set Budgets', url: 'https://cha-budget-manager.vercel.app/budgets' },
            ].map(l => (
              <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                background: 'rgba(201,168,76,0.12)', color: 'var(--gold)',
                border: '1px solid rgba(201,168,76,0.25)', textDecoration: 'none'
              }}>{l.label}</a>
            ))}
          </div>

          {/* Division budgets — these ARE configured */}
          <div style={{ marginTop: 20, textAlign: 'left' }}>
            <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 8 }}>
              Divisions configured (budgets pending)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {['Consulting', 'Tea Time Network', 'Digital Tools', 'Books'].map(d => (
                <div key={d} style={{
                  display: 'flex', justifyContent: 'space-between',
                  background: 'var(--navy2)', borderRadius: 6, padding: '7px 10px',
                  fontSize: 11, border: '1px solid var(--border)'
                }}>
                  <span style={{ color: 'var(--cream)' }}>{d}</span>
                  <span style={{ color: 'var(--muted)' }}>$0 / mo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        // Real data view — only shown when actual entries exist
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
            {[
              { label: 'Total Revenue', value: fmt(data.totalRev), color: 'var(--teal)' },
              { label: 'Total Expenses', value: fmt(data.totalExp), color: 'var(--crimson)' },
              { label: 'Net', value: fmt(data.net), color: data.net >= 0 ? '#22c55e' : '#ef4444' },
              { label: 'This Month Net', value: fmt(data.thisMonthNet), color: data.thisMonthNet >= 0 ? 'var(--teal)' : 'var(--crimson)' },
            ].map(k => (
              <div key={k.label} style={{ background: 'var(--navy3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px', color: 'var(--muted)', marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: k.color, fontFamily: 'Lora, serif' }}>{k.value}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 10 }}>
            {mode === 'business' ? 'Business' : 'Personal'} Revenue vs Expenses — Last 6 Months
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.months.map(m => ({ name: m.label, Revenue: m.revenue, Expenses: m.expenses }))} barGap={3} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [fmt(v), n]} />
              <Bar dataKey="Revenue" fill="#2A9D8F" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Expenses" fill="#C1121F" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  )
}

// ── PRODUCT ROW ──────────────────────────────────────────────────────────
function ProductRow({ name, price, paid, conv, rev, color, fb_pos, fb_neg, url }) {
  return (
    <tr>
      <td>
        <div className="prod-name">
          <span className="prod-dot" style={{ background: color }} />
          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--cream)', textDecoration: 'none' }}>{name}</a>
        </div>
      </td>
      <td style={{ color: 'var(--gold)' }}>${price}</td>
      <td>{paid}</td>
      <td>
        <div className="conv-bar">
          <span style={{ minWidth: 28 }}>{conv}%</span>
          <div className="conv-track"><div className="conv-fill" style={{ width: `${conv}%` }} /></div>
        </div>
      </td>
      <td style={{ color: '#22c55e' }}>{fmtShort(rev)}</td>
      <td>
        <span style={{ color: '#22c55e', marginRight: 4 }}>+{fb_pos}</span>
        <span style={{ color: '#ef4444' }}>-{fb_neg}</span>
      </td>
      <td>
        <span className="status-dot status-ok" style={{ display: 'inline-block' }} title="Live" />
      </td>
    </tr>
  )
}

// ── MAIN COMMAND CENTER ──────────────────────────────────────────────────
export default function CommandCenter() {
  const { data, loading, lastSync, isLive, refetch } = useCommandCenter()
  const { data: products, loading: prodLoading, refetch: refetchProducts } = useProducts()
  const phases = usePhaseProgress()

  // Hourly auto-refresh
  useAutoRefresh(refetch)
  useAutoRefresh(refetchProducts)

  const phase1Target = 1200
  const totalRevUSD = data?.totalRev || 0
  const revPct = Math.min(Math.round((totalRevUSD / phase1Target) * 100), 100)
  const fullYearTarget = 27200
  const fullYearPct = Math.min(Math.round((totalRevUSD / fullYearTarget) * 100), 100)

  const handleRefresh = () => { refetch(false); refetchProducts(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        eyebrow="Free Era Blueprint Reckoning"
        title="Command Center"
        sub="Apr 14 – Dec 31, 2026 · Live campaign intelligence"
        loading={loading}
        lastSync={lastSync}
        isLive={isLive}
        onRefresh={handleRefresh}
      />

      {/* TOP KPI STRIP */}
      <div className="kpi-grid">
        <KpiCard label="Campaign Revenue" value={loading ? '...' : fmt(totalRevUSD)} sub={`of $${phase1Target.toLocaleString()} Phase 1 target`} color="var(--gold)" pct={revPct} barColor="var(--gold)" />
        <KpiCard label="Paid Sessions" value={loading ? '...' : data.totalPaid} sub={`BP ${data?.bp || 0} · CE ${data?.ce || 0} · FL ${data?.fl || 0}`} color="var(--teal)" />
        <KpiCard label="Newsletter List" value={loading ? '...' : data?.subscribers || 0} sub="target: 50 by May 15" color="var(--violet)" pct={Math.round(((data?.subscribers || 0) / 50) * 100)} />
        <KpiCard label="Lead Downloads" value={loading ? '...' : data?.leadMagnets || 0} sub="8 PDFs live at hub" color="var(--crimson)" />
        <KpiCard label="Feedback Items" value={loading ? '...' : (data?.fb_pos + data?.fb_neu + data?.fb_neg) || 0} sub={`+${data?.fb_pos || 0} neutral:${data?.fb_neu || 0} -${data?.fb_neg || 0}`} color="var(--blue)" />
        <KpiCard label="Sprint Velocity" value={loading ? '...' : `${data?.sprint?.velocity_pct || 83}%`} sub={`Sprint ${data?.sprint?.sprint_number || 1} · ${data?.sprint?.completed_tasks || 10}/${data?.sprint?.planned_tasks || 12} tasks`} color="var(--amber)" />
      </div>

      {/* PHASE TIMELINE */}
      <div className="card">
        <div className="card-title">Campaign Phases <span className="tag">Apr 14 – Dec 31</span></div>
        <div className="phase-timeline">
          {phases.map(p => <PhaseSeg key={p.phase} {...p} />)}
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Full year target: <strong style={{ color: 'var(--gold)' }}>$27,200</strong></span>
          <span>Current: <strong style={{ color: '#22c55e' }}>{fmt(totalRevUSD)}</strong> ({fullYearPct}%)</span>
        </div>
      </div>

      {/* PRODUCT TABLE + MILESTONES */}
      <div className="grid-2">

        <div className="card">
          <div className="card-title">Products <span className="tag">Live</span></div>
          {prodLoading ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading...</div> : (
            <table className="product-table">
              <thead>
                <tr>
                  <th>Product</th><th>Price</th><th>Sales</th>
                  <th>Conv</th><th>Revenue</th><th>Feedback</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => <ProductRow key={p.name} {...p} />)}
              </tbody>
            </table>
          )}
        </div>

        <div className="card">
          <div className="card-title">Phase 1 Milestones</div>
          <div className="milestone-list">
            {loading
              ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading...</div>
              : (data?.milestones || []).map(m => <MilestoneItem key={m.id} {...m} />)
            }
          </div>
        </div>
      </div>

      {/* BUDGET ANALYTICS + EVENT FEED */}
      <div className="grid-2">

        <BudgetAnalytics />

        <div className="card">
          <div className="card-title">Live Campaign Events <span className="tag">Realtime</span></div>
          <div className="event-feed">
            {loading
              ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>Connecting...</div>
              : (data?.events || []).length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>No events yet</div>
                : (data?.events || []).map(e => <EventItem key={e.id} {...e} />)
            }
          </div>
          <div style={{ marginTop: 12, display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div className="live-dot" />
              <span>Supabase Realtime active</span>
            </div>
            <span>campaign_events · kpi_snapshots · sessions</span>
          </div>
        </div>

      </div>

    </div>
  )
}
