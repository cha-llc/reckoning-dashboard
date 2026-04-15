import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../supabase.js'

const fmt = v => `$${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`

// Live HubSpot deal data (canonical 4 phase deals + 5 product deals closed-won)
const PHASE_DEALS = [
  { id: '59217059220', name: 'Phase 1 — Confession + Architecture', amount: 1200, stage: 'qualifiedtobuy', closedate: '2026-05-31', prob: 0.25, color: '#C9A84C' },
  { id: '59230826884', name: 'Phase 2 — Engine + Circle',           amount: 5000, stage: 'appointmentscheduled', closedate: '2026-07-31', prob: 0.20, color: '#2A9D8F' },
  { id: '59226028805', name: 'Phase 3 — Proof + Amplification',     amount: 12000, stage: 'appointmentscheduled', closedate: '2026-10-31', prob: 0.20, color: '#9B5DE5' },
  { id: '59236264323', name: 'Phase 4 — Compounding + Report',      amount: 9000, stage: 'appointmentscheduled', closedate: '2026-12-31', prob: 0.20, color: '#C1121F' },
]

const PRODUCT_DEALS = [
  { id: '59090978659', name: 'Business Ops Fixer',    amount: 497,  stage: 'closedwon', color: '#D4537E' },
  { id: '59098875998', name: 'Freedom Era Audit',     amount: 150,  stage: 'closedwon', color: '#BA7517' },
  { id: '59095437884', name: 'BrandPulse Live Sales', amount: 47,   stage: 'closedwon', color: '#C9A84C' },
  { id: '59096697253', name: 'Flagged Sales',         amount: 4.99, stage: 'closedwon', color: '#C1121F' },
  { id: '59097629874', name: 'Clarity Engine Sales',  amount: 37,   stage: 'closedwon', color: '#2A9D8F' },
]

const STAGE_LABELS = {
  'appointmentscheduled': 'Planned',
  'qualifiedtobuy': 'Active',
  'closedwon': 'Closed Won',
  'closedlost': 'Closed Lost',
  'presentationscheduled': 'In Review',
  'decisionmakerboughtin': 'Committed',
}
const STAGE_COLORS = {
  'appointmentscheduled': 'var(--muted)',
  'qualifiedtobuy': 'var(--gold)',
  'closedwon': '#22c55e',
  'closedlost': 'var(--crimson)',
}

export default function PipelineCRM() {
  const [contacts, setContacts] = useState(0)
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [subRes, ppRes] = await Promise.all([
        supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
        supabase.from('product_purchases').select('product_name, amount, created_at').order('created_at', { ascending: false }).limit(10),
      ])
      setContacts(subRes.count || 0)
      setPurchases(ppRes.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const totalPipelineValue = PHASE_DEALS.reduce((s, d) => s + d.amount, 0)
  const weightedValue = PHASE_DEALS.reduce((s, d) => s + d.amount * d.prob, 0)
  const closedValue = PRODUCT_DEALS.reduce((s, d) => s + d.amount, 0)

  const pipelineChart = PHASE_DEALS.map(d => ({
    name: `P${PHASE_DEALS.indexOf(d) + 1}`,
    Target: d.amount,
    Weighted: Math.round(d.amount * d.prob),
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div className="page-header">
        <div className="page-eyebrow">Reckoning Dashboard</div>
        <div className="page-title">Pipeline & CRM</div>
        <div className="page-sub">HubSpot pipeline · Phase targets · Product deals · Contact funnel</div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {[
          { label: 'Total Pipeline Value', value: fmt(totalPipelineValue), color: 'var(--gold)', sub: '4 phase deals' },
          { label: 'Weighted Value',       value: fmt(weightedValue),      color: 'var(--teal)', sub: 'By probability' },
          { label: 'Closed Won (Products)',value: fmt(closedValue),         color: '#22c55e',     sub: '5 product deals' },
          { label: 'Newsletter Contacts',  value: loading ? '...' : contacts, color: 'var(--violet)', sub: 'Target: 50 by May 15' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent': k.color }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 20, color: k.color }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid-2">
        {/* Phase pipeline chart */}
        <div className="card">
          <div className="card-title">Phase Revenue Targets vs Weighted</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={pipelineChart} barGap={4} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" tick={{ fill: 'var(--muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} formatter={v => [fmt(v)]} />
              <Bar dataKey="Target" radius={[3,3,0,0]} fill="rgba(201,168,76,0.35)" />
              <Bar dataKey="Weighted" radius={[3,3,0,0]} fill="var(--gold)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Phase deals table */}
        <div className="card">
          <div className="card-title">
            Phase Deals
            <a href="https://app.hubspot.com/contacts/51330131/deals" target="_blank" rel="noreferrer"
              style={{ fontSize: 9, color: 'var(--teal)', textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>HubSpot ↗</a>
          </div>
          <table className="product-table">
            <thead>
              <tr><th>Phase</th><th>Target</th><th>Close</th><th>Stage</th><th>Prob</th></tr>
            </thead>
            <tbody>
              {PHASE_DEALS.map(d => (
                <tr key={d.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: d.color, display: 'inline-block' }} />
                      <span style={{ fontSize: 11 }}>{d.name.split('—')[0].trim()}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--gold)', fontWeight: 600 }}>{fmt(d.amount)}</td>
                  <td style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(d.closedate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</td>
                  <td>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: 'rgba(255,255,255,0.06)', color: STAGE_COLORS[d.stage] || 'var(--muted)' }}>
                      {STAGE_LABELS[d.stage] || d.stage}
                    </span>
                  </td>
                  <td style={{ color: 'var(--teal)', fontSize: 11 }}>{Math.round(d.prob * 100)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product deals closed won */}
      <div className="card">
        <div className="card-title">Product Deals — Closed Won</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8 }}>
          {PRODUCT_DEALS.map(d => (
            <div key={d.id} style={{
              background: 'var(--navy3)', borderRadius: 8, padding: '12px 14px',
              borderTop: `2px solid ${d.color}`
            }}>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{d.name}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', fontFamily: 'Lora, serif' }}>{fmt(d.amount)}</div>
              <div style={{ fontSize: 9, color: '#22c55e', marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Closed Won</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent purchases from Supabase */}
      <div className="card">
        <div className="card-title">Recent Product Purchases <span className="tag">Supabase</span></div>
        {loading ? (
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>Loading...</div>
        ) : purchases.length === 0 ? (
          <div style={{ color: 'var(--muted)', fontSize: 12 }}>No purchases recorded in product_purchases table yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {purchases.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', background: 'var(--navy3)', borderRadius: 7, fontSize: 12 }}>
                <span>{p.product_name}</span>
                <span style={{ color: '#22c55e' }}>${p.amount}</span>
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
