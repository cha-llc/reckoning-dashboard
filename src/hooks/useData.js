import { useState, useEffect, useCallback } from 'react'
import { supabase, CAMPAIGN_PRODUCTS, PHASE_TARGETS } from '../supabase.js'

export function useCommandCenter() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState(null)

  const fetch = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const [bpRes, ceRes, flRes, subsRes, lmRes, fbRes, milestonesRes, sprintRes, eventsRes] = await Promise.all([
      supabase.from('brandpulse_sessions').select('id', { count: 'exact', head: true }).eq('paid', true),
      supabase.from('clarityengine_sessions').select('id', { count: 'exact', head: true }).eq('paid', true),
      supabase.from('flagged_sessions').select('id', { count: 'exact', head: true }).eq('paid', true),
      supabase.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
      supabase.from('lead_magnet_downloads').select('id', { count: 'exact', head: true }),
      supabase.from('customer_feedback').select('sentiment'),
      supabase.from('phase_milestones').select('*').eq('phase', 'phase_1').order('target_date'),
      supabase.from('sprint_log').select('*').order('sprint_number', { ascending: false }).limit(1),
      supabase.from('campaign_events').select('*').order('created_at', { ascending: false }).limit(10),
    ])
    const bp = bpRes.count || 0
    const ce = ceRes.count || 0
    const fl = flRes.count || 0
    const totalPaid = bp + ce + fl
    const totalRevCents = (bp * 4700) + (ce * 3700) + (fl * 499)
    const fb = fbRes.data || []
    setData({
      bp, ce, fl, totalPaid,
      totalRev: totalRevCents / 100,
      subscribers: subsRes.count || 0,
      leadMagnets: lmRes.count || 0,
      fb_pos: fb.filter(f => f.sentiment === 'positive').length,
      fb_neu: fb.filter(f => f.sentiment === 'neutral').length,
      fb_neg: fb.filter(f => f.sentiment === 'negative').length,
      milestones: milestonesRes.data || [],
      sprint: sprintRes.data?.[0] || null,
      events: eventsRes.data || [],
    })
    setLastSync(new Date())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch(false)
    const channel = supabase.channel('dashboard-realtime')
      .on('postgres_changes', { event: '*',    schema: 'public', table: 'campaign_events' },        () => fetch(true))
      .on('postgres_changes', { event: '*',    schema: 'public', table: 'kpi_snapshots' },          () => fetch(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'brandpulse_sessions' },  () => fetch(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'clarityengine_sessions' },() => fetch(true))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'flagged_sessions' },     () => fetch(true))
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetch])

  return { data, loading, lastSync, isLive: !!lastSync, refetch: fetch }
}

export function useBudgetAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState('business') // business | personal

  useEffect(() => {
    async function fetch() {
      // Revenue by month
      const { data: revData } = await supabase
        .from('revenue')
        .select('date, amount, product_name, source')
        .order('date', { ascending: false })
        .limit(200)

      // Expenses by month (business or personal based on is_business flag)
      const expQuery = supabase.from('expenses').select('date, amount, division, category, is_business').order('date', { ascending: false }).limit(200)
      const { data: expData } = await expQuery

      const businessExp = (expData || []).filter(e => e.is_business === true)
      const personalExp = (expData || []).filter(e => e.is_business !== true)
      const expenses = mode === 'business' ? businessExp : personalExp

      // Aggregate by month (last 6)
      const monthMap = {}
      const addMonth = (date, key, val) => {
        const d = new Date(date)
        const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' })
        if (!monthMap[label]) monthMap[label] = { label, revenue: 0, expenses: 0, sortKey: d.getFullYear() * 100 + d.getMonth() }
        monthMap[label][key] += parseFloat(val || 0)
      }
      ;(revData || []).forEach(r => addMonth(r.date, 'revenue', r.amount))
      expenses.forEach(e => addMonth(e.date, 'expenses', e.amount))

      const months = Object.values(monthMap).sort((a, b) => a.sortKey - b.sortKey).slice(-6).map(m => ({
        ...m,
        revenue: Math.round(m.revenue * 100) / 100,
        expenses: Math.round(m.expenses * 100) / 100,
        net: Math.round((m.revenue - m.expenses) * 100) / 100,
      }))

      const totalRev = (revData || []).reduce((s, r) => s + parseFloat(r.amount || 0), 0)
      const totalExp = expenses.reduce((s, e) => s + parseFloat(e.amount || 0), 0)
      const net = totalRev - totalExp

      // This month
      const now = new Date()
      const thisMonthRev = (revData || []).filter(r => {
        const d = new Date(r.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).reduce((s, r) => s + parseFloat(r.amount || 0), 0)

      const thisMonthExp = expenses.filter(e => {
        const d = new Date(e.date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      }).reduce((s, e) => s + parseFloat(e.amount || 0), 0)

      setData({
        months,
        totalRev: Math.round(totalRev * 100) / 100,
        totalExp: Math.round(totalExp * 100) / 100,
        net: Math.round(net * 100) / 100,
        thisMonthRev: Math.round(thisMonthRev * 100) / 100,
        thisMonthExp: Math.round(thisMonthExp * 100) / 100,
        thisMonthNet: Math.round((thisMonthRev - thisMonthExp) * 100) / 100,
      })
      setLoading(false)
    }
    fetch()
  }, [mode])

  return { data, loading, mode, setMode }
}

export function useProducts() {
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [lastSync, setLastSync] = useState(null)

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    const [bpAll, ceAll, flAll, fbAll] = await Promise.all([
      supabase.from('brandpulse_sessions').select('paid, created_at'),
      supabase.from('clarityengine_sessions').select('paid, created_at'),
      supabase.from('flagged_sessions').select('paid, created_at'),
      supabase.from('customer_feedback').select('product, sentiment'),
    ])
    const sessionMap = {
      'BrandPulse':     bpAll.data || [],
      'Clarity Engine': ceAll.data || [],
      'Flagged':        flAll.data || [],
    }
    const fb = fbAll.data || []
    const products = CAMPAIGN_PRODUCTS.map(p => {
      const sessions = sessionMap[p.name] || []
      const paid = sessions.filter(s => s.paid).length
      const total = sessions.length
      const conv = total > 0 ? Math.round((paid / total) * 100) : (paid > 0 ? 100 : 0)
      const rev = paid * p.price
      const pfb = fb.filter(f => f.product === p.name)
      const daily = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i))
        const label = d.toLocaleDateString('en-US', { weekday: 'short' })
        const dayRev = sessions.filter(s => s.paid && new Date(s.created_at).toDateString() === d.toDateString()).length * p.price
        return { label, rev: Math.round(dayRev * 100) / 100 }
      })
      return { ...p, paid, total: total || paid, conv, rev: Math.round(rev * 100) / 100, daily,
        fb_pos: pfb.filter(f => f.sentiment === 'positive').length,
        fb_neg: pfb.filter(f => f.sentiment === 'negative').length,
      }
    })
    setData(products)
    setLastSync(new Date())
    setLoading(false)
  }, [])

  useEffect(() => { fetchProducts(false) }, [fetchProducts])

  return { data, loading, lastSync, isLive: !!lastSync, refetch: fetchProducts }
}

export function usePhaseProgress() {
  const today = new Date()
  return PHASE_TARGETS.map(p => {
    const start = new Date(p.start)
    const end = new Date(p.end)
    const total = end - start
    const elapsed = Math.max(0, Math.min(today - start, total))
    const daysPct = Math.round((elapsed / total) * 100)
    const isActive = today >= start && today <= end
    const isPast = today > end
    return { ...p, daysPct, isActive, isPast }
  })
}
