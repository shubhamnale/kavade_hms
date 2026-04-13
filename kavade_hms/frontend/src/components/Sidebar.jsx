import React from 'react'
import { useAuth } from '../context/AuthContext'
import { theme, ROLE_COLORS, NAV_CONFIG } from '../theme'

export default function Sidebar({ active, setActive, isOpen, onClose }) {
  const { user, logout } = useAuth()
  const navSections = NAV_CONFIG[user.role] || []

  return (
    <div className={`hms-sidebar${isOpen ? ' sidebar-open' : ''}`} style={{ position:'fixed', left:0, top:0, width:240, height:'100vh', background:theme.primary, display:'flex', flexDirection:'column', zIndex:100 }}>

      <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:'#fff', lineHeight:1.2 }}>
          Kavade Nursing Home
        </h1>
        <p style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:3 }}>Hospital Management System</p>
      </div>

      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,.08)', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:ROLE_COLORS[user.role], display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:16, flexShrink:0 }}>
          {user.name[0]}
        </div>
        <div>
          <p style={{ color:'#fff', fontSize:13, fontWeight:600 }}>{user.name}</p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,.38)', textTransform:'capitalize' }}>{user.role}</p>
        </div>
      </div>

      <div style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
        {navSections.map(sec => (
          <div key={sec.section}>
            <p style={{ padding:'8px 16px 4px', fontSize:10, fontWeight:700, color:'rgba(255,255,255,.3)', letterSpacing:1, textTransform:'uppercase' }}>
              {sec.section}
            </p>
            {sec.items.map(item => (
              <div
                key={item.id}
                onClick={() => { setActive(item.id); if (onClose) onClose(); }}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  padding:'10px 20px', fontSize:13, fontWeight:500,
                  color: active === item.id ? '#42A5F5' : 'rgba(255,255,255,.65)',
                  cursor:'pointer',
                  borderLeft: `3px solid ${active === item.id ? '#42A5F5' : 'transparent'}`,
                  background: active === item.id ? 'rgba(30,136,229,.2)' : 'transparent',
                  transition:'all .2s',
                }}
              >
                <span style={{ fontSize:15, width:20, textAlign:'center' }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding:16, borderTop:'1px solid rgba(255,255,255,.08)' }}>
        <div onClick={logout} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 20px', fontSize:13, fontWeight:500, color:'#EF9A9A', cursor:'pointer' }}>
          <span>⏻</span> Logout
        </div>
      </div>
    </div>
  )
}
