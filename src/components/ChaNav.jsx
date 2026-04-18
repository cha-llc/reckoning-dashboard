const APPS = [
  { key: 'nova',      label: 'NOVA',      url: 'https://nova-producer.vercel.app',        icon: 'N', color: '#C9A84C' },
  { key: 'reckoning', label: 'Reckoning', url: 'https://getreckoningdashboard.vercel.app', icon: '⚡', color: '#9B5DE5' },
  { key: 'budget',    label: 'Budget',    url: 'https://cha-budget-manager.vercel.app',    icon: '◆', color: '#2A9D8F' },
]

function getToken() {
  return localStorage.getItem('cha_reckoning_token') || localStorage.getItem('cha_nova_token') || ''
}

function go(url) {
  const token = getToken()
  window.location.href = token ? `${url}?access_token=${token}` : url
}

export default function ChaNav({ current }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      {APPS.map(app => {
        const active = app.key === current
        return (
          <button
            key={app.key}
            onClick={() => !active && go(app.url)}
            title={app.label}
            style={{
              display:     'flex',
              alignItems:  'center',
              gap:         6,
              padding:     '5px 10px',
              borderRadius: 8,
              border:      active ? `1px solid ${app.color}55` : '1px solid transparent',
              background:  active ? `${app.color}18` : 'transparent',
              color:       active ? app.color : 'rgba(255,255,255,0.35)',
              cursor:      active ? 'default' : 'pointer',
              fontSize:    12,
              fontFamily:  'inherit',
              fontWeight:  active ? 600 : 400,
              transition:  'all 0.15s',
              whiteSpace:  'nowrap',
            }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}
          >
            <span style={{ fontSize: app.key === 'nova' ? 11 : 13 }}>{app.icon}</span>
            <span>{app.label}</span>
          </button>
        )
      })}
    </div>
  )
}
