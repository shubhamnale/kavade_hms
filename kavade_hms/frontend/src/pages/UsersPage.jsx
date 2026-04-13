import React, { useState, useEffect } from 'react'
import { usersAPI } from '../api'
import { Card, Spinner, PageHeader, Modal, Field, Alert, BtnSpinner, inputStyle, Btn } from '../components/UI'
import { theme, ROLE_COLORS } from '../theme'

export default function UsersPage({ doctors }) {
  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState({ username:'', password:'', name:'', role:'reception', doctorRef:'' })
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    usersAPI.getAll().then(r => setUsers(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.name) return setError('Username, password and name are required.')
    setSaving(true); setError('')
    try {
      const { data } = await usersAPI.create(form)
      setUsers(prev => [...prev, data.data])
      setModal(false)
      setForm({ username:'', password:'', name:'', role:'reception', doctorRef:'' })
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to create user.')
    } finally { setSaving(false) }
  }

  const toggleActive = async u => {
    try {
      await usersAPI.update(u._id, { isActive: !u.isActive })
      setUsers(prev => prev.map(x => x._id === u._id ? { ...x, isActive: !x.isActive } : x))
    } catch {}
  }

  const TH = ({ c }) => (
    <th style={{ padding:'10px 14px', textAlign:'left', fontSize:11, fontWeight:700, color:theme.muted, textTransform:'uppercase', letterSpacing:'.5px', borderBottom:`2px solid ${theme.border}`, background:'#F8FAFC' }}>{c}</th>
  )

  return (
    <div className="page-content" style={{ padding:28, animation:'fadeIn .35s ease' }}>
      <PageHeader title="User Accounts" subtitle="Manage system access and roles">
        <Btn onClick={() => setModal(true)}>＋ Add User</Btn>
      </PageHeader>

      <Card noPad>
        <div className="table-scroll-wrapper">
        {loading ? <Spinner /> : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr><TH c="Username" /><TH c="Full Name" /><TH c="Role" /><TH c="Linked Doctor" /><TH c="Status" /><TH c="Action" /></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id} style={{ borderBottom:'1px solid #EEF2F7' }}>
                  <td style={{ padding:'12px 14px', fontWeight:700, color:theme.accent, fontFamily:'monospace' }}>{u.username}</td>
                  <td style={{ padding:'12px 14px', fontWeight:600 }}>{u.name}</td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background:(ROLE_COLORS[u.role]||'#607D8B')+'22', color:ROLE_COLORS[u.role]||'#607D8B' }}>
                      {u.role?.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px', fontSize:12, color:theme.muted }}>
                    {u.doctorRef?.name || '—'}
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600, background: u.isActive ? '#E8F5E9' : '#FFEBEE', color: u.isActive ? '#2E7D32' : theme.danger }}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ padding:'12px 14px' }}>
                    <Btn small outline onClick={() => toggleActive(u)}>{u.isActive ? 'Deactivate' : 'Activate'}</Btn>
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={6} style={{ padding:40, textAlign:'center', color:theme.muted }}>No users found</td></tr>}
            </tbody>
          </table>
        )}
        </div>
      </Card>

      {modal && (
        <Modal title="Create User Account" onClose={() => setModal(false)} width={500}>
          <Alert type="err" msg={error} />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <Field label="Username *"><input style={inputStyle} value={form.username} onChange={e => set('username', e.target.value)} placeholder="login username" /></Field>
            <Field label="Password *"><input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 6 characters" /></Field>
            <Field label="Full Name *"><input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Display name" /></Field>
            <Field label="Role *">
              <select style={inputStyle} value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="reception">Reception</option>
                <option value="doctor">Doctor</option>
                <option value="billing">Billing</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
          </div>
          {form.role === 'doctor' && (
            <Field label="Link to Doctor Profile *">
              <select style={inputStyle} value={form.doctorRef} onChange={e => set('doctorRef', e.target.value)}>
                <option value="">— Select Doctor Profile —</option>
                {(doctors || []).map(d => <option key={d._id} value={d._id}>{d.name} · {d.specialty}</option>)}
              </select>
              <p style={{ fontSize:11, color:theme.muted, marginTop:4 }}>⚠ Must be linked so auto-assignment works correctly.</p>
            </Field>
          )}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
            <Btn outline onClick={() => setModal(false)}>Cancel</Btn>
            <Btn onClick={handleCreate} disabled={saving}>{saving && <BtnSpinner />} Create User</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
