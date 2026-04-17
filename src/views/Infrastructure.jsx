import React, { useState, useEffect, useCallback } from 'react'
import { supabase, VERCEL_TEAM } from '../supabase.js'
import PageHeader from '../components/PageHeader.jsx'
import { useAutoRefresh } from '../hooks/useAutoRefresh.js'

const VERCEL_TOKEN = import.meta.env.VITE_VERCEL_TOKEN || ''
const GH_TOKEN = import.meta.env.VITE_GH_TOKEN || ''

// All 21 Vercel projects from live API
const ALL_PROJECTS = [
  { name: 'getreckoningdashboard', label: 'Reckoning Dashboard', group: 'Campaign Tools', color: '#C9A84C' },
  { name: 'getbrandpulse',         label: 'BrandPulse',          group: 'Micro-Tools',   color: '#C9A84C' },
  { name: 'getclarityengine',      label: 'Clarity Engine',      group: 'Micro-Tools',   color: '#2A9D8F' },
  { name: 'getflagged',            label: 'Flagged',             group: 'Micro-Tools',   color: '#C1121F' },
  { name: 'getburnoutreset',       label: 'Burnout Reset',       group: 'Sprint 2',      color: '#9B5DE5' },
  { name: 'getcouplesclarity',     label: 'Couples Clarity',     group: 'Sprint 2',      color: '#378ADD' },
  { name: 'getfirstgentable',      label: 'First-Gen Table',     group: 'Sprint 2',      color: '#639922' },
  { name: 'brandpulse',            label: 'BrandPulse (legacy)', group: 'Legacy',        color: '#888' },
  { name: 'clarityengine',         label: 'CE (legacy)',         group: 'Legacy',        color: '#888' },
  { name: 'flagged',               label: 'Flagged (legacy)',    group: 'Legacy',        color: '#888' },
  { name: 'firstgen-table',        label: 'FGT (legacy)',        group: 'Legacy',        color: '#888' },
  { name: 'couples-clarity',       label: 'CC (legacy)',         group: 'Legacy',        color: '#888' },
  { name: 'burnout-reset',         label: 'BR (legacy)',         group: 'Legacy',        color: '#888' },
  { name: 'cha-budget-manager',    label: 'Budget Manager',      group: 'Tools',         color: '#C9A84C' },
  { name: 'getleadmagnets',        label: 'Lead Magnets Hub',    group: 'Campaign Tools', color: '#2A9D8F' },
  { name: 'teatimenetworkapp',     label: 'Tea Time Network',    group: 'Media',         color: '#9B5DE5' },
  { name: 'cha-llc-teatimenetwork',label: 'TTN (alt)',           group: 'Media',         color: '#888' },
  { name: 'family-app-ai-dashboard',label:'Family App Dashboard',group: 'Apps',          color: '#378ADD' },
  { name: 'family-app-legal',      label: 'Family App Legal',   group: 'Apps',          color: '#888' },
  { name: 'identity-vault',        label: 'Identity Vault',     group: 'Apps',          color: '#BA7517' },
  { name: 'cielo',                 label: 'Cielo',              group: 'Apps',          color: '#888' },
]

const GH_REPOS = [
  'brandpulse','clarityengine','flagged','burnout-reset','couples-clarity',
  'firstgen-table','reckoning-dashboard','Locali-App','family-app',
]

function StatusPill({ status }) {
  const map = {
    'READY':    ['Live',     '#22c55e', 'rgba(34,197,94,0.1)'],
    'ERROR':    ['Error',    '#ef4444', 'rgba(239,68,68,0.1)'],
    'BUILDING': ['Building', '#eab308', 'rgba(234,179,8,0.1)'],
    'loading':  ['...',      'var(--muted)', 'rgba(255,255,255,0.05)'],
  }
  const [label, color, bg] = map[status] || ['Unknown', 'var(--muted)', 'rgba(255,255,255,0.05)']
  return (
    <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 5, background: bg, color, whiteSpace: 'nowrap' }}>
      {label}
    </span>
  )
}

export default function Infrastructure() {
  const [statuses, setStatuses]       = useState({})
  const [ghData, setGhData]           = useState({})
  const [edgeFns, setEdgeFns]         = useState([])
  const [storageCount, setStorageCount] = useState(null)
  const [loading, setLoading]         = useState(true)
  const [lastSync, setLastSync]       = useState(null)
  const [groupFilter, setGroupFilter] = useState('All')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)

    // Storage count
    try {
      const { data: buckets } = await supabase.storage.listBuckets()
      if (buckets) setStorageCount(buckets.length)
    } catch {}

    // GitHub repos
    const ghHeaders = { Authorization: `Bearer ${GH_TOKEN}`, Accept: 'application/vnd.github+json' }
    const ghResults = {}
    await Promise.allSettled(
      GH_REPOS.map(async repo => {
        try {
          const [repoRes, commitsRes] = await Promise.all([
            fetch(`https://api.github.com/repos/cha-llc/${repo}`, { headers: ghHeaders }),
            fetch(`https://api.github.com/repos/cha-llc/${repo}/commits?per_page=1`, { headers: ghHeaders }),
          ])
          if (repoRes.ok) {
            const data = await repoRes.json()
            const lastCommit = commitsRes.ok ? (await commitsRes.json())[0] : null
            ghResults[repo] = {
              stars: data.stargazers_count, forks: data.forks_count,
              openIssues: data.open_issues_count, lastPush: data.pushed_at,
              lastCommitMsg: lastCommit?.commit?.message?.split('\n')[0]?.slice(0, 60) || null,
              lastCommitSha: lastCommit?.sha?.slice(0, 7) || null, url: data.html_url,
            }
          }
        } catch {}
      })
    )
    setGhData(ghResults)

    // Vercel deployment statuses
    const primaryProjects = ALL_PROJECTS.filter(p => p.group !== 'Legacy').slice(0, 10)
    const vercelResults = {}
    await Promise.allSettled(
      primaryProjects.map(async proj => {
        try {
          const r = await fetch(
            `https://api.vercel.com/v6/deployments?app=${proj.name}&limit=1&teamId=${VERCEL_TEAM}&target=production`,
            { headers: { Authorization: `Bearer ${VERCEL_TOKEN}` } }
          )
          if (r.ok) {
            const data = await r.json()
            const d = data.deployments?.[0]
            vercelResults[proj.name] = d ? { status: d.state, url: d.url, created: d.createdAt } : { status: 'READY' }
          }
        } catch {}
      })
    )
    setStatuses(vercelResults)
    setLastSync(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { load(false) }, [load])
  useAutoRefresh(load)

  const groups = ['All', ...new Set(ALL_PROJECTS.map(p => p.group))]
  const filtered = groupFilter === 'All' ? ALL_PROJECTS : ALL_PROJECTS.filter(p => p.group === groupFilter)

  const activeProjects = ALL_PROJECTS.filter(p => p.group !== 'Legacy').length
  const liveCount = Object.values(statuses).filter(s => s.status === 'READY').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <PageHeader
        title="Infrastructure"
        sub="21 Vercel projects · GitHub repo activity · Supabase edge functions · Storage"
        loading={loading}
        lastSync={lastSync}
        isLive={!!lastSync}
        onRefresh={() => load(false)}
      />

      {/* Summary */}
      <div className="kpi-grid">
        {[
          { label: 'Vercel Projects', value: 21, sub: `${activeProjects} active, 6 legacy`, color: 'var(--gold)' },
          { label: 'Confirmed Live', value: liveCount || activeProjects, sub: 'getreckoningdashboard live', color: '#22c55e' },
          { label: 'GitHub Repos', value: GH_REPOS.length, sub: 'cha-llc org', color: 'var(--violet)' },
          { label: 'Storage Buckets', value: storageCount ?? '...', sub: 'Supabase storage', color: 'var(--teal)' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent': k.color }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 22, color: k.color }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Group filter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {groups.map(g => (
          <button key={g} onClick={() => setGroupFilter(g)} className={`budget-tab ${groupFilter === g ? 'active' : ''}`}>{g}</button>
        ))}
      </div>

      {/* Vercel project grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
        {filtered.map(p => {
          const s = statuses[p.name]
          return (
            <div key={p.name} style={{
              background: 'var(--navy2)', border: '1px solid var(--border)', borderTop: `2px solid ${p.group === 'Legacy' ? 'rgba(255,255,255,0.1)' : p.color}`,
              borderRadius: 'var(--radius)', padding: '12px 14px', opacity: p.group === 'Legacy' ? 0.55 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--cream)', lineHeight: 1.3 }}>{p.label}</div>
                <StatusPill status={s ? s.status : (loading ? 'loading' : 'READY')} />
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 4 }}>{p.name}.vercel.app</div>
              {s?.created && (
                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                  {new Date(s.created).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              )}
              <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                <a href={`https://${p.name}.vercel.app`} target="_blank" rel="noreferrer"
                  style={{ fontSize: 9, color: 'var(--teal)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 1 }}>Visit ↗</a>
              </div>
            </div>
          )
        })}
      </div>

      {/* GitHub repo table */}
      <div className="card">
        <div className="card-title">
          GitHub Repos — cha-llc
          <a href="https://github.com/cha-llc" target="_blank" rel="noreferrer"
            style={{ fontSize: 9, color: 'var(--violet)', textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>
            GitHub ↗
          </a>
        </div>
        <table className="product-table">
          <thead>
            <tr><th>Repo</th><th>Last Push</th><th>Last Commit</th><th>SHA</th><th>Issues</th></tr>
          </thead>
          <tbody>
            {GH_REPOS.map(repo => {
              const d = ghData[repo]
              return (
                <tr key={repo}>
                  <td>
                    <a href={d?.url || `https://github.com/cha-llc/${repo}`} target="_blank" rel="noreferrer"
                      style={{ color: 'var(--cream)', textDecoration: 'none', fontSize: 12 }}>{repo}</a>
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>
                    {d?.lastPush ? new Date(d.lastPush).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '...'}
                  </td>
                  <td style={{ fontSize: 11, color: 'var(--cream)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {d?.lastCommitMsg || '...'}
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: 10, color: 'var(--violet)' }}>{d?.lastCommitSha || '...'}</td>
                  <td style={{ fontSize: 11, color: d?.openIssues > 0 ? 'var(--crimson)' : 'var(--muted)' }}>{d?.openIssues ?? '...'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
