import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://vzzzqsmqqaoilkmskadl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6enpxc21xcWFvaWxrbXNrYWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2Mzk0MzgsImV4cCI6MjA5MDIxNTQzOH0.M3pLdkRMFXyvTjcKhX3fR7o6pGtW7Xg7NKcO_sHw2Oo'
)

export const VERCEL_TEAM = 'team_k3SW6kwW72UAuBJmbxewL8ZH'
export const GITHUB_ORG = 'cha-llc'

export const CAMPAIGN_PRODUCTS = [
  { name: 'BrandPulse',     price: 47,   table: 'brandpulse_sessions',    url: 'https://getbrandpulse.vercel.app',    color: '#C9A84C' },
  { name: 'Clarity Engine', price: 37,   table: 'clarityengine_sessions', url: 'https://getclarityengine.vercel.app', color: '#2A9D8F' },
  { name: 'Flagged',        price: 4.99, table: 'flagged_sessions',       url: 'https://getflagged.vercel.app',       color: '#C1121F' },
  { name: 'Burnout Reset',  price: 67,   table: null,                     url: 'https://getburnoutreset.vercel.app',  color: '#9B5DE5' },
  { name: 'Couples Clarity',price: 97,   table: null,                     url: 'https://getcouplesclarity.vercel.app',color: '#378ADD' },
  { name: 'First-Gen Table',price: 17,   table: null,                     url: 'https://getfirstgentable.vercel.app', color: '#639922' },
  { name: 'Freedom Era Audit', price: 150, table: null,                   url: 'https://cjhadisa.com',                color: '#BA7517' },
  { name: 'Business Ops Fixer', price: 497, table: null,                  url: 'https://cjhadisa.com',                color: '#D4537E' },
]

export const PHASE_TARGETS = [
  { phase: 1, label: 'Phase 1', start: '2026-04-14', end: '2026-05-31', target: 1200,  deal: '59217059220', color: '#C9A84C' },
  { phase: 2, label: 'Phase 2', start: '2026-06-01', end: '2026-07-31', target: 5000,  deal: '59230826884', color: '#2A9D8F' },
  { phase: 3, label: 'Phase 3', start: '2026-08-01', end: '2026-10-31', target: 12000, deal: '59226028805', color: '#9B5DE5' },
  { phase: 4, label: 'Phase 4', start: '2026-11-01', end: '2026-12-31', target: 9000,  deal: '59236264323', color: '#C1121F' },
]
