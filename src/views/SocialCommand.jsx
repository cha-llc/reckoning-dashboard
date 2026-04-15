import React, { useState, useEffect } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'

// Live data from Socialblu API pulled at build time
const ACCOUNTS = [
  { id: 165296, name: 'TikTok',    icon: '🎵', color: '#C9A84C', followers: 2440,  likes: 11573, videos: 933 },
  { id: 165297, name: 'Instagram', icon: '📸', color: '#C1121F', followers: 113,   likes: null,  videos: null },
  { id: 165298, name: 'YouTube',   icon: '▶️', color: '#2A9D8F', followers: 69,    likes: null,  views: 39775, videos: 321 },
  { id: 177489, name: 'Pinterest', icon: '📌', color: '#9B5DE5', followers: 0,     monthlyViews: 142 },
  { id: 177779, name: 'Reddit',    icon: '🔴', color: '#378ADD', followers: null },
  { id: 177890, name: 'X/Twitter', icon: '✖', color: '#639922', followers: 399 },
  { id: 177891, name: 'LinkedIn',  icon: '💼', color: '#BA7517', followers: null },
]

// TikTok daily likes (Apr 2–15)
const TIKTOK_DAILY = [
  { date: 'Apr 2', likes: 8 }, { date: 'Apr 3', likes: 14 }, { date: 'Apr 4', likes: 7 },
  { date: 'Apr 5', likes: 40 }, { date: 'Apr 6', likes: 13 }, { date: 'Apr 7', likes: 14 },
  { date: 'Apr 8', likes: 4 }, { date: 'Apr 9', likes: 13 }, { date: 'Apr 10', likes: 12 },
  { date: 'Apr 11', likes: 7 }, { date: 'Apr 12', likes: 2 }, { date: 'Apr 13', likes: 3 },
  { date: 'Apr 14', likes: 2 }, { date: 'Apr 15', likes: 24 },
]

// YouTube views (Apr 5–14)
const YT_VIEWS = [
  { date: 'Apr 5', views: 135 }, { date: 'Apr 6', views: 93 }, { date: 'Apr 7', views: 2 },
  { date: 'Apr 8', views: 1702 }, { date: 'Apr 9', views: 0 }, { date: 'Apr 10', views: 176 },
  { date: 'Apr 11', views: 0 }, { date: 'Apr 12', views: 0 }, { date: 'Apr 13', views: 0 },
  { date: 'Apr 14', views: 23 }, { date: 'Apr 15', views: 0 },
]

// Top posts from live Socialblu data
const TOP_POSTS = [
  { platform: 'Instagram', type: 'image', content: 'I stopped expecting people to keep up. Not everyone is coming with you…', engagement: 4, date: 'Apr 15', url: 'https://www.instagram.com/p/DXIhH9NlOFE/' },
  { platform: 'Instagram', type: 'image', content: "I don't explain my boundaries twice. The first time is clarity…", engagement: 4, date: 'Apr 15', url: 'https://www.instagram.com/p/DXKBSR4lPE7/' },
  { platform: 'TikTok', type: 'image', content: '73% of businesses that rebrand WITHOUT a framework lose market share…', engagement: 0, date: 'Apr 15', url: null },
  { platform: 'TikTok', type: 'video', content: 'You gave them EVERYTHING. They still left. Here\'s why. 🍵', engagement: 0, date: 'Apr 15', url: null },
  { platform: 'Reddit', type: 'image', content: 'C.H.A. LLC product vault is open — 8 products from fiction to digital tools', engagement: 0, date: 'Apr 15', url: 'https://www.reddit.com/r/u_Many_Peach_43/comments/1smh730/' },
]

const PLATFORM_COLORS = {
  TikTok: '#C9A84C', Instagram: '#C1121F', YouTube: '#2A9D8F',
  Pinterest: '#9B5DE5', Reddit: '#378ADD', 'X/Twitter': '#639922', LinkedIn: '#BA7517',
}

function AccountCard({ name, icon, color, followers, likes, views, videos, monthlyViews }) {
  return (
    <div style={{
      background: 'var(--navy2)', border: '1px solid var(--border)', borderTop: `2px solid ${color}`,
      borderRadius: 'var(--radius)', padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16 }}>{icon}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cream)' }}>{name}</span>
        </div>
        <a href="https://socialbu.com" target="_blank" rel="noreferrer"
          style={{ fontSize: 9, color: 'var(--muted)', textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 1 }}>Manage ↗</a>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {followers !== null && followers !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Followers</span>
            <span style={{ fontWeight: 600, color }}>{followers?.toLocaleString() ?? '—'}</span>
          </div>
        )}
        {likes !== null && likes !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Total Likes</span>
            <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{likes?.toLocaleString() ?? '—'}</span>
          </div>
        )}
        {videos !== null && videos !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Videos</span>
            <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{videos?.toLocaleString() ?? '—'}</span>
          </div>
        )}
        {views !== null && views !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Total Views</span>
            <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{views?.toLocaleString() ?? '—'}</span>
          </div>
        )}
        {monthlyViews !== null && monthlyViews !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'var(--muted)' }}>Monthly Views</span>
            <span style={{ fontWeight: 600, color: 'var(--cream)' }}>{monthlyViews?.toLocaleString() ?? '—'}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function SocialCommand() {
  const totalFollowers = ACCOUNTS.reduce((s, a) => s + (a.followers || 0), 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      <div className="page-header">
        <div className="page-eyebrow">Reckoning Dashboard</div>
        <div className="page-title">Social Command</div>
        <div className="page-sub">Live metrics across 7 platforms · 374 posts scheduled through Jun 9 · Data via Socialblu</div>
      </div>

      {/* Summary strip */}
      <div className="kpi-grid">
        {[
          { label: 'Total Followers', value: totalFollowers.toLocaleString(), color: 'var(--gold)', sub: 'Across 5 platforms' },
          { label: 'TikTok Followers', value: '2,440', color: '#C9A84C', sub: '+11,573 likes' },
          { label: 'YouTube Views', value: '39,775', color: '#2A9D8F', sub: '69 subscribers · 321 videos' },
          { label: 'Posts Scheduled', value: '374', color: 'var(--violet)', sub: 'Through Jun 9 · 2x/day' },
        ].map(k => (
          <div key={k.label} className="kpi-card" style={{ '--accent': k.color }}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ fontSize: 22, color: k.color }}>{k.value}</div>
            {k.sub && <div className="kpi-sub">{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Platform cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {ACCOUNTS.map(a => <AccountCard key={a.id} {...a} />)}
      </div>

      {/* Charts */}
      <div className="grid-2">
        <div className="card">
          <div className="card-title">TikTok Daily Likes — Apr 2–15</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={TIKTOK_DAILY}>
              <defs>
                <linearGradient id="likeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="likes" stroke="#C9A84C" strokeWidth={2} fill="url(#likeGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="card-title">YouTube Daily Views — Apr 5–15</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={YT_VIEWS}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} interval={2} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'var(--navy3)', border: '1px solid var(--border2)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="views" radius={[3,3,0,0]} fill="#2A9D8F" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top posts */}
      <div className="card">
        <div className="card-title">
          Recent Published Posts
          <a href="https://socialbu.com" target="_blank" rel="noreferrer"
            style={{ fontSize: 9, color: 'var(--teal)', textDecoration: 'none', letterSpacing: 1, textTransform: 'uppercase' }}>
            Open Socialblu ↗
          </a>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {TOP_POSTS.map((post, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px',
              background: 'var(--navy3)', borderRadius: 8
            }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%', background: PLATFORM_COLORS[post.platform] || 'var(--muted)',
                flexShrink: 0, marginTop: 4
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--cream)', lineHeight: 1.4 }}>
                  {post.content.slice(0, 90)}{post.content.length > 90 ? '…' : ''}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 3, fontSize: 10, color: 'var(--muted)' }}>
                  <span style={{ color: PLATFORM_COLORS[post.platform] }}>{post.platform}</span>
                  <span>{post.type}</span>
                  <span>{post.date}</span>
                  {post.engagement > 0 && <span style={{ color: '#22c55e' }}>{post.engagement} engagements</span>}
                </div>
              </div>
              {post.url && (
                <a href={post.url} target="_blank" rel="noreferrer"
                  style={{ fontSize: 10, color: 'var(--teal)', textDecoration: 'none', whiteSpace: 'nowrap' }}>View ↗</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
