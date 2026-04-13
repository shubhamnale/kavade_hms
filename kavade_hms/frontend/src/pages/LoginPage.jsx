import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { Alert, BtnSpinner } from '../components/UI'

export default function LoginPage() {
  const { login } = useAuth()
  const [form,    setForm]    = useState({ username:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async () => {
    if (!form.username || !form.password) return setError('Please enter username and password.')
    setLoading(true); setError('')
    try {
      await login(form)
    } catch (e) {
      setError(e.response?.data?.message || 'Invalid credentials.')
      setLoading(false)
    }
  }

  return (
    <div className="login-page" style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0A2342 0%,#0D47A1 60%,#1565C0 100%)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
      {[{w:300,top:'8%',left:'-4%'},{w:200,top:'65%',left:'82%'},{w:400,top:'-8%',left:'62%'},{w:150,top:'75%',left:'-4%'}].map((c,i) => (
        <div className="login-orb" key={i} style={{ position:'absolute', borderRadius:'50%', background:'rgba(255,255,255,.03)', width:c.w, height:c.w, top:c.top, left:c.left }} />
      ))}

      <div className="login-card" style={{ background:'rgba(255,255,255,.05)', backdropFilter:'blur(20px)', border:'1px solid rgba(255,255,255,.1)', borderRadius:24, padding:'48px 44px', width:'100%', maxWidth:420, margin:'0 16px', animation:'fadeIn .5s ease' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🏥</div>
          <h1 className="login-title" style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:'#fff' }}>Kavade Nursing Home</h1>
          <p className="login-subtitle" style={{ color:'rgba(255,255,255,.5)', fontSize:13, marginTop:6 }}>Hospital Management System</p>
        </div>

        <Alert type="err" msg={error} />

        {[{key:'username',label:'Username',type:'text',ph:'Enter username'},{key:'password',label:'Password',type:'password',ph:'Enter password'}].map(f => (
          <div key={f.key} style={{ marginBottom:16 }}>
            <label style={{ display:'block', fontSize:11, fontWeight:700, color:'rgba(255,255,255,.55)', textTransform:'uppercase', letterSpacing:'.5px', marginBottom:6 }}>{f.label}</label>
            <input
              type={f.type} value={form[f.key]}
              onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              placeholder={f.ph}
              style={{ width:'100%', padding:'10px 14px', background:'rgba(255,255,255,.08)', border:'1.5px solid rgba(255,255,255,.15)', borderRadius:8, fontSize:14, color:'#fff', outline:'none' }}
            />
          </div>
        ))}

        <button onClick={handleSubmit} disabled={loading} style={{ width:'100%', padding:12, border:'none', borderRadius:8, background:'#42A5F5', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:8, opacity: loading ? .8 : 1 }}>
          {loading && <BtnSpinner />}
          {loading ? 'Authenticating…' : 'Sign In →'}
        </button>

       
      </div>
    </div>
  )
}
