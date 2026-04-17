import React, { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, AreaChart, Area } from 'recharts'
import { supabase } from '../supabase.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAutoRefresh } from '../hooks/useAutoRefresh.js'

const fmt = v => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtK = v => v >= 1000 ? `$${(v/1000).toFixed(1)}k` : `$${v}`

const DIVISIONS = ['Consulting', 'Tea Time Network', 'Digital Tools', 'Books']
const DIV_COLORS = { 'Consulting': '#C9A84C', 'Tea Time Network': '#2A9D8F', 'Digital Tools': '#9B5DE5', 'Books': '#C1121F' }

export default function BudgetAnalytics() {
  const [mode, setMode]         = useState('business')
  const [period, setPeriod]     = useState('monthly')
  const [data, setData]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [divBudgets, setDivBudgets] = useState([])

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)

    const [revRes, expRes, divRes, snapRes] = await Promise.all([
      supabase.from('revenue').select('date, amount, product_name, source').order('date', { ascending: false }).limit(500),
      supabase.from('expenses').select('date, amount, division, category, is_business').order('date', { ascending: false }).limit(500),
      supabase.from('division_budgets').select('*').order('division'),
      supabase.from('budget_snapshots').select('*').order('created_at', { ascending: false }).limit(12),
    ])

    const revAll  = revRes.data || []
    const expAll  = expRes.data || []
    const divs    = divRes.data || []
    const snaps   = snapRes.data || []

    setDivBudgets(divs)

    const businessExp = expAll.filter(e => e.is_business === true)
    const personalExp = expAll.filter(e => e.is_business !== true)
    const expenses    = mode === 'business' ? businessExp : personalExp

    // Aggregate by month — last 6
    const monthMap = {}
    const addM = (date, key, val) => {
      if (!date) return
      const d = new Date(date)
      const lbl = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
      if (!monthMap[lbl]) monthMap[lbl] = { label: lbl, revenue: 0, expenses: 0, sortKey: d.getFullYear() * 100 + d.getMonth() }
      monthMap[lbl][key] += parseFloat(val || 0)
    }
    revAll.forEach(r => addM(r.date, 'revenue', r.amount))
    expenses.forEach(e => addM(e.date, 'expenses', e.amount))

    const months = Object.values(monthMap)
      .sort((a, b) => a.sortKey - b.sortKey)
      .slice(-6)
      .map(m => ({
        ...m,
        revenue:  Math.round(m.revenue  * 100) / 100,
        expenses: Math.round(m.expenses * 100) / 100,
        net:      Math.round((m.revenue - m.expenses) * 100) / 100,
      }))

    // Totals
    const totalRev = revAll.reduce((s, r) => s + parseFloat(r.amount || 0), 0)
    const totalExp = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
    const net      = totalRev - totalExp

    // This month
    const now = new Date()
    const thisRev = revAll.filter(r => {
      const d = new Date(r.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
    const thisExp = expenses.filter(e => {
      const d = new Date(e.date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).reduce((s, e) => s + parseFloat(e.amount || 0), 0)

    // Expenses by division
    const byDiv = DIVISIONS.map(div => {
      const amt = businessExp.filter(e => e.division === div).reduce((s, e) => s + parseFloat(e.amount || 0), 0)
      return { division: div, amount: Math.round(amt * 100) / 100 }
    }).filter(d => d.amount > 0)

    // Expenses by category (top 6)
    const catMap = {}
    expenses.forEach(e => {
      if (!e.category) return
      catMap[e.category] = (catMap[e.category] || 0) + parseFloat(e.amount || 0)
    })
    const topCats = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, amount]) => ({ name, amount: Math.round(amount * 100) / 100 }))

    // Revenue by product
    const prodMap = {}
    revAll.forEach(r => {
      const key = r.product_name || r.source || 'Other'
      prodMap[key] = (prodMap[key] || 0) + parseFloat(r.amount || 0)
    })
    const revByProd = Object.entries(prodMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, amount]) => ({ name: name.slice(0, 20), amount: Math.round(amount * 100) / 100 }))

    setData({
      months, totalRev: Math.round(totalRev * 100) / 100,
      totalExp: Math.round(totalExp * 100) / 100,
      net: Math.round(net * 100) / 100,
      thisRev: Math.round(thisRev * 100) / 100,
      thisExp: Math.round(thisExp * 100) / 100,
      thisNet: Math.round((thisRev - thisExp) * 100) / 100,
      byDiv, topCats, revByProd,
      revCount: revAll.length, expCount: expenses.length,
      snaps,
    })
    setLastSync(new Date())
    setLoading(false)
  }, [mode])

  useEffect(() => {
    load(false)

    // Realtime — update instantly when Budget Manager adds/edits entries
    const channel = supabase.channel('budget-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revenue' },          () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' },         () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'division_budgets' }, () => load(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'budget_snapshots' }, () => load(true))
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [load])
  useAutoRefresh(load)

  // Show live data view when actual entries exist in Supabase
  const hasRealData = data && (data.revCount > 0 || data.expCount > 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        title="Budget Analytics"
        sub="C.H.A. LLC financial performance — revenue, expenses, division budgets"
        loading={loading}
        lastSync={lastSync}
        isLive={!!lastSync}
        onRefresh={() => load(false)}
      >
        <a href="https://cha-budget-manager.vercel.app/analytics" target="_blank" rel="noreferrer"
          style={{ fontSize: 10, color: 'var(--teal)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 1 }}>
          Full Budget App ↗
        </a>
      </PageHeader>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {['business', 'personal'].map(m => (
          <button key={m} onClick={() => setMode(m)}
            className={'budget-tab ' + (mode === m ? 'active' : '')}>
            {m === 'business' ? '🏢 Business' : '👤 Personal'}
          </button>
        ))}
      </div>

      {!hasRealData ? (
        /* ── EMPTY STATE — real $0 values from live Supabase query ───── */
        <>
          {/* KPI strip — live query results, currently all zero */}
          <div className="kpi-grid">
            {[
              { label: 'Total Revenue',  value: loading ? '...' : fmt(data?.totalRev  || 0), color: 'var(--teal)',    sub: data?.revCount === 0 ? 'No entries yet' : `${data?.revCount} entries` },
              { label: 'Total Expenses', value: loading ? '...' : fmt(data?.totalExp  || 0), color: 'var(--crimson)', sub: data?.expCount === 0 ? 'No entries yet' : `${data?.expCount} entries` },
              { label: 'Net',            value: loading ? '...' : fmt(data?.net        || 0), color: 'var(--muted)',   sub: '—' },
              { label: 'This Month Net', value: loading ? '...' : fmt(data?.thisNet   || 0), color: 'var(--muted)',   sub: '—' },
            ].map(k => (
              <div key={k.label} className="kpi-card" style={{ '--accent': k.color }}>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value" style={{ fontSize: 22, color: k.color }}>{k.value}</div>
                <div className="kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* Empty state card */}
          <div className="card" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--cream)', marginBottom: 8 }}>
              No financial data recorded yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 440, margin: '0 auto 24px' }}>
              Division budgets are configured. Add your first revenue or expense entry in the Budget Manager to see charts and analytics here. This page updates in real time — entries appear instantly.
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                { label: '+ Add Revenue',  url: 'https://cha-budget-manager.vercel.app/revenue' },
                { label: '+ Add Expense',  url: 'https://cha-budget-manager.vercel.app/expenses' },
                { label: 'Set Budgets',    url: 'https://cha-budget-manager.vercel.app/budgets' },
                { label: 'Open Dashboard', url: 'https://cha-budget-manager.vercel.app' },
              ].map(l => (
                <a key={l.label} href={l.url} target="_blank" rel="noreferrer" style={{
                  padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 500,
                  background: 'rgba(201,168,76,0.12)', color: 'var(--gold)',
                  border: '1px solid rgba(201,168,76,0.3)', textDecoration: 'none',
                }}>{l.label}</a>
              ))}
            </div>
            {/* Realtime status */}
            <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: 'var(--muted)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: lastSync ? '#22c55e' : 'var(--muted)', animation: lastSync ? 'pulse 2s infinite' : 'none' }} />
              {lastSync
                ? `Realtime connected · watching revenue, expenses, budgets · last check ${lastSync.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
                : 'Connecting to Supabase…'
              }
            </div>
          </div>

          {/* Division budgets — these are real/configured */}
          <div className="card">
            <div className="card-title">Division Budgets <span className="tag">Configured</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {DIVISIONS.map(div => {
                const row = divBudgets.find(d => d.division === div)
                const budget = parseFloat(row?.monthly_budget || 0)
                return (
                  <div key={div} style={{
                    background: 'var(--navy3)', borderRadius: 8, padding: '14px 16px',
                    borderTop: `2px solid ${DIV_COLORS[div]}`,
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--cream)', marginBottom: 4 }}>{div}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: budget > 0 ? DIV_COLORS[div] : 'var(--muted)', fontFamily: 'Lora, serif' }}>
                      {budget > 0 ? fmt(budget) + '/mo' : '$0 / mo'}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4 }}>
                      {budget > 0 ? 'Budget set' : 'Not configured'}
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 14, fontSize: 11, color: 'var(--muted)' }}>
              Set monthly budgets per division in the{' '}
              <a href="https://cha-budget-manager.vercel.app/budgets" target="_blank" rel="noreferrer"
                style={{ color: 'var(--teal)', textDecoration: 'none' }}>Budget Manager →</a>
            </div>
          </div>
        </>
      ) : (
        /* ── LIVE DATA VIEW ─────────────────────────────────────────── */
        <>
          {/* KPI strip */}
          <div className="kpi-grid">
            {[
              { label: 'Total Revenue',   value: fmt(data.totalRev),  color: 'var(--teal)' },
              { label: 'Total Expenses',  value: fmt(data.totalExp),  color: 'var(--crimson)' },
              { label: 'Net',             value: fmt(data.net),       color: data.net >= 0 ? '#22c55e' : '#ef4444' },
              { label: 'This Month Rev',  value: fmt(data.thisRev),   color: 'var(--teal)',   sub: `${fmt(data.thisExp)} expenses` },
              { label: 'This Month Net',  value: fmt(data.thisNet),   color: data.thisNet >= 0 ? '#22c55e' : '#ef4444' },
            ].map(k => (
              <div key={k.label} className="kpi-card" style={{ '--accent': k.color }}>
                <div className="kpi-label">{k.label}</div>
                <div className="kpi-value" style={{ fontSize: 20, color: k.color }}>{k.value}</div>
                {k.sub && <div className="kpi-sub">{k.sub}</div>}
              </div>
            ))}
          </div>

          {/* Revenue vs Expenses — 6 months */}
          <div className="card">
            <div className="card-title">
              {mode === 'business' ? 'Business' : 'Personal'} Revenue vs Expenses — Last 6 Months
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.months} barGap={3} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
                  formatter={(v, n) => [fmt(v), n]} />
                <Bar dataKey="revenue"  name="Revenue"  fill="#2A9D8F" radius={[3,3,0,0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#C1121F" radius={[3,3,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Net trend + Revenue by product */}
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Net Cashflow Trend</div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={data.months}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
                    formatter={v => [fmt(v), 'Net']} />
                  <Area type="monotone" dataKey="net" stroke="#22c55e" strokeWidth={2} fill="url(#netGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <div className="card-title">Revenue by Product</div>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.revByProd} layout="vertical">
                  <XAxis type="number" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }}
                    formatter={v => [fmt(v), 'Revenue']} />
                  <Bar dataKey="amount" fill="var(--gold)" radius={[0,3,3,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Division budgets + top expense categories */}
          <div className="grid-2">
            <div className="card">
              <div className="card-title">Division Budgets</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DIVISIONS.map(div => {
                  const row = divBudgets.find(d => d.division === div)
                  const budget = parseFloat(row?.monthly_budget || 0)
                  const spent = data.byDiv.find(d => d.division === div)?.amount || 0
                  const pct = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0
                  return (
                    <div key={div}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: DIV_COLORS[div], display: 'inline-block' }} />
                          {div}
                        </span>
                        <span style={{ color: 'var(--muted)' }}>
                          {fmt(spent)} {budget > 0 ? `/ ${fmt(budget)}` : '(no budget set)'}
                        </span>
                      </div>
                      {budget > 0 && (
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: pct + '%', background: pct > 90 ? 'var(--crimson)' : DIV_COLORS[div], borderRadius: 2, transition: 'width 1s ease' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-title">Top Expense Categories</div>
              {data.topCats.length === 0
                ? <div style={{ color: 'var(--muted)', fontSize: 12 }}>No expense categories yet</div>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {data.topCats.map((c, i) => (
                      <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: 'var(--cream)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 10, color: 'var(--muted)', width: 14, textAlign: 'right' }}>{i + 1}</span>
                          {c.name}
                        </span>
                        <span style={{ color: 'var(--crimson)', fontWeight: 600 }}>{fmt(c.amount)}</span>
                      </div>
                    ))}
                  </div>
                )
              }
            </div>
          </div>
        </>
      )}

    </div>
  )
}
