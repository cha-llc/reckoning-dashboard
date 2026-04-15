import React from 'react'

function ComingSoon({ title, icon, sources }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="page-header">
        <div className="page-eyebrow">Reckoning Dashboard</div>
        <div className="page-title">{icon} {title}</div>
        <div className="page-sub">This view is being built. Phase 2 of the dashboard build.</div>
      </div>
      <div className="card">
        <div className="card-title">Data sources for this view</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sources.map(s => (
            <span key={s} style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 12,
              background: 'var(--navy3)', border: '1px solid var(--border)',
              color: 'var(--muted)'
            }}>{s}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function ProductIntelligence() {
  return <ComingSoon title="Product Intelligence" icon="📦"
    sources={['Supabase — sessions, feedback, product_performance', 'Vercel MCP — deployment status per project', 'GitHub REST API — commits, open PRs per repo']} />
}

export function SprintBoard() {
  return <ComingSoon title="Sprint Board" icon="🏃"
    sources={['Linear MCP — all CHA issues, sprint velocity', 'Supabase — sprint_log, phase_milestones', 'Google Calendar MCP — deadline reminders']} />
}

export function SocialCommand() {
  return <ComingSoon title="Social Command" icon="📱"
    sources={['Socialblu MCP — account metrics, top posts, engagement trend', 'Supabase — campaign_events social category']} />
}

export function PipelineCRM() {
  return <ComingSoon title="Pipeline & CRM" icon="🏆"
    sources={['HubSpot MCP — deals, contacts, lifecycle stages', 'Supabase — product_purchases, kpi_snapshots']} />
}

export function Infrastructure() {
  return <ComingSoon title="Infrastructure" icon="🔧"
    sources={['Vercel MCP — all 21 projects, deployment health', 'GitHub REST API — cha-llc org repos, commits', 'Supabase — edge functions, storage assets']} />
}

export function BudgetView() {
  return <ComingSoon title="Budget Analytics (Full)" icon="💰"
    sources={['Supabase — revenue, expenses, division_budgets, budget_snapshots', 'cha-budget-manager.vercel.app — linked for full view']} />
}
