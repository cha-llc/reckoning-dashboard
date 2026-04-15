import React from 'react'

const NAV = [
  { section: 'Campaign', items: [
    { id: 'command',   icon: '⚡', label: 'Command Center',    badge: 'Live' },
    { id: 'products',  icon: '📦', label: 'Product Intelligence' },
    { id: 'sprint',    icon: '🏃', label: 'Sprint Board' },
  ]},
  { section: 'Growth', items: [
    { id: 'social',    icon: '📱', label: 'Social Command' },
    { id: 'pipeline',  icon: '🏆', label: 'Pipeline & CRM' },
  ]},
  { section: 'Systems', items: [
    { id: 'infra',     icon: '🔧', label: 'Infrastructure' },
    { id: 'budget',    icon: '💰', label: 'Budget Analytics' },
  ]},
]

export default function Sidebar({ active, setActive }) {
  return (
    <nav className="sidebar">
      {NAV.map(group => (
        <div key={group.section}>
          <div className="nav-section-label">{group.section}</div>
          {group.items.map(item => (
            <div
              key={item.id}
              className={`nav-item ${active === item.id ? 'active' : ''}`}
              onClick={() => setActive(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </div>
          ))}
        </div>
      ))}

      <div style={{ marginTop: 'auto', padding: '20px 20px 0' }}>
        <div style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: 6 }}>Quick Links</div>
        {[
          { label: 'Budget Manager', url: 'https://cha-budget-manager.vercel.app' },
          { label: 'HubSpot CRM', url: 'https://app.hubspot.com/contacts/51330131' },
          { label: 'Linear Board', url: 'https://linear.app/cha-llc' },
          { label: 'Socialblu', url: 'https://socialbu.com' },
        ].map(l => (
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
            style={{ display: 'block', fontSize: 11, color: 'var(--muted)', padding: '4px 0', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = 'var(--teal)'}
            onMouseLeave={e => e.target.style.color = 'var(--muted)'}
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </nav>
  )
}
