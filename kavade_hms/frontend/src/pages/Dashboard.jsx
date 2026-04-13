import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { useAuth }                from '../context/AuthContext'
import { patientsAPI, reportsAPI } from '../api'
import { StatCard, Card, Spinner, StatusBadge, getRowBg } from '../components/UI'
import { theme } from '../theme'

function fmtTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true })
}

export default function Dashboard() {
  const { user } = useAuth()
  const [patients, setPatients] = useState([])
  const [stats,    setStats]    = useState(null)
  const [loading,  setLoading]  = useState(true)
  const fetchRef = useRef(null)

  const load = useCallback(async (showSpinner = false) => {
    if (fetchRef.current) clearTimeout(fetchRef.current)
    fetchRef.current = setTimeout(async () => {
      if (showSpinner) setLoading(true)
      try {
        if (user.role === 'admin') {
          const [pRes, sRes] = await Promise.all([
            patientsAPI.getAll({ filter: 'today' }),
            reportsAPI.summary(),
          ])
          setPatients(pRes.data.data)
          setStats(sRes.data.data)
        } else {
          const pRes = await patientsAPI.getAll({ filter: 'today' })
          setPatients(pRes.data.data)
        }
      } catch (e) {
        console.error('Dashboard load:', e)
      } finally {
        setLoading(false)
      }
    }, 0)
  }, [user.role])

  useEffect(() => { load(true) }, [load])
  useEffect(() => {
    const id = setInterval(() => load(false), 8000)
    return () => clearInterval(id)
  }, [load])

  const { waiting, withDoc, completed, billed, billedRevenue } = useMemo(() => {
    const agg = {
      waiting: [],
      withDoc: [],
      completed: [],
      billed: [],
      billedRevenue: 0,
    }

    for (const p of patients) {
      if (p.status === 'Registered') agg.waiting.push(p)
      else if (p.status === 'Doctor Pending') agg.withDoc.push(p)
      else if (p.status === 'Doctor Completed') agg.completed.push(p)
      else if (p.status === 'Billed') {
        agg.billed.push(p)
        agg.billedRevenue += p.totalAmount || 0
      }
    }

    return agg
  }, [patients])

  if (loading) return <div style={{ padding:28 }}><Spinner /></div>

  // Admin & doctor see all today's patients in table (no slice) so count matches stat card
  const tablePatients = (user.role === 'admin' || user.role === 'doctor') ? patients : patients.slice(0, 20)

  const TH = ({ c }) => (
    <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:theme.muted, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`2px solid ${theme.border}`, background:'#F8FAFC' }}>{c}</th>
  )

  return (
    <div className="page-content dashboard-page" style={{ padding:28, animation:'fadeIn .35s ease' }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:theme.primary }}>
        {user.role.charAt(0).toUpperCase() + user.role.slice(1)} Dashboard
      </h2>
      <p style={{ fontSize:13, color:theme.muted, marginTop:4, marginBottom:24 }}>
        Welcome, {user.name}
      </p>

    {/* Admin stats */}
{user.role === 'admin' && (
  <div className="stat-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
    <StatCard label="Today's Patients" value={stats?.todayPatients ?? patients.length}                                    icon="👥" c1="#1E88E5" c2="#1565C0" />
    <StatCard label="Waiting"          value={stats?.waitingCount  ?? waiting.length}  icon="⏱" c1="#F9A825" c2="#EF6C00" />
    <StatCard label="Billed"           value={stats?.billedCount   ?? billed.length}   icon="✓" c1="#00897B" c2="#004D40" />
    <StatCard label="Today's Revenue"  value={`₹${((stats?.todayRevenue) ?? billedRevenue).toLocaleString('en-IN')}`} icon="💰" c1="#8E24AA" c2="#6A1B9A" />
  </div>
)}

      {/* Reception stats */}
      {user.role === 'reception' && (
        <div className="stat-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          <StatCard label="Registered Today" value={patients.length}                          icon="👥" c1="#1E88E5" c2="#1565C0" />
          <StatCard label="Waiting"          value={waiting.length}                           icon="⏱" c1="#F9A825" c2="#EF6C00" />
          <StatCard label="Processed"        value={withDoc.length + completed.length + billed.length} icon="✓" c1="#00897B" c2="#004D40" />
        </div>
      )}

      {/* Doctor stats */}
      {user.role === 'doctor' && (
        <div className="stat-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          <StatCard label="Today's Patients" value={patients.length}               icon="👥" c1="#1E88E5" c2="#1565C0" />
          <StatCard label="Waiting"          value={waiting.length}                icon="⏱" c1="#E53935" c2="#B71C1C" />
          <StatCard label="Completed"        value={completed.length + billed.length} icon="✓" c1="#00897B" c2="#004D40" />
        </div>
      )}

      {/* Billing stats */}
      {user.role === 'billing' && (
        <div className="stat-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16, marginBottom:24 }}>
          <StatCard label="Pending Bills" value={completed.length} icon="⏱" c1="#F9A825" c2="#EF6C00" />
          <StatCard label="Billed Today"  value={billed.length}    icon="✓" c1="#00897B" c2="#004D40" />
          <StatCard label="Total Cases"   value={patients.length}  icon="👥" c1="#1E88E5" c2="#1565C0" />
        </div>
      )}

      {/* Patient table */}
      <Card noPad>
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${theme.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:15, fontWeight:700, color:theme.primary }}>
            Today's Patients
          </h3>
          <span style={{ fontSize:11, color:theme.muted }}>↻ updates every 8s</span>
        </div>
        <div className="table-scroll-wrapper">
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr><TH c="ID" /><TH c="Patient" /><TH c="Doctor" /><TH c="Status" /><TH c="Reg. Time" /></tr>
          </thead>
          <tbody>
            {tablePatients.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding:40, textAlign:'center', color:theme.muted }}>
                  {'No patients today'}
                </td>
              </tr>
            ) : tablePatients.map(p => (
              <tr key={p._id} style={{ borderBottom:'1px solid #EEF2F7', background: getRowBg(p.status) }}>
                <td style={{ padding:'12px 14px', fontWeight:700, color:theme.accent, fontFamily:'monospace', fontSize:12 }}>{p.patientId}</td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ fontWeight:600 }}>{p.name}</div>
                  <div style={{ fontSize:11, color:theme.muted }}>{p.age}y · {p.gender?.[0]}</div>
                </td>
                <td style={{ padding:'12px 14px', fontSize:12 }}>
                  {p.assignedDoctor?.name
                    ? <><div style={{ fontWeight:600 }}>{p.assignedDoctor.name}</div><div style={{ fontSize:11, color:theme.muted }}>{p.assignedDoctor.specialty}</div></>
                    : <span style={{ color:'#E53935', fontWeight:600, fontSize:12 }}>Not assigned</span>
                  }
                </td>
                <td style={{ padding:'12px 14px' }}><StatusBadge status={p.status} /></td>
                <td style={{ padding:'12px 14px', fontSize:12, color:theme.muted }}>{fmtTime(p.registrationTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>
    </div>)}