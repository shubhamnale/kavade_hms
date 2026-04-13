import React, { useState, useCallback } from 'react'
import { reportsAPI } from '../api'
import { StatCard, Card, Spinner, PageHeader } from '../components/UI'
import { theme } from '../theme'
import useAutoRefresh from '../hooks/useAutoRefresh'

export default function ReportsPage() {
  const [summary, setSummary] = useState(null)
  const [perf,    setPerf]    = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [s, p] = await Promise.all([reportsAPI.summary(), reportsAPI.doctorPerformance()])
      setSummary(s.data.data)
      setPerf(p.data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useAutoRefresh(load, 10000)

  if (loading) return <div style={{ padding:28 }}><Spinner /></div>

  const TH = ({ c }) => (
    <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:theme.muted, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`2px solid ${theme.border}`, background:'#F8FAFC' }}>{c}</th>
  )

  return (
    <div className="page-content" style={{ padding:28, animation:'fadeIn .35s ease' }}>
      <PageHeader title="Reports & Analytics" subtitle="Auto-refreshing every 10s" />

      {summary && (
        <div className="stat-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
          <StatCard label="Today's Patients" value={summary.todayPatients}  icon="👥" c1="#1E88E5" c2="#1565C0" />
          <StatCard label="Waiting"          value={summary.waitingCount}   icon="⏱" c1="#F9A825" c2="#EF6C00" />
          <StatCard label="Billed"           value={summary.billedCount}    icon="✓" c1="#00897B" c2="#004D40" />
          <StatCard label="Revenue Today"    value={`₹${(summary.todayRevenue||0).toLocaleString('en-IN')}`} icon="💰" c1="#8E24AA" c2="#6A1B9A" />
        </div>
      )}

      <Card noPad>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${theme.border}` }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:theme.primary }}>Doctor Performance</h3>
        </div>
        <div className="table-scroll-wrapper">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead><tr><TH c="Doctor" /><TH c="Specialty" /><TH c="Total Patients" /><TH c="Avg Time" /><TH c="Revenue" /></tr></thead>
          <tbody>
            {perf.map(d => (
              <tr key={d.doctor} style={{ borderBottom:'1px solid #EEF2F7' }}>
                <td style={{ padding:'12px 14px', fontWeight:600 }}>{d.doctor}</td>
                <td style={{ padding:'12px 14px', color:theme.muted, fontSize:13 }}>{d.specialty}</td>
                <td style={{ padding:'12px 14px', fontSize:13 }}>{d.totalPatients}</td>
                <td style={{ padding:'12px 14px', fontSize:13 }}>{d.avgConsultMin} min</td>
                <td style={{ padding:'12px 14px', fontWeight:700, color:theme.success }}>₹{(d.revenue||0).toLocaleString('en-IN')}</td>
              </tr>
            ))}
            {perf.length === 0 && <tr><td colSpan={5} style={{ padding:40, textAlign:'center', color:theme.muted }}>No data yet</td></tr>}
          </tbody>
        </table>
        </div>
      </Card>
    </div>
  )
}
