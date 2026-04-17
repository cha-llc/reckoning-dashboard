import React, { useState, useEffect, useCallback } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase, CAMPAIGN_PRODUCTS, VERCEL_TEAM } from '../supabase.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAutoRefresh } from '../hooks/useAutoRefresh.js'

const fmt = v => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const VERCEL_TOKEN = import.meta.env.VITE_VERCEL_TOKEN || ''

const VERCEL_PROJECTS = {
  'BrandPulse':      'getbrandpulse',
  'Clarity Engine':  'getclarityengine',
  'Flagged':         'getflagged',
  'Burnout Reset':   'getburnoutreset',
  'Couples Clarity': 'getcouplesclarity',
  'First-Gen Table': 'getfirstgentable',
  'Freedom Era Audit':    null,
  'Business Ops Fixer':   null,
}

const GITHUB_REPOS = {
  'BrandPulse':      'brandpulse',
  'Clarity Engine':  'clarityengine',
  'Flagged':         'flagged',
  'Burnout Reset':   'burnout-reset',
  'Couples Clarity': 'couples-clarity',
  'First-Gen Table': 'firstgen-table',
}

function StatusBadge({ status }) {
  const map = {
    READY:    { label: 'Live',     color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    ERROR:    { label: 'Error',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    BUILDING: { label: 'Building', color: '#eab308', bg: 'rgba(234,179,8,0.1)' },
    null:     { label: 'N/A',      color: 'var(--muted)', bg: 'rgba(255,255,255,0.05)' },
  }
  const s = map[status] || map[null]
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  )
}

function GitBadge({ commits }) {
  if (commits === null || commits === undefined) return <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>
  return <span style={{ fontSize: 11, color: 'var(--teal)' }}>{commits} commits</span>
}

export default function ProductIntelligence() {
  const [products, setProducts] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [deployments, setDeployments] = useState({})
  const [commits, setCommits]   = useState({})

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)

    // Sessions — retry once on error
    const fetchWithRetry = async (table, fields) => {
      const { data, error } = await supabase.from(table).select(fields)
      if (error || !data) {
        // Wait 1s and retry once
        await new Promise(r => setTimeout(r, 1000))
        const retry = await supabase.from(table).select(fields)
        return retry.data || []
      }
      return data
    }

    const [bpData, ceData, flData, fbData] = await Promise.all([
      fetchWithRetry('brandpulse_sessions',    'paid, created_at'),
      fetchWithRetry('clarityengine_sessions',  'paid, created_at'),
      fetchWithRetry('flagged_sessions',        'paid, created_at'),
      fetchWithRetry('customer_feedback',       'product, sentiment, message, created_at'),
    ])

    const sessionMap = {
      'BrandPulse':     bpData,
      'Clarity Engine': ceData,
      'Flagged':        flData,
    }
    const fb = fbData

    const prods = CAMPAIGN_PRODUCTS.map(p => {
      const sessions = sessionMap[p.name] || []
      const paid = sessions.filter(s => s.paid === true).length
      const total = sessions.length
      const conv = total > 0 ? Math.round((paid / total) * 100) : (paid > 0 ? 100 : 0)
      const rev = paid * p.price
      const pfb = fb.filter(f => f.product === p.name)
      const daily = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        const label = d.toLocaleDateString('en-US', { weekday: 'short' })
        const dayRev = sessions.filter(s => s.paid === true && new Date(s.created_at).toDateString() === d.toDateString()).length * p.price
        return { label, rev: Math.round(dayRev * 100) / 100 }
      })
      return {
        ...p, paid, total: Math.max(total, paid), conv, rev: Math.round(rev * 100) / 100, daily,
        fb_pos: pfb.filter(f => f.sentiment === 'positive').length,
        fb_neu: pfb.filter(f => f.sentiment === 'neutral').length,
        fb_neg: pfb.filter(f => f.sentiment === 'negative').length,
        feedback: pfb.slice(-3),
      }
    })

    setProducts(prods)
    setSelected(prev => prev || prods[0]?.name || null)
    setLastSync(new Date())
    setLoading(false)

    // Vercel + GitHub in background (non-blocking)
    const ghHeaders = { Authorization: `Bearer ${import.meta.env.VITE_GH_TOKEN || ''}`, Accept: 'application/vnd.github+json' }
    const ghResults = {}
    await Promise.allSettled(
      Object.entries(GITHUB_REPOS).map(async ([name, repo]) => {
        try {
          const r = await fetch(`https://api.github.com/repos/cha-llc/${repo}/commits?per_page=100`, { headers: ghHeaders })
          if (r.ok) { const data = await r.json(); ghResults[name] = Array.isArray(data) ? data.length : 0 }
        } catch {}
      })
    )
    setCommits(ghResults)

    const deplResults = {}
    await Promise.allSettled(
      Object.entries(VERCEL_PROJECTS).map(async ([name, slug]) => {
        if (!slug) return
        try {
          const r = await fetch(`https://api.vercel.com/v6/deployments?app=${slug}&limit=1&teamId=${VERCEL_TEAM}`, {
            headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
          })
          if (r.ok) {
            const data = await r.json()
            const latest = data.deployments?.[0]
            if (latest) deplResults[name] = { status: latest.state, url: latest.url, ago: latest.createdAt }
          }
        } catch {}
      })
    )
    setDeployments(deplResults)
  }, [])

  useEffect(() => {
    load(false)
    // Realtime — reload the moment a new paid session arrives
    const channel = supabase.channel('product-intel-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'brandpulse_sessions',    filter: 'paid=eq.true' }, () => load(true))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'clarityengine_sessions', filter: 'paid=eq.true' }, () => load(true))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'flagged_sessions',       filter: 'paid=eq.true' }, () => load(true))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [load])
  useAutoRefresh(load)

  const sel = products.find(p => p.name === selected)
  const totalRev = products.reduce((s, p) => s + p.rev, 0)
  const totalSales = products.reduce((s, p) => s + p.paid, 0)

  const revenueChart = products.filter(p => p.paid > 0).map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    Revenue: p.rev,
    Sales: p.paid,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        title="Product Intelligence"
        sub="Live session data, conversion rates, deployment status, and GitHub activity across all 8 products"
        loading={loading}
        lastSync={lastSync}
        isLive={!!lastSync}
        onRefresh={() => load(false)}
      />

      {/* Summary KPIs */}
      <div className="kpi-grid">
        {[
          { label: 'Total Revenue', value: loading ? '...' : fmt(totalRev), color: 'var(--gold)' },
          { label: 'Total Sales',   value: loading ? '...' : totalSales,    color: 'var(--teal)' },
          { label: 'Active Products', value: '8', sub: '3 with live sessions', color: 'var(--violet)' },
          { label: 'Avg Conversion', value: loading ? '...' : `${Math.round(products.filter(p=>p.total>0).reduce((s,p)=>s+p.conv,0)/Math.max(1,products.filter(p=>p.total>0).length))}%`, color: 'var(--crimson)' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent': k.color }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 22, color: k.color }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Revenue by product chart */}
        <div className="card">
          <div className="card-title">Revenue by Product</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueChart} barGap={4}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
              <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [n === 'Revenue' ? fmt(v) : v, n]} />
              <Bar dataKey="Revenue" radius={[3,3,0,0]} fill="var(--gold)" />
              <Bar dataKey="Sales" radius={[3,3,0,0]} fill="var(--teal)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Full product table */}
        <div className="card" style={{ overflow: 'auto' }}>
          <div className="card-title">All Products</div>
          <table className="product-table">
            <thead>
              <tr>
                <th>Product</th><th>Price</th><th>Sales</th><th>Revenue</th><th>Conv</th><th>Deploy</th><th>Commits</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.name} style={{ cursor: 'pointer', background: selected === p.name ? 'rgba(201,168,76,0.04)' : undefined }}
                  onClick={() => setSelected(p.name)}>
                  <td>
                    <div className="prod-name">
                      <span className="prod-dot" style={{ background: p.color }} />
                      {p.name}
                    </div>
                  </td>
                  <td style={{ color: 'var(--gold)' }}>${p.price}</td>
                  <td>{p.paid}</td>
                  <td style={{ color: '#22c55e' }}>{fmt(p.rev)}</td>
                  <td>
                    <div className="conv-bar">
                      <span style={{ minWidth: 28, fontSize: 11 }}>{p.conv}%</span>
                      <div className="conv-track" style={{ minWidth: 40 }}><div className="conv-fill" style={{ width: `${p.conv}%` }} /></div>
                    </div>
                  </td>
                  <td><StatusBadge status={deployments[p.name]?.status || (VERCEL_PROJECTS[p.name] !== undefined ? 'READY' : null)} /></td>
                  <td><GitBadge commits={commits[p.name]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected product detail */}
      {sel && (
        <div className="card" style={{ borderTop: `2px solid ${sel.color}` }}>
          <div className="card-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="prod-dot" style={{ background: sel.color, width: 10, height: 10, borderRadius: '50%', display: 'inline-block' }} />
              {sel.name} — Detail View
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={sel.url} target="_blank" rel="noreferrer"
                style={{ fontSize: 10, color: 'var(--teal)', textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>
                Live Site ↗
              </a>
              {GITHUB_REPOS[sel.name] && (
                <a href={`https://github.com/cha-llc/${GITHUB_REPOS[sel.name]}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 10, color: 'var(--violet)', textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>
                  GitHub ↗
                </a>
              )}
            </div>
          </div>

          <div className="grid-3">
            {/* Daily revenue sparkline */}
            <div style={{ gridColumn: 'span 2' }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Daily Revenue — Last 7 Days</div>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={sel.daily}>
                  <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} formatter={v => [fmt(v), 'Revenue']} />
                  <Bar dataKey="rev" radius={[3,3,0,0]} fill={sel.color} opacity={0.85} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Feedback + stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4 }}>Stats</div>
              {[
                { l: 'Total Sessions', v: sel.total },
                { l: 'Paid', v: sel.paid, c: '#22c55e' },
                { l: 'Revenue', v: fmt(sel.rev), c: 'var(--gold)' },
                { l: 'Conversion', v: `${sel.conv}%`, c: 'var(--teal)' },
                { l: 'Positive FB', v: sel.fb_pos, c: '#22c55e' },
                { l: 'Negative FB', v: sel.fb_neg, c: 'var(--crimson)' },
              ].map(s => (
                <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ color: 'var(--muted)' }}>{s.l}</span>
                  <span style={{ fontWeight: 600, color: s.c || 'var(--cream)' }}>{v => v}{s.v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Deployment info */}
          {deployments[sel.name] && (
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--navy3)', borderRadius: 8, fontSize: 11, display: 'flex', gap: 16 }}>
              <span style={{ color: 'var(--muted)' }}>Last deploy:</span>
              <span style={{ color: 'var(--cream)' }}>{new Date(deployments[sel.name].ago).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              <span style={{ color: 'var(--muted)' }}>URL:</span>
              <a href={`https://${deployments[sel.name].url}`} target="_blank" rel="noreferrer" style={{ color: 'var(--teal)' }}>{deployments[sel.name].url}</a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
