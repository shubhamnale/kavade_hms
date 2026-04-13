import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useAuth }       from '../context/AuthContext'
import { patientsAPI }   from '../api'
import { Card, StatusBadge, PageHeader, Btn, FilterTabs, getRowBg } from '../components/UI'
import AddPatientModal   from '../components/AddPatientModal'
import ConsultModal      from '../components/ConsultModal'
import BillModal         from '../components/BillModal'
import { theme, STATUS_COLORS } from '../theme'
import './PatientsPage.css'

/* ── Helpers ──────────────────────────────────────────────── */
function formatTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}

/* ── Skeleton Row ─────────────────────────────────────────── */
const SKELETON_WIDTHS = [50, 120, 40, 100, 60, 80, 70]

function SkeletonRow() {
  return (
    <tr style={{ borderBottom: '1px solid #EEF2F7' }}>
      {SKELETON_WIDTHS.map((w, i) => (
        <td key={i} style={{ padding: '13px 14px' }}>
          <div className="patients-skeleton-cell" style={{ width: w }} />
        </td>
      ))}
    </tr>
  )
}

/* ── Status Checkboxes ────────────────────────────────────── */
const ALL_STATUSES  = ['Registered', 'Doctor Pending', 'Doctor Completed', 'Billed']
const STATUS_EMOJIS = {
  Registered: '🔴',
  'Doctor Pending': '🔵',
  'Doctor Completed': '🟡',
  Billed: '🟢',
}

function StatusCheckboxes({ selected, onChange }) {
  const toggle = s =>
    onChange(selected.includes(s) ? selected.filter(x => x !== s) : [...selected, s])

  return (
    <div className="patients-status-checkboxes">
      {ALL_STATUSES.map(s => {
        const active = selected.includes(s)
        const c      = STATUS_COLORS[s]
        return (
          <button
            key={s}
            onClick={() => toggle(s)}
            className="patients-status-btn"
            style={{
              border:     `1.5px solid ${active ? c.border : theme.border}`,
              background: active ? c.bg   : '#fff',
              color:      active ? c.dot  : theme.muted,
              boxShadow:  active ? `0 0 0 2px ${c.border}` : 'none',
            }}
          >
            <span
              className="patients-status-btn__box"
              style={{
                border:     `2px solid ${active ? c.dot : theme.border}`,
                background: active ? c.dot : 'transparent',
              }}
            >
              {active && <span className="patients-status-btn__check">✓</span>}
            </span>
            {STATUS_EMOJIS[s]} {STATUS_COLORS[s].label}
          </button>
        )
      })}

      {selected.length > 0 ? (
        <button
          onClick={() => onChange([])}
          className="patients-filter-action-btn"
          style={{ color: theme.muted }}
        >
          Clear
        </button>
      ) : (
        <button
          onClick={() => onChange([...ALL_STATUSES])}
          className="patients-filter-action-btn"
          style={{ color: theme.accent }}
        >
          All
        </button>
      )}
    </div>
  )
}

/* ── Table Header Cell ────────────────────────────────────── */
function TH({ c }) {
  return (
    <th
      style={{
        color:        theme.muted,
        borderBottom: `2px solid ${theme.border}`,
        background:   '#F8FAFC',
      }}
    >
      {c}
    </th>
  )
}

/* ── Page Component ───────────────────────────────────────── */
export default function PatientsPage({ doctors = [] }) {
  const { user } = useAuth()
  const [allPatients,   setAllPatients]   = useState([])
  const [loading,       setLoading]       = useState(true)
  const [fetching,      setFetching]      = useState(false)
  const [modal,         setModal]         = useState(null)
  const [dateFilter,    setDateFilter]    = useState('today')
  const [search,        setSearch]        = useState('')
  const [statusFilters, setStatusFilters] = useState([])
  const fetchRef = useRef(null)

  const showDateFilter = user.role === 'admin' || user.role === 'doctor'
  const canRegister    = user.role === 'reception' || user.role === 'admin'

  /* ── Data Fetching ──────────────────────────────────────── */
  const fetchPatients = useCallback(async (showSpinner = false) => {
    if (fetchRef.current) clearTimeout(fetchRef.current)
    fetchRef.current = setTimeout(async () => {
      if (showSpinner) setLoading(true); else setFetching(true)
      try {
        const params = {}
        if (showDateFilter && dateFilter) params.filter = dateFilter
        if (search.trim()) params.search = search.trim()
        const { data } = await patientsAPI.getAll(params)
        setAllPatients(data.data)
      } catch (e) {
        console.error('fetchPatients:', e)
      } finally {
        setLoading(false)
        setFetching(false)
      }
    }, search ? 350 : 0)
  }, [dateFilter, search, showDateFilter])

  useEffect(() => { fetchPatients(true) }, [fetchPatients])
  useEffect(() => {
    const id = setInterval(() => fetchPatients(false), 8000)
    return () => clearInterval(id)
  }, [fetchPatients])

  /* ── Derived State ──────────────────────────────────────── */
  const visiblePatients = useMemo(
    () => statusFilters.length === 0
      ? allPatients
      : allPatients.filter(p => statusFilters.includes(p.status)),
    [allPatients, statusFilters]
  )

  const addPatient    = p => setAllPatients(prev => [p, ...prev])
  const updatePatient = u => setAllPatients(prev => prev.map(p => p._id === u._id ? u : p))

  const pageTitle =
    user.role === 'doctor'    ? 'My Patients'      :
    user.role === 'billing'   ? 'Billing Cases'    :
    user.role === 'reception' ? "Today's Patients" : 'All Patients'

  /* ── Column visibility ──────────────────────────────────── */
  const showActionCol  = user.role !== 'reception'
  const showConsultCol = user.role === 'doctor'
  const colCount       = 6 + (showActionCol ? 1 : 0) + (showConsultCol ? 1 : 0)

  /* ── Action Buttons ─────────────────────────────────────── */
  const getActions = p => {
    const btns = []
    if (user.role === 'doctor') {
      if (p.status === 'Registered' || p.status === 'Doctor Pending')
        btns.push(<Btn key="consult" small onClick={() => setModal({ type: 'consult', patient: p })}>🩺 Consult</Btn>)
      if (p.status === 'Doctor Completed') {
        btns.push(<Btn key="edit"  small outline onClick={() => setModal({ type: 'consult', patient: p })}>✏ Edit</Btn>)
        btns.push(<Btn key="print" small outline onClick={() => setModal({ type: 'print',   patient: p })}>🖨 Print</Btn>)
      }
      if (p.status === 'Billed')
        btns.push(<Btn key="view" small outline onClick={() => setModal({ type: 'bill', patient: p })}>📋 View</Btn>)
    }
    if (user.role === 'billing') {
      if (p.status === 'Doctor Completed')
        btns.push(<Btn key="bill" small color={theme.success} onClick={() => setModal({ type: 'bill', patient: p })}>💳 Collect</Btn>)
      if (p.status === 'Billed')
        btns.push(<Btn key="view" small outline onClick={() => setModal({ type: 'bill', patient: p })}>📋 View</Btn>)
    }
    if (user.role === 'admin') {
      if (p.status !== 'Billed')
        btns.push(<Btn key="consult" small color={theme.accent} onClick={() => setModal({ type: 'consult', patient: p })}>🩺 Consult</Btn>)
      if (p.status === 'Billed' || p.status === 'Doctor Completed')
        btns.push(<Btn key="view" small outline onClick={() => setModal({ type: 'bill', patient: p })}>📋 View</Btn>)
    }
    if (user.role === 'reception') {
      if (p.status === 'Billed')
        btns.push(<Btn key="view" small outline onClick={() => setModal({ type: 'bill', patient: p })}>📋 View</Btn>)
    }
    return btns
  }

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="page-content patients-page">

      {/* Page Header */}
      <PageHeader
        title={pageTitle}
        subtitle={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            {visiblePatients.length} of {allPatients.length} patients
            {fetching && (
              <span className="patients-sync-label" style={{ color: theme.accent }}>
                <span
                  className="patients-sync-spinner"
                  style={{ borderColor: theme.accent, borderTopColor: 'transparent' }}
                />
                Syncing…
              </span>
            )}
          </span>
        }
      >
        {showDateFilter && (
          <FilterTabs
            value={dateFilter}
            onChange={f => setDateFilter(f)}
            options={['today', 'week', 'month', 'year']}
          />
        )}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search name or ID…"
          className="patients-search"
          style={{ border: `1.5px solid ${theme.border}` }}
        />
        {canRegister && (
          <Btn onClick={() => setModal({ type: 'add' })}>＋ New Patient</Btn>
        )}
      </PageHeader>

      {/* Status Filter Bar */}
      <div className="patients-filter-bar">
        <span className="patients-filter-bar__label" style={{ color: theme.muted }}>
          Filter
        </span>
        <StatusCheckboxes selected={statusFilters} onChange={setStatusFilters} />
      </div>

      {/* Patient Table */}
      <Card noPad>
        <div className="patients-table-wrapper">
          {loading ? (
            <table className="patients-table">
              <thead>
                <tr>
                  {['ID', 'Patient', 'Age', 'Doctor', 'Time', 'Status'].map(c => (
                    <TH key={c} c={c} />
                  ))}
                  {showActionCol && <TH c="Action" />}
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : (
            <table className="patients-table">
              <thead>
                <tr>
                  <TH c="ID" />
                  <TH c="Patient" />
                  <TH c="Age" />
                  <TH c="Doctor" />
                  <TH c="Reg. Time" />
                  {showConsultCol && <TH c="Consult Time" />}
                  <TH c="Status" />
                  {showActionCol && <TH c="Action" />}
                </tr>
              </thead>
              <tbody>
                {visiblePatients.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="patients-empty" style={{ color: theme.muted }}>
                      <div className="patients-empty__icon">🔍</div>
                      {statusFilters.length > 0
                        ? 'No patients match selected filters'
                        : 'No patients found'}
                    </td>
                  </tr>
                ) : (
                  visiblePatients.map(p => {
                    const actions = getActions(p)
                    return (
                      <tr
                        key={p._id}
                        style={{ background: getRowBg(p.status), cursor: actions.length > 0 ? 'pointer' : 'default' }}
                        onMouseEnter={e => { if (actions.length > 0) e.currentTarget.style.filter = 'brightness(0.97)' }}
                        onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                      >
                        {/* ID */}
                        <td className="patients-cell--id" style={{ color: theme.accent }}>
                          {p.patientId}
                        </td>

                        {/* Patient name + phone */}
                        <td>
                          <div className="patients-cell--name-primary">{p.name}</div>
                          <div className="patients-cell--name-secondary" style={{ color: theme.muted }}>
                            {p.phone}
                          </div>
                        </td>

                        {/* Age / Gender */}
                        <td className="patients-cell--age" style={{ color: theme.muted }}>
                          {p.age}y {p.gender?.[0]}
                        </td>

                        {/* Doctor */}
                        <td>
                          {p.assignedDoctor ? (
                            <>
                              <div className="patients-cell--doctor-primary">{p.assignedDoctor.name}</div>
                              <div className="patients-cell--doctor-secondary" style={{ color: theme.muted }}>
                                {p.assignedDoctor.specialty}
                              </div>
                            </>
                          ) : (
                            <span style={{ color: '#999', fontSize: 12 }}>—</span>
                          )}
                        </td>

                        {/* Registration / Billing Time */}
                        <td className="patients-cell--time" style={{ color: theme.muted }}>
                          {formatTime(p.registrationTime)}
                          {p.billingTime && (
                            <div className="patients-cell--billing-time" style={{ color: theme.success }}>
                              💳 {formatTime(p.billingTime)}
                            </div>
                          )}
                        </td>

                        {/* Consult Duration (doctor only) */}
                        {showConsultCol && (
                          <td className="patients-cell--consult">
                            {p.consultationMinutes > 0 ? (
                              <span
                                className="patients-cell--consult-value"
                                style={{ color: p.consultationMinutes > 10 ? '#E65100' : theme.success }}
                              >
                                ⏱ {p.consultationMinutes} min
                              </span>
                            ) : (
                              <span style={{ color: theme.muted }}>—</span>
                            )}
                          </td>
                        )}

                        {/* Status Badge */}
                        <td>
                          <StatusBadge status={p.status} />
                        </td>

                        {/* Action Buttons */}
                        {showActionCol && (
                          <td>
                            <div className="patients-actions">{actions}</div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Modals */}
      {modal?.type === 'add' && (
        <AddPatientModal
          onClose={() => setModal(null)}
          onSave={p => { addPatient(p); setModal(null) }}
        />
      )}
      {modal?.type === 'consult' && (
        <ConsultModal
          patient={modal.patient}
          doctors={doctors}
          currentUser={user}
          onClose={() => setModal(null)}
          onSave={u => { updatePatient(u); setModal(null) }}
        />
      )}
      {(modal?.type === 'bill' || modal?.type === 'print') && (
        <BillModal
          mode={modal.type === 'print' ? 'print' : 'billing'}
          patient={modal.patient}
          currentUser={user}
          onClose={() => setModal(null)}
          onSave={u => { updatePatient(u); setModal(null) }}
        />
      )}
    </div>
  )
}