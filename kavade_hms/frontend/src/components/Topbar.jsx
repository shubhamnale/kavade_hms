import React from 'react'
import { useAuth } from '../context/AuthContext'
import { theme, ROLE_COLORS } from '../theme'

export default function Topbar({ pageTitle, onMenuToggle }) {
  const { user } = useAuth()
  return (
    <div className="hms-topbar" style={{ position:'fixed', left:240, top:0, right:0, height:60, background:'#fff', borderBottom:`1px solid ${theme.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', zIndex:99 }}>
      <div style={{ display:'flex', alignItems:'center' }}>
        <button className="sidebar-toggle-btn" onClick={onMenuToggle} aria-label="Toggle menu">☰</button>
        <div>
          <h3 style={{ fontSize:15, fontWeight:700, color:theme.primary }}>{pageTitle}</h3>
          <p style={{ fontSize:11, color:theme.muted }}>
            {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
          </p>
        </div>
      </div>
      <div className="topbar-role-chip" style={{ background:ROLE_COLORS[user.role] + '18', color:ROLE_COLORS[user.role], padding:'5px 14px', borderRadius:20, fontSize:12, fontWeight:700, textTransform:'uppercase' }}>
        {user.role}
      </div>
    </div>
  )
}
