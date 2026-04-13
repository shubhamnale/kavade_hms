import React, { useState, useCallback, useRef } from 'react'
import { reportsAPI } from '../api'
import { Card, PageHeader, FilterTabs } from '../components/UI'
import { theme, STATUS_COLORS } from '../theme'
import useAutoRefresh from '../hooks/useAutoRefresh'
import './TimingPage.css'

/* ── Helpers ──────────────────────────────────────────────── */
function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
}

/* ── Skeleton Rows ────────────────────────────────────────── */
const SKELETON_WIDTHS = [60, 110, 80, 70, 70, 60, 60, 50, 60, 55, 55]

function SkeletonRows() {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '1px solid #EEF2F7' }}>
      {SKELETON_WIDTHS.map((w, ci) => (
        <td key={ci} style={{ padding: '12px 14px' }}>
          <div
            className="timing-skeleton-cell"
            style={{ width: w, animationDelay: `${i * 0.07}s` }}
          />
        </td>
      ))}
    </tr>
  ))
}

/* ── Stat Card ────────────────────────────────────────────── */
function StatCard({ label, value, color }) {
  const isLoading = value === '…'
  return (
    <div className="timing-stat-card" style={{ borderLeftColor: color }}>
      <p className="timing-stat-card__label" style={{ color: theme.muted }}>
        {label}
      </p>
      <p
        className={`timing-stat-card__value${isLoading ? ' timing-stat-card__value--loading' : ''}`}
        style={{ color }}
      >
        {value}
      </p>
    </div>
  )
}

/* ── Table Header Cell ────────────────────────────────────── */
const TH = ({ c }) => (
  <th
    style={{
      borderBottom: `2px solid ${theme.border}`,
      background: '#F8FAFC',
      color: theme.muted,
    }}
  >
    {c}
  </th>
)

/* ── Page Component ───────────────────────────────────────── */
export default function TimingPage() {
  const [data,      setData]      = useState([])
  const [firstLoad, setFirstLoad] = useState(true)
  const [filter,    setFilter]    = useState('today')

  const firstLoadRef = useRef(true)

  const load = useCallback(async () => {
    try {
      const { data: res } = await reportsAPI.timing(filter)
      setData(res.data)
    } catch (e) {
      console.error(e)
    } finally {
      if (firstLoadRef.current) {
        firstLoadRef.current = false
        setFirstLoad(false)
      }
    }
  }, [filter])

  const handleFilterChange = (f) => {
    setFilter(f)
    setFirstLoad(true)
    firstLoadRef.current = true
    setData([])
  }

  useAutoRefresh(load, 10000)

  /* ── Derived stats ──────────────────────────────────────── */
  const total      = data.length
  const avgConsult = data
    .filter(d => d.consultationMinutes > 0)
    .reduce((s, d, _, arr) => s + d.consultationMinutes / arr.length, 0)
  const revenue    = data.reduce((s, d) => s + (d.totalAmount || 0), 0)
  const billed     = data.filter(d => d.status === 'Billed').length

  const stats = [
    { label: 'Total Patients',   value: firstLoad ? '…' : total,                                  color: '#1E88E5' },
    { label: 'Avg Consult Time', value: firstLoad ? '…' : `${Math.round(avgConsult || 0)} min`,   color: '#F9A825' },
    { label: 'Billed',           value: firstLoad ? '…' : billed,                                 color: '#43A047' },
    { label: 'Revenue',          value: firstLoad ? '…' : `₹${revenue.toLocaleString('en-IN')}`,  color: '#8E24AA' },
  ]

  /* ── Render ─────────────────────────────────────────────── */
  return (
    <div className="page-content timing-page">
      <PageHeader title="Timing Log" subtitle="Auto-refreshing every 10s">
        <FilterTabs value={filter} onChange={handleFilterChange} />
      </PageHeader>

      {/* Stat Cards */}
      <div className="timing-stat-grid">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>

      {/* Patient Timeline Table */}
      <Card noPad>
        <div
          className="timing-card-header"
          style={{ borderBottom: `1px solid ${theme.border}` }}
        >
          <h3 className="timing-card-header__title" style={{ color: theme.primary }}>
            Patient Timeline
          </h3>
          {!firstLoad && (
            <span className="timing-card-header__count" style={{ color: theme.muted }}>
              {total} record{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="timing-table-wrapper">
          <table className="timing-table">
            <thead>
              <tr>
                <TH c="ID"/>
                <TH c="Patient"/>
                <TH c="Doctor"/>
                <TH c="Status"/>
                <TH c="Reg Time"/>
                <TH c="Consult Start"/>
                <TH c="Consult End"/>
                <TH c="Duration"/>
                <TH c="Bill Time"/>
                <TH c="Payment"/>
                <TH c="Amount"/>
              </tr>
            </thead>
            <tbody>
              {firstLoad ? (
                <SkeletonRows />
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={11} className="timing-empty" style={{ color: theme.muted }}>
                    No data for this period
                  </td>
                </tr>
              ) : (
                data.map(p => {
                  const sc = STATUS_COLORS[p.status] || {}
                  return (
                    <tr
                      key={p.patientId}
                      style={{ background: sc.bg || '#fff' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F0F7FF' }}
                      onMouseLeave={e => { e.currentTarget.style.background = sc.bg || '#fff' }}
                    >
                      {/* ID */}
                      <td className="timing-cell--id" style={{ color: theme.accent }}>
                        {p.patientId}
                      </td>

                      {/* Name */}
                      <td className="timing-cell--name">{p.name}</td>

                      {/* Doctor */}
                      <td className="timing-cell--doctor" style={{ color: theme.muted }}>
                        {p.doctor}
                      </td>

                      {/* Status */}
                      <td>
                        <span
                          className="timing-status-badge"
                          style={{
                            background: sc.bg,
                            borderColor: sc.border || '#eee',
                          }}
                        >
                          <span
                            className="timing-status-badge__dot"
                            style={{ background: sc.dot }}
                          />
                          {p.status}
                        </span>
                      </td>

                      {/* Registration Time */}
                      <td className="timing-cell--time">
                        <span className="timing-cell__date-prefix" style={{ color: theme.muted }}>
                          {fmtDate(p.registrationTime)}{' '}
                        </span>
                        {fmt(p.registrationTime)}
                      </td>

                      {/* Consult Start */}
                      <td className="timing-cell--time">{fmt(p.consultationStart)}</td>

                      {/* Consult End */}
                      <td className="timing-cell--time">{fmt(p.consultationEnd)}</td>

                      {/* Duration */}
                      <td>
                        {p.consultationMinutes > 0 ? (
                          <span
                            className="timing-duration"
                            style={{
                              color: p.consultationMinutes > 10 ? '#E65100' : theme.success,
                            }}
                          >
                            {p.consultationMinutes} min
                          </span>
                        ) : (
                          <span style={{ color: theme.muted }}>—</span>
                        )}
                      </td>

                      {/* Bill Time */}
                      <td className="timing-cell--time">{fmt(p.billingTime)}</td>

                      {/* Payment Method */}
                      <td>
                        {p.paymentMethod ? (
                          <span
                            className={`timing-payment-badge timing-payment-badge--${
                              p.paymentMethod === 'Online' ? 'online' : 'offline'
                            }`}
                          >
                            {p.paymentMethod}
                          </span>
                        ) : '—'}
                      </td>

                      {/* Amount */}
                      <td className="timing-cell--amount" style={{ color: theme.success }}>
                        {p.totalAmount ? `₹${p.totalAmount.toLocaleString('en-IN')}` : '—'}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}