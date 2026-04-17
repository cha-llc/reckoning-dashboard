import React, { useState, useEffect, useCallback, useRef } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, LineChart, Line } from 'recharts'

// ── Seed snapshot (Apr 17 2026, from live Socialblu MCP pull) ─────────────
const SEED = {
  fetchedAt: '2026-04-17T19:25:00Z',
  isLive: false,
  accounts: [
    { id:165296, name:'TikTok',    icon:'🎵', color:'#C9A84C', followers:2439,  likes:11604, videos:941,  following:2277 },
    { id:165297, name:'Instagram', icon:'📸', color:'#C1121F', followers:113 },
    { id:165298, name:'YouTube',   icon:'▶️', color:'#2A9D8F', followers:69,    views:39780, videos:323 },
    { id:177489, name:'Pinterest', icon:'📌', color:'#9B5DE5', monthlyViews:218 },
    { id:177779, name:'Reddit',    icon:'🔴', color:'#378ADD' },
    { id:177890, name:'X/Twitter', icon:'✖',  color:'#639922', followers:399 },
    { id:177891, name:'LinkedIn',  icon:'💼', color:'#BA7517' },
  ],
  tiktokDailyLikes: [
    {date:'Apr 2',likes:8},{date:'Apr 3',likes:14},{date:'Apr 4',likes:7},
    {date:'Apr 5',likes:40},{date:'Apr 6',likes:13},{date:'Apr 7',likes:14},
    {date:'Apr 8',likes:4},{date:'Apr 9',likes:13},{date:'Apr 10',likes:12},
    {date:'Apr 11',likes:7},{date:'Apr 12',likes:2},{date:'Apr 13',likes:3},
    {date:'Apr 14',likes:2},{date:'Apr 15',likes:24},{date:'Apr 16',likes:15},{date:'Apr 17',likes:16},
  ],
  ytDailyViews: [
    {date:'Apr 5',views:135},{date:'Apr 6',views:93},{date:'Apr 7',views:2},
    {date:'Apr 8',views:1702},{date:'Apr 9',views:0},{date:'Apr 10',views:176},
    {date:'Apr 11',views:0},{date:'Apr 12',views:0},{date:'Apr 13',views:0},
    {date:'Apr 14',views:23},{date:'Apr 15',views:0},{date:'Apr 16',views:3},{date:'Apr 17',views:2},
  ],
  engagementTrend: [
    {date:'Apr 1',eng:12},{date:'Apr 2',eng:19},{date:'Apr 3',eng:17},{date:'Apr 4',eng:23},
    {date:'Apr 5',eng:23},{date:'Apr 6',eng:15},{date:'Apr 7',eng:18},{date:'Apr 8',eng:13},
    {date:'Apr 9',eng:14},{date:'Apr 10',eng:22},{date:'Apr 11',eng:17},{date:'Apr 12',eng:18},
    {date:'Apr 13',eng:16},{date:'Apr 14',eng:21},{date:'Apr 15',eng:38},{date:'Apr 16',eng:44},{date:'Apr 17',eng:49},
  ],
  topPosts: [
    { platform:'Instagram', type:'image', content:'I healed by showing up, not shutting down. Discipline gave me somewhere to put the pain.', engagement:19, date:'Apr 16', url:'https://www.instagram.com/p/DXLF6XxlIw5/' },
    { platform:'Instagram', type:'image', content:"I stopped expecting people to keep up. Not everyone is coming with you. That's direction.", engagement:10, date:'Apr 15', url:'https://www.instagram.com/p/DXIhH9NlOFE/' },
    { platform:'LinkedIn',  type:'text',  content:"The system isn't broken. You just never had one. BrandPulse ($47) — the brand audit you've been putting off.", engagement:2, date:'Apr 15', url:'https://www.linkedin.com/feed/update/urn:li:share:7450196308251996160' },
    { platform:'Instagram', type:'video', content:"You didn't lose yourself. You negotiated yourself away. One compromise at a time.", engagement:1, date:'Apr 16', url:'https://www.instagram.com/reel/DXLoT8fEx-g/' },
    { platform:'X/Twitter', type:'text',  content:'I healed by showing up, not shutting down. Discipline gave me somewhere to put the pain.', engagement:1, date:'Apr 16', url:'https://twitter.com/170368098/status/2044581555973058950' },
  ],
}

const PLATFORM_COLORS = {
  TikTok:'#C9A84C', Instagram:'#C1121F', YouTube:'#2A9D8F',
  Pinterest:'#9B5DE5', Reddit:'#378ADD', 'X/Twitter':'#639922', LinkedIn:'#BA7517',
}

function msUntilNextHour() {
  const now = new Date()
  const next = new Date(now)
  next.setHours(now.getHours() + 1, 0, 0, 0)
  return next.getTime() - now.getTime()
}

function AccountCard({ name, icon, color, followers, likes, views, videos, monthlyViews }) {
  return (
    <div style={{
      background:'var(--navy2)', border:'1px solid var(--border)', borderTop:`2px solid ${color}`,
      borderRadius:'var(--radius)', padding:'14px 16px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ fontSize:15 }}>{icon}</span>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--cream)' }}>{name}</span>
        </div>
        <a href="https://socialbu.com" target="_blank" rel="noreferrer"
          style={{ fontSize:9, color:'var(--muted)', textDecoration:'none', textTransform:'uppercase', letterSpacing:1 }}>Manage ↗</a>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {followers != null && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:'var(--muted)' }}>Followers</span>
          <span style={{ fontWeight:600, color }}>{(followers||0).toLocaleString()}</span>
        </div>}
        {likes != null && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:'var(--muted)' }}>Total Likes</span>
          <span style={{ fontWeight:600, color:'var(--cream)' }}>{likes.toLocaleString()}</span>
        </div>}
        {videos != null && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:'var(--muted)' }}>Videos</span>
          <span style={{ fontWeight:600, color:'var(--cream)' }}>{videos.toLocaleString()}</span>
        </div>}
        {views != null && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:'var(--muted)' }}>Total Views</span>
          <span style={{ fontWeight:600, color:'var(--cream)' }}>{views.toLocaleString()}</span>
        </div>}
        {monthlyViews != null && <div style={{ display:'flex', justifyContent:'space-between', fontSize:12 }}>
          <span style={{ color:'var(--muted)' }}>Monthly Views</span>
          <span style={{ fontWeight:600, color:'var(--cream)' }}>{monthlyViews.toLocaleString()}</span>
        </div>}
      </div>
    </div>
  )
}

export default function SocialCommand() {
  const [d, setD]               = useState(SEED)
  const [loading, setLoading]   = useState(false)
  const [lastSync, setLastSync] = useState(new Date(SEED.fetchedAt))
  const [spinning, setSpinning] = useState(false)
  const [nextHourMs, setNextHourMs] = useState(msUntilNextHour())
  const hourTimerRef            = useRef(null)
  const countdownRef            = useRef(null)

  // ── Live fetch via Anthropic API + Socialblu MCP ──────────────────────
  const fetchLive = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setSpinning(true)

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: 'You are a JSON extraction agent. Call the Socialblu MCP tools and return ONLY a raw JSON object — no markdown, no code fences, no explanation.',
          messages: [{
            role: 'user',
            content: `Fetch from Socialblu MCP:
1. get_account_metrics for account_ids [165296,165297,165298,177489,177779,177890,177891] date_from today-17days date_to today
2. get_engagement_trend for [165296,165297,165298] same date range
3. get_top_posts for all accounts date_from today-4days date_to today limit 8

Return this exact JSON (integers only, null if unavailable):
{
  "accounts":[
    {"id":165296,"followers":N,"likes":N,"videos":N},
    {"id":165297,"followers":N},
    {"id":165298,"followers":N,"views":N,"videos":N},
    {"id":177489,"monthlyViews":N},
    {"id":177890,"followers":N}
  ],
  "tiktokDailyLikes":[{"date":"Mon D","likes":N}],
  "ytDailyViews":[{"date":"Mon D","views":N}],
  "engagementTrend":[{"date":"Mon D","eng":N}],
  "topPosts":[{"platform":"S","type":"S","content":"S(max90)","engagement":N,"date":"Mon D","url":"S|null"}]
}`
          }]
        })
      })

      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      const text = (json.content || []).map((b) => b.text || '').join('')
      const clean = text.replace(/```json|```/g, '').trim()
      const fresh = JSON.parse(clean)

      // Merge live data on top of seed (preserves icon/color/name)
      setD(prev => ({
        ...prev,
        isLive: true,
        fetchedAt: new Date().toISOString(),
        accounts: prev.accounts.map(seed => {
          const live = (fresh.accounts || []).find(a => a.id === seed.id)
          return live ? { ...seed, ...live } : seed
        }),
        tiktokDailyLikes: fresh.tiktokDailyLikes?.length ? fresh.tiktokDailyLikes : prev.tiktokDailyLikes,
        ytDailyViews:     fresh.ytDailyViews?.length     ? fresh.ytDailyViews     : prev.ytDailyViews,
        engagementTrend:  fresh.engagementTrend?.length  ? fresh.engagementTrend  : prev.engagementTrend,
        topPosts:         fresh.topPosts?.length          ? fresh.topPosts         : prev.topPosts,
      }))
      setLastSync(new Date())
    } catch (e) {
      console.warn('Social live fetch failed, using cached data:', e.message)
    }

    setLoading(false)
    setSpinning(false)
  }, [])

  // ── Load on mount ──────────────────────────────────────────────────────
  useEffect(() => { fetchLive(false) }, [fetchLive])

  // ── Auto-refresh: next top of hour, then every 60 min ─────────────────
  useEffect(() => {
    const scheduleNext = () => {
      const delay = msUntilNextHour()
      hourTimerRef.current = setTimeout(() => {
        fetchLive(true)
        hourTimerRef.current = setInterval(() => fetchLive(true), 60 * 60 * 1000)
      }, delay)
    }
    scheduleNext()
    countdownRef.current = setInterval(() => setNextHourMs(msUntilNextHour()), 30000)
    return () => {
      clearTimeout(hourTimerRef.current)
      clearInterval(hourTimerRef.current)
      clearInterval(countdownRef.current)
    }
  }, [fetchLive])

  const totalFollowers  = d.accounts.reduce((s, a) => s + (a.followers || 0), 0)
  const tiktok          = d.accounts.find(a => a.id === 165296) || {}
  const youtube         = d.accounts.find(a => a.id === 165298) || {}
  const nextHourMins    = Math.max(1, Math.round(nextHourMs / 60000))
  const syncAgoMins     = Math.round((Date.now() - lastSync.getTime()) / 60000)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

      <style>{`@keyframes spin { to { transform:rotate(360deg); } }`}</style>

      {/* Header */}
      <div className="page-header">
        <div className="page-eyebrow">Reckoning Dashboard</div>
        <div className="page-title">Social Command</div>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4, flexWrap:'wrap' }}>
          <div className="page-sub" style={{ margin:0 }}>
            {d.isLive ? 'Live metrics via Socialblu' : 'Cached snapshot — loading live data…'} · 7 platforms · 374 posts scheduled
          </div>
          {/* Sync dot */}
          <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:10, color: d.isLive ? '#22c55e' : 'var(--gold)' }}>
            <div style={{
              width:6, height:6, borderRadius:'50%',
              background: d.isLive ? '#22c55e' : 'var(--gold)',
              animation: loading ? 'pulse 0.7s infinite' : 'pulse 3s infinite'
            }} />
            {loading ? 'Fetching…' : d.isLive
              ? (syncAgoMins < 1 ? 'Just updated' : `Updated ${syncAgoMins}m ago`)
              : 'Snapshot · awaiting live fetch'
            }
          </div>
          {/* Countdown */}
          <div style={{ fontSize:10, color:'var(--muted)' }}>
            Auto-refresh in {nextHourMins}m
          </div>
          {/* Manual refresh */}
          <button onClick={() => fetchLive(false)} disabled={loading}
            style={{
              display:'flex', alignItems:'center', gap:5,
              fontSize:11, padding:'4px 12px', borderRadius:6,
              cursor: loading ? 'not-allowed' : 'pointer',
              border:'1px solid var(--border2)', background:'transparent',
              color: loading ? 'var(--muted)' : 'var(--cream)',
              transition:'all .15s', fontFamily:'inherit',
            }}>
            <span style={{ display:'inline-block', fontSize:13, animation: spinning ? 'spin 1s linear infinite' : 'none' }}>↻</span>
            {loading ? 'Refreshing…' : 'Refresh now'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        {[
          { label:'Total Followers',  value: totalFollowers.toLocaleString(),            color:'var(--gold)',    sub:'Across 5 platforms' },
          { label:'TikTok Followers', value: (tiktok.followers||0).toLocaleString(),      color:'#C9A84C',       sub:`+${(tiktok.likes||0).toLocaleString()} total likes` },
          { label:'YouTube Views',    value: (youtube.views||0).toLocaleString(),         color:'#2A9D8F',       sub:`${youtube.followers||0} subscribers · ${youtube.videos||0} videos` },
          { label:'Posts Scheduled',  value: '374',                                       color:'var(--violet)', sub:'Through Jun 9 · 2x/day' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent': k.color }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize:22, color:k.color }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Platform cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(155px, 1fr))', gap:10 }}>
        {d.accounts.map(a => <AccountCard key={a.id} {...a} />)}
      </div>

      {/* Engagement trend */}
      <div className="card">
        <div className="card-title">Overall Engagement — Last 17 Days</div>
        <ResponsiveContainer width="100%" height={130}>
          <LineChart data={d.engagementTrend}>
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} interval={3} />
            <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background:'var(--navy3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} />
            <Line type="monotone" dataKey="eng" stroke="#C9A84C" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* TikTok + YouTube charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">TikTok Daily Likes</div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={d.tiktokDailyLikes}>
              <defs>
                <linearGradient id="likeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--navy3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} />
              <Area type="monotone" dataKey="likes" stroke="#C9A84C" strokeWidth={2} fill="url(#likeGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="card-title">YouTube Daily Views</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={d.ytDailyViews}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fill:'var(--muted)', fontSize:10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:'var(--navy3)', border:'1px solid var(--border2)', borderRadius:8, fontSize:12 }} />
              <Bar dataKey="views" radius={[3,3,0,0]} fill="#2A9D8F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top posts */}
      <div className="card">
        <div className="card-title">
          Top Posts — Last 4 Days
          <a href="https://socialbu.com" target="_blank" rel="noreferrer"
            style={{ fontSize:9, color:'var(--teal)', textDecoration:'none', letterSpacing:1, textTransform:'uppercase' }}>
            Open Socialblu ↗
          </a>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {d.topPosts.map((post, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 10px', background:'var(--navy3)', borderRadius:8 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:PLATFORM_COLORS[post.platform]||'var(--muted)', flexShrink:0, marginTop:4 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:'var(--cream)', lineHeight:1.4 }}>
                  {(post.content||'').slice(0,90)}{(post.content||'').length>90?'…':''}
                </div>
                <div style={{ display:'flex', gap:8, marginTop:3, fontSize:10, color:'var(--muted)' }}>
                  <span style={{ color:PLATFORM_COLORS[post.platform] }}>{post.platform}</span>
                  <span>{post.type}</span>
                  <span>{post.date}</span>
                  {post.engagement>0 && <span style={{ color:'#22c55e' }}>{post.engagement} engagements</span>}
                </div>
              </div>
              {post.url && <a href={post.url} target="_blank" rel="noreferrer"
                style={{ fontSize:10, color:'var(--teal)', textDecoration:'none', whiteSpace:'nowrap' }}>View ↗</a>}
            </div>
          ))}
        </div>
        <div style={{ marginTop:10, fontSize:10, color:'var(--muted)', display:'flex', justifyContent:'space-between' }}>
          <span>Socialblu MCP · {d.isLive ? 'live' : 'cached'} · auto-refreshes hourly on the hour</span>
          <span>Last: {lastSync.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' })}</span>
        </div>
      </div>

    </div>
  )
}
