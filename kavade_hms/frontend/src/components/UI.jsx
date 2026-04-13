import React from 'react'
import { theme, STATUS_COLORS } from '../theme'

export function Spinner({ text = 'Loading…' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:60, gap:12, color:theme.muted }}>
      <div style={{ width:24, height:24, border:`2px solid ${theme.border}`, borderTopColor:theme.accent, borderRadius:'50%', animation:'spin .7s linear infinite' }} />
      <span style={{ fontSize:14 }}>{text}</span>
    </div>
  )
}

export function BtnSpinner() {
  return <span style={{ width:14, height:14, display:'inline-block', border:'2px solid rgba(255,255,255,.35)', borderTopColor:'#fff', borderRadius:'50%', animation:'spin .7s linear infinite' }} />
}

export function Alert({ type = 'err', msg }) {
  if (!msg) return null
  const s = {
    err: { background:'#FFEBEE', color:'#C62828', border:'1px solid #FFCDD2' },
    ok:  { background:'#E8F5E9', color:'#1B5E20', border:'1px solid #C8E6C9' },
  }
  return <div style={{ padding:'12px 16px', borderRadius:8, fontSize:14, marginBottom:18, ...s[type] }}>{msg}</div>
}

export function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || { bg:'#F5F5F5', dot:'#9E9E9E', border:'#eee', label: status }
  return (
    <span className="status-badge" style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:s.bg, border:`1px solid ${s.border}`, whiteSpace:'nowrap' }}>
      <span style={{ width:7, height:7, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {s.label}
    </span>
  )
}

export function getRowBg(status) {
  return STATUS_COLORS[status]?.bg || '#fff'
}

export function StatCard({ label, value, icon, c1, c2 }) {
  return (
    <div className="stat-card" style={{ background:`linear-gradient(135deg,${c1},${c2})`, color:'#fff', borderRadius:14, padding:24, position:'relative', overflow:'hidden' }}>
      <div className="stat-bubble" style={{ position:'absolute', right:-20, bottom:-20, width:80, height:80, background:'rgba(255,255,255,.1)', borderRadius:'50%' }} />
      <div className="stat-icon" style={{ fontSize:32 }}>{icon}</div>
      <div className="stat-value" style={{ fontSize:36, fontWeight:700, margin:'10px 0 6px' }}>{value}</div>
      <div className="stat-label" style={{ fontSize:13, opacity:.85, fontWeight:600, letterSpacing:'.5px', textTransform:'uppercase' }}>{label}</div>
    </div>
  )
}

export function Card({ children, style = {}, noPad = false }) {
  return (
    <div style={{ background:'#fff', borderRadius:14, boxShadow:'0 2px 12px rgba(0,0,0,.06)', padding:noPad ? 0 : 20, overflow:noPad ? 'visible' : 'visible', ...style }}>
      {children}
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:18 }}>
      <label style={{ fontSize:12, fontWeight:700, color:theme.muted, textTransform:'uppercase', letterSpacing:'.5px' }}>{label}</label>
      {children}
    </div>
  )
}

export const inputStyle = {
  padding: '12px 16px',
  border: `1.5px solid ${theme.border}`,
  borderRadius: 8,
  fontSize: 16,
  background: '#FAFAFA',
  outline: 'none',
  width: '100%',
  fontFamily: "'DM Sans', sans-serif",
}

export function Modal({ title, onClose, children, width = 580 }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()} style={{ position:'fixed', inset:0, background:'rgba(21,101,192,.55)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(4px)', padding:'0 12px' }}>
      <div className="hms-modal-inner" style={{ background:'#fff', borderRadius:18, padding:32, width, maxWidth:'100%', maxHeight:'90vh', overflowY:'auto', boxShadow:'0 20px 60px rgba(0,0,0,.25)', animation:'fadeIn .3s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:26 }}>
          <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:theme.primary }}>{title}</h3>
          <button onClick={onClose} style={{ width:36, height:36, border:'none', background:'#f5f5f5', borderRadius:'50%', fontSize:18, cursor:'pointer' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
      <div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:32, color:theme.primary }}>{title}</h2>
        {subtitle && <p style={{ fontSize:14, color:theme.muted, marginTop:6 }}>{subtitle}</p>}
      </div>
      {children && <div style={{ display:'flex', gap:10, alignItems:'center' }}>{children}</div>}
    </div>
  )
}

export function Btn({ children, onClick, color = theme.accent, outline = false, disabled = false, small = false, style: ex = {} }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? '6px 14px' : '10px 20px',
      border: outline ? `1.5px solid ${color}` : 'none',
      borderRadius: 8,
      background: outline ? 'transparent' : color,
      color: outline ? color : '#fff',
      fontSize: small ? 13 : 15,
      fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? .7 : 1,
      display: 'inline-flex', alignItems: 'center', gap: 6,
      transition: 'all .2s',
      ...ex,
    }}>
      {children}
    </button>
  )
}

export function FilterTabs({ value, onChange, options = ['today','week','month','year'] }) {
  return (
    <div style={{ display:'flex', gap:5, background:'#F0F4F8', padding:5, borderRadius:10 }}>
      {options.map(o => (
        <button key={o} onClick={() => onChange(o)} style={{
          padding:'6px 16px', border:'none', borderRadius:7, fontSize:13, fontWeight:600,
          cursor:'pointer', transition:'all .2s',
          background: value === o ? '#fff' : 'transparent',
          color: value === o ? theme.accent : theme.muted,
          boxShadow: value === o ? '0 1px 4px rgba(0,0,0,.1)' : 'none',
        }}>
          {o.charAt(0).toUpperCase() + o.slice(1)}
        </button>
      ))}
    </div>
  )
}
